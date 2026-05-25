/* eslint-disable style/brace-style */

import { Request, Response } from 'express';
import path, { basename, join } from 'path';
import { GenericService } from '../../../sys/base/generic-service';
import { HttpService } from '../../../sys/base/http.service';
import {
  CD_FX_FAIL,
  CdAssertReturn,
  CdFxReturn,
  CdFxStateLevel,
  IQuery,
} from '../../../sys/base/i-base';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model';
import { CdDescriptor } from '../../../sys/dev-descriptor/models/dev-descriptor.model';
import { CiCdRunnerService } from '../../../sys/dev-descriptor/services/cd-ci-runner.service';
import { DevDescriptorService } from '../../../sys/dev-descriptor/services/dev-descriptor.service';
import { DevModeAction, DevModeModel } from '../../../sys/dev-mode/models/dev-mode.model';
import { CdObjModel } from '../../../sys/moduleman/models/cd-obj.model';
import fs from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { cdFx } from '../../../sys/base/cd-fx-return.util';
import { inferCdObjType } from '../../../sys/utils/cd-naming.util';
import { executeCommand } from '../../../sys/utils/cmd.util';
import { CdAutoGitController } from '../../cd-auto-git/index';
import { VersionService } from '../../../sys/dev-descriptor/services/version.service';
import { CdAutoGitService } from '../../cd-auto-git/services/cd-auto-git.service';
import {
  AppType,
  CdChangeLogDescriptor,
  CdDocDescriptor,
  CdRoadmapDescriptor,
  CICdHistory,
  CICdPipeline,
} from '../../../sys/dev-descriptor/index';
import { CdDescriptorFileService } from './cd-descriptor-file.service';
import { ICdExecutionContext } from '../../../sys/dev-descriptor/models/runtime-descriptor.model';

export class CdModuleService {
  cdToken;
  svDevDescriptors;
  private svCiCdRunner!: CiCdRunnerService;

  constructor() {
    this.svDevDescriptors = new DevDescriptorService();
  }

  init(): this {
    this.svCiCdRunner = new CiCdRunnerService();
    return this;
  }

