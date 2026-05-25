/* eslint-disable style/brace-style */
import { Request, Response } from 'express';
import { join } from 'path';
import {
  CD_FX_FAIL,
  CdAssertReturn,
  CdFxReturn,
  CdFxStateLevel,
  IQuery,
} from '../../../sys/base/i-base';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { CdCtx, CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model';
import { CiCdRunnerService } from '../../../sys/dev-descriptor/services/cd-ci-runner.service';
import { DevDescriptorService } from '../../../sys/dev-descriptor/services/dev-descriptor.service';
import { mkdir } from 'fs/promises';
import fs from 'fs';
import { cdFx } from '../../../sys/base/cd-fx-return.util';
import { AppType, CdEnvName, VersionControlDescriptor } from '../../../sys/dev-descriptor/index';
import { inspect } from 'util';
import { GitOctokitController } from '../../cd-auto-git/controllers/octokit.controller';
import { inferCdObjType } from '../../../sys/utils/cd-naming.util';
import { DevModeAction } from '../../../sys/dev-mode/index';
import { executeCommand, executeCommand2, run, run2, runExt } from '../../../sys/utils/cmd.util';

import { fileURLToPath } from 'url';
import path from 'path';
import config from '../../../../config';
import { MOD_CRAFT_SYNC_DATASOURCE } from '../models/default.model';
import { VersionService } from '../../../sys/dev-descriptor/services/version.service';
import { ICdExecutionContext } from '../../../sys/dev-descriptor/models/runtime-descriptor.model';

// // const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export class TestBedService {
  cdToken;
  svDevDescriptors;
  private runner!: CiCdRunnerService;

  constructor() {
    this.svDevDescriptors = new DevDescriptorService();
  }

  init(): this {
    this.runner = new CiCdRunnerService();
    return this;
  }

  /**
   * Create a test-bed:
   * - get test bed config using moduleName, and moduleType
   * - use config to get the workshop modulule directory
   * - AutoGit.gitPush()
   * - AutoGit.gitPull()
   * @param moduleName
   * @param moduleType
   * @param cdToken
   * @returns
   */

  async create(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('TestBedService::create()/01');
    const cdObjType = inferCdObjType(this.constructor.name);
    CdLog.debug(`TestBedService::create()/cdObjType:${cdObjType}`);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModuleDescriptorAndWorkflow(
      cdCtx,
      DevModeAction.CREATE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
        appType: AppType.CdApiModule,
        oEnv: oEnv, // Pass the environment
      },
    );
    CdLog.debug(`TestBedService::create()/descriptor: ${inspect(descriptor, { depth: 3 })}`);
    CdLog.debug(`TestBedService::create()/workflowModel: ${inspect(workflowModel, { depth: 4 })}`);

    if (!workflowModel) {
      return cdFx(
        CdFxStateLevel.LogicalFailure,
        'TestBedService::create()/Workflow model is null or undefined.',
      );
    }

    return await this.runner.run(descriptor, workflowModel);
  }

  async pushFromOutput(
    versionControl: VersionControlDescriptor,
    dirName: string,
  ): Promise<CdFxReturn<null>> {
    try {
      const workshopDir = versionControl?.repository.directories?.find(
        (d) => d.name === dirName,
      )?.path;

      if (!workshopDir) {
        return cdFx(
          CdFxStateLevel.NotFound,
          'TestBedService::pushFromOutput()/Workshop directory not found.',
        );
      }

      CdLog.debug(`📦 Using workshop directory: ${workshopDir}`);

      // Check git status for uncommitted changes
      const statusOutput = await executeCommand('git status --porcelain', workshopDir);
      CdLog.debug(`📄 Git Status Output:\n${statusOutput || '[No Changes]'}`);

      if (!statusOutput.trim()) {
        return cdFx(CdFxStateLevel.Info, 'No changes to commit. Working tree clean.');
      }

      // Proceed to commit and push
      await executeCommand('git add .', workshopDir);

      try {
        await executeCommand('git commit -m "push from cd-cli workshop"', workshopDir);
      } catch (e: any) {
        // Possible logic error: changes not staged correctly or conflict
        return cdFx(
          CdFxStateLevel.LogicalFailure,
          `TestBedService::pushFromOutput()/Git commit failed: ${e.message}`,
        );
      }

      try {
        const pushResult = await executeCommand('git push', workshopDir);
        CdLog.debug(`📤 Git Push Output:\n${pushResult}`);
        return cdFx(CdFxStateLevel.Success, 'Successfully pushed from workshop.');
      } catch (e: any) {
        return cdFx(
          CdFxStateLevel.Warning,
          `TestBedService::pushFromOutput()/Git commit succeeded but push failed: ${e.message}`,
        );
      }
    } catch (e: any) {
      // Catch-all for unexpected or system-level errors
      return cdFx(
        CdFxStateLevel.SystemError,
        `TestBedService::pushFromOutput()/Unexpected error during Git push from workshop: ${e.message}`,
      );
    }
  }

  async cloneToTestBed(versionControl: VersionControlDescriptor): Promise<CdFxReturn<null>> {
    try {
      const testBedDir = versionControl?.repository.directories?.find(
        (d) => d.environment.name === CdEnvName.TEST_BED,
      )?.path;

      const repoUrl = versionControl?.repository?.url;

      if (!testBedDir || !repoUrl) {
        return cdFx(CdFxStateLevel.NotFound, 'Missing test-bed directory or repository URL.');
      }

      CdLog.debug(`🧹 Cleaning target directory: ${testBedDir}`);
      try {
        await executeCommand(`rm -rf ${testBedDir}`);
      } catch (cleanupErr: any) {
        return cdFx(
          CdFxStateLevel.Warning,
          `Directory cleanup failed. Continuing: ${cleanupErr.message}`,
        );
      }

      const parentDir = path.dirname(testBedDir);
      const targetFolder = path.basename(testBedDir);
      const cloneCommand = `git clone ${repoUrl} ${targetFolder}`;

      CdLog.debug(`📥 Executing Git clone:\n→ ${cloneCommand}\n→ In: ${parentDir}`);

      try {
        const cloneResult = await executeCommand(cloneCommand, parentDir);
        CdLog.debug(`📥 Clone output:\n${cloneResult}`);
        return cdFx(
          CdFxStateLevel.Success,
          `✅ Successfully cloned "${versionControl.repository.name}" to test-bed: ${testBedDir}`,
        );
      } catch (cloneErr: any) {
        return cdFx(
          CdFxStateLevel.Fatal,
          `❌ Git clone failed for "${versionControl.repository.name}": ${cloneErr.message}`,
        );
      }
    } catch (e: any) {
      return cdFx(
        CdFxStateLevel.SystemError,
        `⚠️ Unexpected error during clone to test-bed: ${e.message}`,
      );
    }
  }

  async pullToTestBed(versionControl: VersionControlDescriptor): Promise<CdFxReturn<null>> {
    try {
      const testBedDir = versionControl?.repository.directories?.find(
        (d) => d.environment.name === CdEnvName.TEST_BED,
      );

      if (!testBedDir?.path) {
        return cdFx(
          CdFxStateLevel.NotFound,
          '🚫 Test-bed directory not found in module descriptor.',
        );
      }

      const repoPath = testBedDir.path;
      CdLog.debug(`📁 TestBedService::pullToTestBed() → Using path: ${repoPath}`);

      // Confirm we're inside a git repo
      const isGitRepo = await executeCommand('git rev-parse --is-inside-work-tree', repoPath).catch(
        () => null,
      );

      if (!isGitRepo || isGitRepo.trim() !== 'true') {
        return cdFx(CdFxStateLevel.LogicalFailure, `❌ Not a Git repository: ${repoPath}`);
      }

      try {
        const remoteUrl = await executeCommand('git remote get-url origin', repoPath);
        CdLog.debug(`🔗 Remote origin: ${remoteUrl}`);
      } catch {
        return cdFx(CdFxStateLevel.Warning, `⚠️ Could not retrieve remote URL for: ${repoPath}`);
      }

      try {
        await executeCommand('git fetch --all', repoPath);
        await executeCommand('git update-ref ORIG_HEAD HEAD', repoPath);
        await executeCommand('git reset --hard origin/main', repoPath);
      } catch (e: any) {
        return cdFx(CdFxStateLevel.Recoverable, `⚠️ Failed during fetch/reset: ${e.message}`);
      }

      let pullResult: string;
      try {
        pullResult = await executeCommand('git pull', repoPath);
        CdLog.debug(`📥 Pull Result:\n${pullResult}`);
      } catch (e: any) {
        return cdFx(CdFxStateLevel.Fatal, `🔥 Git pull failed: ${e.message}`);
      }

      try {
        const changes = await executeCommand('git diff --name-status ORIG_HEAD HEAD', repoPath);
        if (changes.trim().length === 0) {
          CdLog.debug(`ℹ️ No new changes detected during pull.`);
          return cdFx(CdFxStateLevel.Info, `✅ Pull completed. No changes in: ${repoPath}`);
        } else {
          CdLog.debug(`🆕 Files changed:\n${changes}`);
          return cdFx(CdFxStateLevel.Success, `✅ Pull completed with updates in: ${repoPath}`);
        }
      } catch (e: any) {
        return cdFx(
          CdFxStateLevel.Warning,
          `⚠️ Pull succeeded, but diff check failed: ${e.message}`,
        );
      }
    } catch (e: any) {
      return cdFx(CdFxStateLevel.SystemError, `❗ Unexpected failure during pull: ${e.message}`);
    }
  }

  /**
   * Create a new application
   * CdApi:
   * - setup development environment
   *    - npm
   *    - mysql
   *    - redis
   *    - ssl
   * - migration files
   * - clone corpdesk if not yet done
   * - create repository for new module
   * - sync workstation to repository
   * - sync db data
   *
   * @param appDescriptor
   * @returns
   */
  async createByAi(d: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async createByJson(d: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async createByWizard(d: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async createByContext(d: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Creation failed: ${(error as Error).message}`,
      };
    }
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    try {
      /**
       * The q is allowed to be null
       * If null it is substituted by { where: {} }
       * Which would then fetch all the data
       */
      const payload = this.svDevDescriptors.setEnvelope('Read', {
        query: q ?? { where: {} },
      });
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Read failed: ${(error as Error).message}`,
      };
    }
  }

  async update(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting TestBedService::update()');
    CdLog.debug(`TestBedService::update()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`TestBedService::update()/moduleName: ${moduleName}`);
    CdLog.debug(`TestBedService::update()/oEnv: ${oEnv}`);
    CdLog.debug(`TestBedService::update()/repoName: ${repoName}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModuleDescriptorAndWorkflow(
      cdCtx,
      DevModeAction.UPDATE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
        appType: AppType.CdApiModule,
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `TestBedService::update()/ No valid workflowModel`,
      };
    }
    return await this.runner.run(descriptor, workflowModel);
  }

  async delete(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting TestBedService::delete()');
    CdLog.debug(`TestBedService::delete()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`TestBedService::delete()/moduleName: ${moduleName}`);
    CdLog.debug(`TestBedService::delete()/oEnv: ${oEnv}`);
    CdLog.debug(`TestBedService::delete()/repoName: ${repoName}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModuleDescriptorAndWorkflow(
      cdCtx,
      DevModeAction.DELETE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
        appType: AppType.CdApiModule,
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `TestBedService::delete()/ No valid workflowModel`,
      };
    }
    return await this.runner.run(descriptor, workflowModel);
  }

  async test(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting TestBedService::test()');
    CdLog.debug(`TestBedService::test()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`TestBedService::test()/moduleName: ${moduleName}`);
    CdLog.debug(`TestBedService::test()/oEnv: ${oEnv}`);
    CdLog.debug(`TestBedService::test()/repoName: ${repoName}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModuleDescriptorAndWorkflow(
      cdCtx,
      DevModeAction.TEST,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
        appType: AppType.CdApiModule,
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `TestBedService::delete()/ No valid workflowModel`,
      };
    }
    return await this.runner.run(descriptor, workflowModel);
  }

  async upgrade(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    version?: string,
    testTasks?: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting TestBedService::upgrade()');
    CdLog.debug(`TestBedService::upgrade()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`TestBedService::upgrade()/moduleName: ${moduleName}`);
    CdLog.debug(`TestBedService::upgrade()/oEnv: ${oEnv}`);
    CdLog.debug(`TestBedService::upgrade()/repoName: ${repoName}`);
    CdLog.debug(`TestBedService::upgrade()/version: ${version}`);
    CdLog.debug(`TestBedService::upgrade()/testTasks: ${testTasks}`);

    // 🔁 Convert version string to SemanticVersionObject
    const semanticResult = VersionService.toSemanticObject(version ?? '');
    if (semanticResult.state !== CdFxStateLevel.Success || !semanticResult.data) {
      return cdFx(CdFxStateLevel.LogicalFailure, `❌ Invalid version format: "${version}"`);
    }

    const versionObj = semanticResult.data;
    CdLog.debug(`Parsed semantic version:`, versionObj);

    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModuleDescriptorAndWorkflow(
      cdCtx,
      DevModeAction.UPGRADE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
        appType: AppType.CdApiModule,
        version: versionObj, // 👈 Pass object instead of string
        testTasks: testTasks !== undefined ? String(testTasks) : undefined, // 👈 Convert to string if needed
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `TestBedService::upgrade()/ No valid workflowModel`,
      };
    }
    return await this.runner.run(descriptor, workflowModel);
  }

  protected getTypeId(): number {
    return 1; // TestBed type
  }

  // Get all applications
  async getAllModules(): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    try {
      return await this.read(); // Fetch all applications
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve all apps: ${(error as Error).message}`,
      };
    }
  }

  // Get a single app by name
  async getModuleByName(name: string): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    try {
      // Validate input
      if (!name.trim()) {
        return {
          data: null,
          state: false,
          message: 'Application name is required.',
        };
      }

      // Define the query
      const q: IQuery = {
        select: ['cdObjId', 'cdObjName', 'cdObjGuid', 'jDetails'], // Fields to select
        where: { cdObjName: name }, // Fetch apps by name
      };

      return await this.read(q);
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve app by name: ${(error as Error).message}`,
      };
    }
  }

  async createModuleDirectories(moduleDir: string): Promise<CdFxReturn<null>> {
    try {
      CdLog.debug(`TestBedService::createModuleDirectories()/moduleDir: ${moduleDir}`);
      const directories = ['controllers', 'models', 'services'];

      for (const dir of directories) {
        const fullPath = join(moduleDir, dir);
        await mkdir(fullPath, { recursive: true });
      }

      return cdFx(CdFxStateLevel.Success, 'Module directories created successfully.');
    } catch (e: any) {
      return cdFx(CdFxStateLevel.Error, `Failed to create module directories: ${e.message}`);
    }
  }

  async addModuleToEntities(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      const moduleName = module.versionControl?.repository.name;
      const cdApiRoot = module.versionControl?.repository.directories?.find(
        (d) => d.environment.name === CdEnvName.LOCAL_CD_API,
      );

      if (!cdApiRoot?.path || !moduleName) {
        return cdFx(CdFxStateLevel.Error, 'Missing required cd-api root directory or module name');
      }

      CdLog.debug(`TestBed::addModuleToEntities() → cdApiRoot.path: ${cdApiRoot.path}`);

      const entitiesJsonPath = path.join(cdApiRoot.path, 'config', 'module-entities.json');

      CdLog.debug(`TestBed::addModuleToEntities() → Target JSON Path: ${entitiesJsonPath}`);

      if (!fs.existsSync(entitiesJsonPath)) {
        return cdFx(
          CdFxStateLevel.NotFound,
          `Entities config file not found at: ${entitiesJsonPath}`,
        );
      }

      const modules: any[] = JSON.parse(fs.readFileSync(entitiesJsonPath, 'utf8'));
      const exists = modules.some((m) => m.moduleName === moduleName && m.ctx === module.ctx);

      if (!exists) {
        modules.push({ moduleName, ctx: module.ctx, enabled: true });
        fs.writeFileSync(entitiesJsonPath, JSON.stringify(modules, null, 2), 'utf8');
        return cdFx(CdFxStateLevel.Success, `✅ Module "${moduleName}" added to entities list`);
      } else {
        return cdFx(
          CdFxStateLevel.Info,
          `ℹ️ Module "${moduleName}" already exists in entities list`,
        );
      }
    } catch (e: any) {
      return cdFx(CdFxStateLevel.Fatal, `❌ Failed to add module to entities list: ${e.message}`);
    }
  }
}