  /**
   * 
   * @param actionTargetName [2025-07-31 13:12:25] 🛠️ DevModeService::executeCrudCommand()/args:{
      actionTargetName: 'cd-module',
      name: 'cd-ai',
      oEnv: 'workshop',
      'o-env': 'workshop',
      repo: 'cd-ai'
    }
   * @param moduleName 
   * @param oEnv 
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
    CdLog.debug('Starting CdModuleService::create()');
    CdLog.debug(`CdModuleService::create()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleService::create()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleService::create()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleService::create()/repoName: ${repoName}`);
    const cdObjType = inferCdObjType(this.constructor.name);
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
        oEnv: oEnv,
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdModuleService::create()/ No valid workflowModel`,
      };
    }
    return await this.svCiCdRunner.run(descriptor, workflowModel);
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
    CdLog.debug('Starting CdModuleService::update()');
    CdLog.debug(`CdModuleService::update()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleService::update()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleService::update()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleService::update()/repoName: ${repoName}`);
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
        message: `CdModuleService::update()/ No valid workflowModel`,
      };
    }
    return await this.svCiCdRunner.run(descriptor, workflowModel);
  }

  async delete(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModuleService::delete()');
    CdLog.debug(`CdModuleService::delete()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleService::delete()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleService::delete()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleService::delete()/repoName: ${repoName}`);
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
        message: `CdModuleService::update()/ No valid workflowModel`,
      };
    }
    return await this.svCiCdRunner.run(descriptor, workflowModel);
  }

  async test(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModuleService::test()');
    CdLog.debug(`CdModuleService::test()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleService::test()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleService::test()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleService::test()/repoName: ${repoName}`);
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
        message: `CdModuleService::update()/ No valid workflowModel`,
      };
    }
    return await this.svCiCdRunner.run(descriptor, workflowModel);
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
    CdLog.debug('Starting CdModuleService::upgrade()');
    CdLog.debug(`CdModuleService::upgrade()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleService::upgrade()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleService::upgrade()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleService::upgrade()/repoName: ${repoName}`);
    CdLog.debug(`CdModuleService::upgrade()/version: ${version}`);
    CdLog.debug(`CdModuleService::upgrade()/testTasks: ${testTasks}`);

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
        version: versionObj, // 👈 Pass object instead of string
        testTasks: testTasks !== undefined ? String(testTasks) : undefined, // 👈 Convert to string if needed
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdModuleService::upgrade()/ No valid workflowModel`,
      };
    }
    return await this.svCiCdRunner.run(descriptor, workflowModel);
  }

  protected getTypeId(): number {
    return 1; // CdModule type
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

  /**
   * Creates the initial root files required for a new Corpdesk module.
   *
   * This method is used the first time a module is scaffolded. It:
   * - Creates standard documentation files: `README.md`, `CHANGELOG.md`, `LICENSE`, `package.json`
   * - Initializes `.cd` metadata files: `roadmap.json`, `changelog.json`, `doc.json`
   *
   * Version is hardcoded to `0.0.0` for new modules. Future increments will be managed
   * during the development lifecycle based on roadmap milestones and automated versioning logic.
   *
   * @param moduleDir Absolute path to the target module directory.
   * @param moduleDescriptor Metadata used to define and initialize the module identity.
   */
  async createModuleRootFiles(
    moduleDir: string,
    moduleDescriptor: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      // CdLog.debug(`CdModuleService::createRootFiles()/moduleDir: ${moduleDir}`);
      const cdDir = path.join(moduleDir, '.cd');
      const timestamp = new Date().toISOString();
      const initialVersion = '0.0.0';

      // ✅ Remove hello-api.txt
      const helloFile = path.join(moduleDir, 'hello-api.txt');
      try {
        await fs.promises.access(helloFile, fs.constants.F_OK);
        await fs.promises.unlink(helloFile);
      } catch {}

      // 🏗️ Ensure .cd directory exists
      await fs.promises.mkdir(cdDir, { recursive: true });

      // 📄 Create generic files
      const textFileMap: Record<string, string> = {
        'README.md': `# ${moduleDescriptor.name}\n\n${moduleDescriptor.description || 'Corpdesk module.'}`,
        'CHANGELOG.md': `# Changelog\n\n## [${initialVersion}]\n- Initial module creation.`,
        LICENSE: `MIT License\n\nCopyright (c) ${new Date().getFullYear()}`,
      };
      for (const [fileName, content] of Object.entries(textFileMap)) {
        await fs.promises.writeFile(path.join(moduleDir, fileName), content, 'utf-8');
      }

      // 📦 Create package.json
      const packageJson = {
        name: moduleDescriptor.name,
        version: initialVersion,
        description: moduleDescriptor.description || '',
        scripts: {},
      };
      await fs.promises.writeFile(
        path.join(moduleDir, 'package.json'),
        JSON.stringify(packageJson, null, 2),
        'utf-8',
      );

      // ✳️ Use new service for .cd files
      const cdWriter = new CdDescriptorFileService(cdDir);
      const roadmap: CdRoadmapDescriptor = {
        name: 'Initial Dev Roadmap',
        type: 'dev-roadmap',
        stages: [],
        versionTag: 0,
        baseId: moduleDescriptor.name + ':roadmap',
      };

      const changelog: CdChangeLogDescriptor = {
        baseId: moduleDescriptor.name + ':changelog',
        changelogs: [],
        contributors: [],
        events: [
          {
            baseId: 'init-event',
            type: 'commit',
            actor: 'system',
            description: 'Initial commit',
            date: timestamp,
          },
        ],
      };

      const doc: CdDocDescriptor = {
        baseId: moduleDescriptor.name + ':doc',
        version: initialVersion,
        status: 'draft',
        summary: 'Initial auto-generated documentation',
      };

      await cdWriter.writeRoadmap(roadmap, cdDir);
      await cdWriter.writeChangelog(changelog, cdDir);
      await cdWriter.writeDocumentation(doc, cdDir);

      // ✅ Commit if anything changed
      const git = new CdAutoGitService();
      const result = await git.commitAndPushIfChanges(
        moduleDir,
        moduleDescriptor.versionControl,
        'created root files',
        DevModeAction.CREATE,
      );

      if (!result?.state) {
        CdLog.debug(`createModuleRootFiles()/Git push failed`);
        return cdFx(CdFxStateLevel.LogicalFailure, 'Failed to commit or push changes.');
      }

      return cdFx(CdFxStateLevel.Success, 'Module root files created successfully.');
    } catch (e: any) {
      return cdFx(CdFxStateLevel.Error, `Failed to create root files: ${e.message}`);
    }
  }

  /**
   * Creates standard directory structure for a new module and commits the changes to Git.
   *
   * This method scaffolds the following subdirectories inside the provided moduleDir:
   * - controllers
   * - models
   * - services
   *
   * For each subdirectory, it:
   * - Ensures creation using `mkdir -p`
   * - Adds a `.gitkeep` file to keep empty folders under version control
   * - Logs directory contents for traceability
   *
   * Once the directories are created, it auto-generates a commit message using the module name derived
   * from `moduleDir` and lists the folders created. It then calls `commitAndPushIfChanges()` to commit
   * and push changes, if any.
   *
   * @param moduleDir - Absolute path to the root of the module.
   * @returns CdFxReturn indicating success or error.
   */
  async createModuleDirectories(moduleDir: string): Promise<CdFxReturn<null>> {
    try {
      // CdLog.debug(`CdAppService::createModuleDirectories()/moduleDir: ${moduleDir}`);

      const directories = ['controllers', 'models', 'services'];
      const createdDirs: string[] = [];

      for (const dir of directories) {
        const fullPath = join(moduleDir, dir);
        await mkdir(fullPath, { recursive: true });

        const gitkeepPath = join(fullPath, '.gitkeep');
        await writeFile(gitkeepPath, '');

        CdLog.debug(`📂 Created: ${fullPath}`);
        CdLog.debug(`📄 Added .gitkeep: ${gitkeepPath}`);

        const list = await executeCommand(`ls -la ${fullPath}`);
        CdLog.debug(`📁 Contents of ${fullPath}:\n${list}`);

        createdDirs.push(dir);
      }

      const moduleName = basename(moduleDir);
      const commitMessage = `scaffold(${moduleName}): created directories - ${createdDirs.join(', ')}`;

      const svCdAutoGit = new CdAutoGitService();
      const result = await svCdAutoGit.commitAndPushIfChanges(
        moduleDir,
        undefined,
        commitMessage,
        DevModeAction.CREATE,
      );

      if (!result || !result.state) {
        CdLog.debug(`CdAppService::createModuleDirectories()/Error committing or pushing changes`);
      }

      return cdFx(CdFxStateLevel.Success, 'Module directories created successfully.');
    } catch (e: any) {
      return cdFx(CdFxStateLevel.Error, `Failed to create module directories: ${e.message}`);
    }
  }
}
