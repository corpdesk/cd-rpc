// src/CdCli/app/app-craft/services/cd-app.service.ts

/* eslint-disable style/brace-style */

import { basename, join, relative, sep } from 'path';
import {
  CD_FX_FAIL,
  CdAssertReturn,
  CdFxReturn,
  CdFxStateLevel,
  ICdResponse,
  IQuery,
} from '../../../sys/base/i-base';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { AppType, CdAppDescriptor } from '../../../sys/dev-descriptor/models/cd-app.model';
import { CiCdRunnerService } from '../../../sys/dev-descriptor/services/cd-ci-runner.service';
import { DevDescriptorService } from '../../../sys/dev-descriptor/services/dev-descriptor.service';
import { DevModeAction, DevModeModel } from '../../../sys/dev-mode/models/dev-mode.model';
import { mkdir, writeFile } from 'fs/promises';
import { cdFx } from '../../../sys/base/cd-fx-return.util.js';
import { inferCdObjType } from '../../../sys/utils/cd-naming.util';
import { VersionService } from '../../../sys/dev-descriptor/services/version.service';
import {
  CdExpression,
  ExpressionContext,
  SeedConfig,
  SeedRoleConfig,
} from '../models/cd-app.model.js';
import { CdCtx, CdModuleDescriptor, DirectoryNode } from '../../../sys/dev-descriptor/index.js';
import { ComponentType } from '../../../sys/dev-descriptor/models/component-descriptor.model.js';
import { CdScannerService } from '../../cd-bio-engine/services/cd-scanner.service';
// import { cdApiVersionControl } from '../workshop/cd-app/workflow/test-bed/cd-shell-workshop.model.js';

export class CdAppService {
  cdToken;
  svDevDescriptors;
  private runner!: CiCdRunnerService;

  constructor() {
    // super(CdObjModel);
    this.svDevDescriptors = new DevDescriptorService();
  }

  init(): this {
    this.runner = new CiCdRunnerService();
    return this;
  }

  async create(
    actionTargetName: string,
    moduleName: string,
    moduleType: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdAppService::create()');
    CdLog.debug('Starting CdAppService::create()');
    CdLog.debug(`CdAppService::create()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdAppService::create()/moduleName: ${moduleName}`);
    CdLog.debug(`CdAppService::create()/moduleType: ${moduleType}`);
    CdLog.debug(`CdAppService::create()/cdToken: ${cdToken}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModuleDescriptorAndWorkflow(
      DevModeAction.CREATE,
      cdObjType,
      moduleName,
      moduleType,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdAppDescriptor',
        cdToken: cdToken, // Pass the cdToken if needed
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdAppService::create()/workflowModel is invalid`,
      };
    }
    return await this.runner.run(descriptor, workflowModel);
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
  async createByAi(d: CdAppDescriptor): Promise<CdFxReturn<null>> {
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

  async createByJson(d: CdAppDescriptor): Promise<CdFxReturn<null>> {
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

  async createByWizard(d: CdAppDescriptor): Promise<CdFxReturn<null>> {
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

  async createByContext(d: CdAppDescriptor): Promise<CdFxReturn<null>> {
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

  async read(q?: IQuery): Promise<CdFxReturn<CdAppDescriptor[] | null>> {
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
    actionTargetName: string,
    moduleName: string,
    moduleType: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdAppService::update()');
    CdLog.debug('Starting CdAppService::create()');
    CdLog.debug('Starting CdAppService::create()');
    CdLog.debug(`CdAppService::create()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdAppService::create()/moduleName: ${moduleName}`);
    CdLog.debug(`CdAppService::create()/moduleType: ${moduleType}`);
    CdLog.debug(`CdAppService::create()/cdToken: ${cdToken}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModuleDescriptorAndWorkflow(
      DevModeAction.CREATE,
      cdObjType,
      moduleName,
      moduleType,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdAppDescriptor',
        cdToken: cdToken, // Pass the cdToken if needed
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdAppService::create()/workflowModel is invalid`,
      };
    }
    return await this.runner.run(descriptor, workflowModel);
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    try {
      return CD_FX_FAIL; // placeholder until this method is properly implemented
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Update failed: ${(error as Error).message}`,
      };
    }
  }

  protected getTypeId(): number {
    return 1; // CdApp type
  }

  // Get all applications
  async getAllModules(): Promise<CdFxReturn<CdAppDescriptor[] | null>> {
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
  async getModuleByName(name: string): Promise<CdFxReturn<CdAppDescriptor[] | null>> {
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

  async derive(
    actionTargetName: string,
    moduleName: string,
    moduleType: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdAppService::derive()');
    CdLog.debug(`CdAppService::derive()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdAppService::derive()/moduleName: ${moduleName}`);
    CdLog.debug(`CdAppService::derive()/moduleType: ${moduleType}`);
    CdLog.debug(`CdAppService::derive()/cdToken: ${cdToken}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } = await runner.loadModuleDescriptorAndWorkflow(
      DevModeAction.DERIVE,
      cdObjType,
      moduleName,
      moduleType,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdAppDescriptor',
        cdToken: cdToken, // Pass the cdToken if needed
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdAppService::create()/workflowModel is invalid`,
      };
    }
    return await this.runner.run(descriptor, workflowModel);
  }

  async upgrade(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    version?: string,
    testTasks?: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdAppService::upgrade()');
    CdLog.debug(`CdAppService::upgrade()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdAppService::upgrade()/moduleName: ${moduleName}`);
    CdLog.debug(`CdAppService::upgrade()/oEnv: ${oEnv}`);
    CdLog.debug(`CdAppService::upgrade()/repoName: ${repoName}`);
    CdLog.debug(`CdAppService::upgrade()/version: ${version}`);
    CdLog.debug(`CdAppService::upgrade()/testTasks: ${testTasks}`);

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
      DevModeAction.UPGRADE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdAppDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
        appType: AppType.CdApi,
        version: versionObj, // 👈 Pass object instead of string
        testTasks: testTasks !== undefined ? String(testTasks) : undefined, // 👈 Convert to string if needed
        oEnv: oEnv,
      },
    );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdAppService::upgrade()/ No valid workflowModel`,
      };
    }
    return await this.runner.run(descriptor, workflowModel);
  }

  /**
   * [CdAppService][scan()]
   * Entry point for application scanning pipeline.
   * Orchestrates: config loading → filesystem scan → descriptor build → persistence.
   */
  // async scan(
  //   actionTargetName: string,
  //   moduleName: string,
  //   moduleType: string,
  //   cdToken: string,
  // ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
  //   CdLog.debug('[CdAppService][scan()]/starting...');
  //   CdLog.debug(`[CdAppService][scan()]/actionTargetName: ${actionTargetName}`);
  //   CdLog.debug(`[CdAppService][scan()]/moduleName: ${moduleName}`);
  //   CdLog.debug(`[CdAppService][scan()]/moduleType: ${moduleType}`);

  //   try {
  //     const config: SeedConfig = this.loadScanConfig(moduleType);

  //     const files = await this.scanDirectory(config.rootPath, config);
  //     CdLog.debug(`[CdAppService][scan()]/files.length: ${files.length}`);

  //     const descriptor = await this.buildAppDescriptor(moduleName, files, config);

  //     await this.writeDescriptor(config.rootPath, descriptor);

  //     CdLog.success('[CdAppService][scan()]/completed');

  //     return {
  //       state: true,
  //       data: [],
  //       message: `App scan completed successfully for ${moduleName}`,
  //     };
  //   } catch (error) {
  //     CdLog.error(`[CdAppService][scan()]/error: ${(error as Error).message}`);

  //     return {
  //       state: false,
  //       data: null,
  //       message: `App scan failed: ${(error as Error).message}`,
  //     };
  //   }
  // }

  // /**
  //  * [CdAppService][loadScanConfig()]
  //  * Loads SeedConfig for a given subsystem.
  //  * Falls back to default config if not found.
  //  */
  // private loadScanConfig(moduleType: string): SeedConfig {
  //   CdLog.debug('[CdAppService][loadScanConfig()]/starting...');
  //   CdLog.debug(`[CdAppService][loadScanConfig()]/moduleType: ${moduleType}`);

  //   const configPath = join(process.cwd(), '.cd', `${moduleType}.seed.json`);

  //   try {
  //     const raw = require(configPath);
  //     CdLog.success('[CdAppService][loadScanConfig()]/loaded');
  //     return raw as SeedConfig;
  //   } catch {
  //     CdLog.warning(`[CdAppService][loadScanConfig()]/fallback: ${moduleType}`);

  //     return {
  //       subsystemName: moduleType,
  //       rootPath: process.cwd(),
  //       ignorePatterns: ['node_modules', 'dist', '.git', '.cd'],
  //       includeExtensions: ['.ts', '.js', '.json'],
  //       roles: [
  //         { roleName: 'controller', namingPattern: '\\.controller\\.' },
  //         { roleName: 'service', namingPattern: '\\.service\\.' },
  //         { roleName: 'model', namingPattern: '\\.model\\.' },
  //       ],
  //       version: '1.0.0',
  //       globals: {},
  //     };
  //   }
  // }

  // /**
  //  * [CdAppService][scanDirectory()]
  //  * Recursively scans filesystem based on SeedConfig rules.
  //  */
  // private async scanDirectory(
  //   dir: string,
  //   config: SeedConfig,
  //   results: string[] = [],
  // ): Promise<string[]> {
  //   CdLog.debug(`[CdAppService][scanDirectory()]/dir: ${dir}`);

  //   const entries = await import('fs/promises').then((fs) =>
  //     fs.readdir(dir, { withFileTypes: true }),
  //   );

  //   for (const entry of entries) {
  //     const fullPath = join(dir, entry.name);

  //     if (config.ignorePatterns?.some((pat) => fullPath.includes(pat))) {
  //       CdLog.debug(`[CdAppService][scanDirectory()]/ignored: ${fullPath}`);
  //       continue;
  //     }

  //     if (entry.isDirectory()) {
  //       await this.scanDirectory(fullPath, config, results);
  //     } else {
  //       if (config.includeExtensions?.some((ext) => fullPath.endsWith(ext))) {
  //         results.push(fullPath);
  //       }
  //     }
  //   }

  //   return results;
  // }

  // /**
  //  * [CdAppService][buildAppDescriptor()]
  //  * Constructs CdAppDescriptor from scanned files using SeedConfig rules.
  //  */
  // private async buildAppDescriptor(
  //   appName: string,
  //   files: string[],
  //   config: SeedConfig,
  // ): Promise<CdAppDescriptor> {
  //   CdLog.debug('[CdAppService][buildAppDescriptor()]/starting...');
  //   CdLog.debug(`[CdAppService][buildAppDescriptor()]/appName: ${appName}`);

  //   const modules = this.groupFilesIntoModules(files, config);

  //   const descriptor: CdAppDescriptor = {
  //     name: appName,
  //     parentProjectGuid: null,
  //     modules,
  //     description: `Auto-generated descriptor for ${appName}`,
  //     directorySignature: {
  //       signatureName: `${appName}-signature`,
  //       root: this.buildDirectoryTree(files, config),
  //       variables: config.globals,
  //     },
  //   };

  //   CdLog.success('[CdAppService][buildAppDescriptor()]/built');

  //   return descriptor;
  // }

  // /**
  //  * [CdAppService][groupFilesIntoModules()]
  //  * Groups files into logical modules based on role resolution.
  //  */
  // private groupFilesIntoModules(files: string[], config: SeedConfig): CdModuleDescriptor[] {
  //   CdLog.debug('[CdAppService][groupFilesIntoModules()]/starting...');

  //   const moduleMap: Record<string, CdModuleDescriptor> = {};

  //   for (const file of files) {
  //     const matchedRole = this.resolveRole(file, config.roles);
  //     const moduleName = matchedRole?.roleName || 'root';

  //     if (!moduleMap[moduleName]) {
  //       moduleMap[moduleName] = {
  //         name: moduleName,
  //         cdModuleType: { typeName: config.subsystemName as any },
  //         ctx: this.resolveModuleContext(moduleName),
  //         controllers: [],
  //         services: [],
  //         models: [],
  //       };
  //     }

  //     this.assignFileToComponent(file, moduleMap[moduleName], config);
  //   }

  //   CdLog.debug(
  //     `[CdAppService][groupFilesIntoModules()]/modules: ${Object.keys(moduleMap).length}`,
  //   );

  //   return Object.values(moduleMap);
  // }

  // /**
  //  * [CdAppService][matchRole()]
  //  * Matches file against role patterns (legacy regex-based).
  //  */
  // private matchRole(file: string, roles: SeedRoleConfig[]): string {
  //   for (const role of roles) {
  //     if (!role.namingPattern) continue;

  //     try {
  //       const regex = new RegExp(role.namingPattern);
  //       if (regex.test(file)) {
  //         return role.roleName;
  //       }
  //     } catch {
  //       CdLog.warning(`[CdAppService][matchRole()]/invalidPattern: ${role.namingPattern}`);
  //     }
  //   }

  //   return 'root';
  // }

  // /**
  //  * [CdAppService][resolveModuleContext()]
  //  * Determines module context (sys/app) based on role.
  //  */
  // private resolveModuleContext(roleName: string): CdCtx {
  //   if (roleName === 'sys') return CdCtx.Sys;
  //   return CdCtx.App;
  // }

  // /**
  //  * [CdAppService][resolveRole()]
  //  * Resolves role using namingPattern rules.
  //  */
  // private resolveRole(file: string, roles: SeedRoleConfig[]): SeedRoleConfig | undefined {
  //   for (const role of roles) {
  //     if (!role.namingPattern) continue;

  //     try {
  //       const regex = new RegExp(role.namingPattern);
  //       if (regex.test(file)) {
  //         return role;
  //       }
  //     } catch {
  //       CdLog.warning(`[CdAppService][resolveRole()]/invalidPattern: ${role.namingPattern}`);
  //     }
  //   }

  //   return undefined;
  // }

  // /**
  //  * [CdAppService][assignFileToComponent()]
  //  * Assigns scanned file to correct module component (controller/service/model).
  //  */
  // private assignFileToComponent(file: string, module: CdModuleDescriptor, config: SeedConfig) {
  //   const name = basename(file);

  //   const role = this.resolveRole(file, config.roles);
  //   if (!role) return;

  //   switch (role.roleName) {
  //     case 'controller':
  //       module.controllers.push({
  //         name,
  //         type: ComponentType.Controller,
  //         fileName: file,
  //       });
  //       break;

  //     case 'service':
  //       module.services.push({
  //         name,
  //         type: ComponentType.Service,
  //         fileName: file,
  //       });
  //       break;

  //     case 'model':
  //       module.models.push({
  //         name,
  //         type: ComponentType.Model,
  //         fileName: file,
  //         fields: [],
  //       });
  //       break;
  //   }
  // }

  // /**
  //  * [CdAppService][buildDirectoryTree()]
  //  * Builds DirectoryNode structure for descriptor signature.
  //  */
  // private buildDirectoryTree(files: string[], config: SeedConfig): DirectoryNode {
  //   CdLog.debug('[CdAppService][buildDirectoryTree()]/starting...');

  //   return {
  //     name: config.subsystemName,
  //     cdObjGuid: this.generateGuid(),
  //     children: files.map((f) => {
  //       const role = this.resolveRole(f, config.roles);

  //       return {
  //         name: basename(f),
  //         cdObjGuid: this.generateGuid(),
  //         isFile: true,
  //         cdObjRoleName: role?.roleName,
  //       };
  //     }),
  //   };
  // }

  // /**
  //  * [CdAppService][writeDescriptor()]
  //  * Persists generated descriptor to .cd directory.
  //  */
  // private async writeDescriptor(root: string, descriptor: CdAppDescriptor) {
  //   CdLog.debug('[CdAppService][writeDescriptor()]/starting...');
  //   CdLog.debug(`[CdAppService][writeDescriptor()]/root: ${root}`);

  //   const cdDir = join(root, '.cd');
  //   await mkdir(cdDir, { recursive: true });

  //   const filePath = join(cdDir, 'cd-app.descriptor.json');
  //   await writeFile(filePath, JSON.stringify(descriptor, null, 2));

  //   CdLog.success(`[CdAppService][writeDescriptor()]/filePath: ${filePath}`);
  // }

  // /**
  //  * [CdAppService][generateGuid()]
  //  * Generates pseudo GUID for descriptor nodes.
  //  */
  // private generateGuid(): string {
  //   return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, () =>
  //     ((Math.random() * 16) | 0).toString(16),
  //   );
  // }

  // /**
  //  * [CdAppService][buildExpressionContext()]
  //  * Builds evaluation context (cell) for DNA execution from file path.
  //  */
  // private buildExpressionContext(file: string): ExpressionContext {
  //   CdLog.debug('[CdAppService][buildExpressionContext()]/starting...');
  //   CdLog.debug(`[CdAppService][buildExpressionContext()]/file: ${file}`);

  //   const name = basename(file);

  //   const ctx: ExpressionContext = {
  //     filePath: file,
  //     fileName: name,
  //     extension: name.split('.').pop() || '',
  //     moduleHint: file.includes('/sys/') ? 'sys' : file.includes('/app/') ? 'app' : 'unknown',
  //   };

  //   CdLog.debug(`[CdAppService][buildExpressionContext()]/fileName: ${ctx.fileName}`);
  //   CdLog.debug(`[CdAppService][buildExpressionContext()]/extension: ${ctx.extension}`);
  //   CdLog.debug(`[CdAppService][buildExpressionContext()]/moduleHint: ${ctx.moduleHint}`);

  //   return ctx;
  // }

  // /**
  //  * [CdAppService][evaluateExpression()]
  //  * Executes DNA expression against ExpressionContext.
  //  * Converts expression → JS-compatible → evaluates result.
  //  */
  // private evaluateExpression(expression: string, ctx: ExpressionContext): boolean {
  //   CdLog.debug('[CdAppService][evaluateExpression()]/starting...');
  //   CdLog.debug(`[CdAppService][evaluateExpression()]/expression: ${expression}`);

  //   try {
  //     let exp = expression;

  //     // 🔷 Variable substitution
  //     exp = exp.replace(/file\.name/g, `"${ctx.fileName}"`);
  //     exp = exp.replace(/file\.ext/g, `"${ctx.extension}"`);
  //     exp = exp.replace(/file\.path/g, `"${ctx.filePath}"`);
  //     exp = exp.replace(/ctx/g, `"${ctx.moduleHint}"`);

  //     CdLog.debug(`[CdAppService][evaluateExpression()]/afterVariables: ${exp}`);

  //     // 🔷 Operator transformation
  //     exp = exp
  //       .replace(/CONTAINS/g, '.includes')
  //       .replace(/STARTS_WITH/g, '.startsWith')
  //       .replace(/ENDS_WITH/g, '.endsWith')
  //       .replace(/EQUALS/g, '===')
  //       .replace(/AND/g, '&&')
  //       .replace(/OR/g, '||');

  //     CdLog.debug(`[CdAppService][evaluateExpression()]/afterOperators: ${exp}`);

  //     // 🔷 Execution
  //     // eslint-disable-next-line no-eval
  //     const result = Boolean(eval(exp));

  //     CdLog.debug(`[CdAppService][evaluateExpression()]/result: ${result}`);

  //     return result;
  //   } catch (e) {
  //     CdLog.error(`[CdAppService][evaluateExpression()]/error: ${(e as Error).message}`);
  //     return false;
  //   }
  // }

  /**
   * ============================================================
   * 🔷 PUBLIC: SCAN ENTRY POINT (Aligned with CdWire)
   * ============================================================
   */
  async scan(
    actionTargetName: string, // e.g., 'test-bed'
    cdObjName: string, // e.g., 'cd-cli'
    oEnv: string, // e.g., 'cd-app'
    cdToken: string,
  ): Promise<CdFxReturn<ICdResponse>> {
    CdLog.debug(`[CdAppService][scan()] start`);
    CdLog.debug(`[CdAppService][scan()] actionTargetName: ${actionTargetName}`);
    CdLog.debug(`[CdAppService][scan()] cdObjName: ${cdObjName}`);
    CdLog.debug(`[CdAppService][scan()] oEnv: ${oEnv}`);

    const scanner = new CdScannerService();
    return await scanner.run(actionTargetName, cdObjName, oEnv, cdToken);
  }

  /**
   * 🔷 RESOLVE CD_OBJ_PATH
   * Uses dynamic import to locate the workshop model and extract the environment path.
   */
  // private async resolveCdObjPath(cdObjName: string, oEnv: string): Promise<string> {
  //   try {
  //     // Construct dynamic path to the workshop model
  //     const modelPath = `../workshop/cd-app/workflow/${oEnv}/${cdObjName}-workshop.model.js`;

  //     CdLog.debug(`[CdAppService][resolveCdObjPath()] modelPath: ${modelPath}`);

  //     // Dynamically import the specific VCD
  //     // Note: Using 'cdApiVersionControl' as the exported key per your reference
  //     const module = await import(modelPath);
  //     const vcd = module.cdApiVersionControl;

  //     if (!vcd || !vcd.repository || !vcd.repository.directories) {
  //       throw new Error(`Invalid VersionControlDescriptor in ${modelPath}`);
  //     }

  //     CdLog.debug(`[CdAppService][resolveCdObjPath()] vcd: ${JSON.stringify(vcd)}`);

  //     // Match the environment name (e.g., 'test-bed')
  //     const dirEntry = vcd.repository.directories.find((d: any) => d.environment.name === cdObjName);

  //     if (!dirEntry) {
  //       throw new Error(`Environment '${oEnv}' not found in ${cdObjName} workshop model.`);
  //     }

  //     return dirEntry.path;
  //   } catch (err) {
  //     throw new Error(`Failed to resolve path for ${cdObjName}: ${(err as Error).message}`);
  //   }
  // }

  private async resolveCdObjPath(cdObjName: string, oEnv: string): Promise<string> {
    const method = 'resolveCdObjPath';

    try {
      if (!cdObjName || !oEnv) {
        CdLog.error(
          `[CdAppService][${method}] Invalid inputs cdObjName:, ${cdObjName}, oEnv:, ${oEnv}`,
        );
        throw new Error(`Invalid inputs provided`);
      }

      // Construct dynamic path to the workshop model
      const modelPath = `../workshop/cd-app/workflow/${oEnv}/${cdObjName}-workshop.model.js`;

      CdLog.debug(`[CdAppService][${method}] modelPath: ${modelPath}`);

      // Dynamic import
      const module = await import(modelPath);
      const vcd = module.cdApiVersionControl;

      if (!vcd?.repository?.directories) {
        CdLog.error(`[CdAppService][${method}] Invalid VCD structure:, ${JSON.stringify(vcd)}`);
        throw new Error(`Invalid VersionControlDescriptor in ${modelPath}`);
      }

      CdLog.debug(`[CdAppService][${method}] directories:, ${vcd.repository.directories}`);

      let normalizedEnvName = cdObjName.toLowerCase();
      normalizedEnvName = `local-${normalizedEnvName}`; // ensure prefix for matching, e.g., 'local-cd-shell'

      // ✅ Correct matching: environment.name vs oEnv
      const dirEntry = vcd.repository.directories.find((d: any) => {
        const envName = d.environment?.name?.toLowerCase();

        CdLog.debug(
          `[CdAppService][${method}] checking env:, ${envName}, against:, ${normalizedEnvName}`,
        );

        return envName === normalizedEnvName;
      });

      if (!dirEntry) {
        CdLog.debug(
          `[CdAppService][${method}] No match found for env:, ${normalizedEnvName} in:, ${cdObjName}`,
        );
        throw new Error(`Environment '${oEnv}' not found in ${cdObjName} workshop model.`);
      }

      if (!dirEntry.path) {
        CdLog.debug(
          `[CdAppService][${method}] Match found but path missing:, ${JSON.stringify(dirEntry)}`,
        );
        throw new Error(`Resolved directory has no path for ${cdObjName}`);
      }

      CdLog.debug(`[CdAppService][${method}] Resolved path:, ${dirEntry.path}`);

      return dirEntry.path;
    } catch (err) {
      CdLog.error(
        `[CdAppService][${method}] ERROR resolving path for:, ${cdObjName}, error:, ${(err as Error).message}`,
      );
      throw new Error(`Failed to resolve path for ${cdObjName}: ${(err as Error).message}`);
    }
  }

  /**
   * 🔷 CONFIG LOADING (Refactored)
   * Resolved CD_OBJ_PATH is used as the base for .cd/ seed files.
   */
  private async loadScanConfig(cdObjName: string, cdObjPath: string): Promise<any> {
    CdLog.debug(`[CdAppService][loadScanConfig()] cdObjName: ${cdObjName}`);

    const configPath = join(cdObjPath, '.cd', `${cdObjName}.seed.json`);
    CdLog.debug(`[CdAppService][loadScanConfig()] configPath: ${configPath}`);

    try {
      // In ESM/Dynamic environments, use fs or dynamic import for JSON
      // If using Node 'require', ensure absolute path is handled
      const raw = require(configPath);
      CdLog.success(`[CdAppService][loadScanConfig()] loaded custom config from ${cdObjPath}`);
      return raw;
    } catch {
      CdLog.warning(`[CdAppService][loadScanConfig()] fallback to default config at ${cdObjPath}`);

      return {
        subsystemName: cdObjName,
        rootPath: cdObjPath, // CRITICAL: rootPath must match the object being scanned
        ignorePatterns: ['node_modules', 'dist', '.git', '.cd'],
        includeExtensions: ['.ts', '.js', '.json'],
        roles: [
          { roleName: 'controller', namingPattern: '\\.controller\\.' },
          { roleName: 'service', namingPattern: '\\.service\\.' },
          { roleName: 'model', namingPattern: '\\.model\\.' },
        ],
        version: '1.0.0',
        globals: {},
      };
    }
  }

  /**
   * ============================================================
   * 🔷 FILE SYSTEM SCAN
   * ============================================================
   */
  private async scanDirectory(
    dir: string,
    config: SeedConfig,
    results: string[] = [],
  ): Promise<string[]> {
    CdLog.debug(`[CdAppService][scanDirectory()] dir:, ${dir}`);

    const fs = await import('fs/promises');
    const entries = await fs.readdir(dir, { withFileTypes: true });

    CdLog.debug(`[CdAppService][scanDirectory()] entries.count:, ${entries.length}`);

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (config.ignorePatterns?.some((p) => fullPath.includes(p))) {
        CdLog.debug(`[CdAppService][scanDirectory()] ignored:, ${fullPath}`);
        continue;
      }

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, config, results);
      } else {
        if (config.includeExtensions?.some((ext) => fullPath.endsWith(ext))) {
          results.push(fullPath);
          CdLog.debug(`[CdAppService][scanDirectory()] added file:, ${fullPath}`);
        }
      }
    }

    return results;
  }

  /**
   * ============================================================
   * 🔷 DESCRIPTOR BUILD
   * ============================================================
   */
  // private async buildAppDescriptor(
  //   appName: string,
  //   files: string[],
  //   config: SeedConfig,
  // ): Promise<CdAppDescriptor> {
  //   CdLog.debug(`[CdAppService][buildAppDescriptor()] appName:, ${appName}`);
  //   CdLog.debug(`[CdAppService][buildAppDescriptor()] files.count:, ${files.length}`);

  //   const modules = this.groupFilesIntoModules(files, config);
  //   CdLog.debug(`[CdAppService][buildAppDescriptor()] modules.count:, ${modules.length}`);

  //   const rootTree = this.buildDirectoryTree(config.rootPath, files, config);

  //   CdLog.success(`[CdAppService][buildAppDescriptor()] descriptor built`);

  //   return {
  //     name: appName,
  //     parentProjectGuid: null,
  //     modules,
  //     description: `Auto-generated descriptor for ${appName}`,
  //     directorySignature: {
  //       signatureName: `${appName}-signature`,
  //       root: rootTree,
  //       variables: config.globals,
  //     },
  //   };
  // }
  private async buildAppDescriptor(
    appName: string,
    files: string[],
    config: SeedConfig,
  ): Promise<CdAppDescriptor> {
    const method = 'buildAppDescriptor';

    CdLog.debug(`[CdAppService][${method}] appName:, ${appName}`);

    const modules = this.groupFilesIntoModules(files, config);
    CdLog.debug(`[CdAppService][${method}] modules.count:, ${modules.length}`);

    const rootTree = this.buildDirectoryTree(config.rootPath, files, config);

    const metrics = this.computeMetrics(rootTree);
    CdLog.debug(`[CdAppService][${method}] metrics:, ${JSON.stringify(metrics)}`);

    const zygote = files.find((f) => f.endsWith('main.ts'));
    CdLog.debug(`[CdAppService][${method}] zygote:, ${zygote}`);

    const zygoteDependencies = zygote ? await this.extractImports(zygote) : [];

    CdLog.debug(
      `[CdAppService][${method}] zygoteDependencies.count:, ${zygoteDependencies.length}`,
    );

    return {
      name: appName,
      parentProjectGuid: null,
      modules,
      description: `Auto-generated descriptor for ${appName}`,
      directorySignature: {
        signatureName: `${appName}-signature`,
        root: rootTree,
        variables: config.globals,
      },
      metrics,
      zygote: {
        entry: zygote,
        dependencies: zygoteDependencies,
      },
    } as any;
  }

  private async extractImports(filePath: string): Promise<string[]> {
    const method = 'extractImports';

    CdLog.debug(`[CdAppService][${method}] filePath:, ${filePath}`);

    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');

      CdLog.debug(`[CdAppService][${method}] content.length:, ${content.length}`);

      const matches = content.match(/import\s+.*?from\s+['"](.*?)['"]/g) || [];

      CdLog.debug(`[CdAppService][${method}] matches.count:, ${matches.length}`);

      const imports = matches.map((m) => {
        const res = m.match(/['"](.*?)['"]/);
        return res ? res[1] : '';
      });

      CdLog.debug(`[CdAppService][${method}] imports:, ${JSON.stringify(imports)}`);

      return imports;
    } catch (err) {
      CdLog.error(`[CdAppService][${method}] failed:, ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * ============================================================
   * 🔷 MODULE GROUPING
   * ============================================================
   */
  private groupFilesIntoModules(files: string[], config: SeedConfig): CdModuleDescriptor[] {
    CdLog.debug(`[CdAppService][groupFilesIntoModules()] start`);

    const moduleMap: Record<string, CdModuleDescriptor> = {};

    for (const file of files) {
      const role = this.resolveRole(file, config.roles);
      const moduleName = role?.roleName || 'root';

      CdLog.debug(`[CdAppService][groupFilesIntoModules()] file:, ${file}`);
      CdLog.debug(`[CdAppService][groupFilesIntoModules()] resolvedRole:, ${moduleName}`);

      if (!moduleMap[moduleName]) {
        moduleMap[moduleName] = {
          name: moduleName,
          cdModuleType: { typeName: config.subsystemName as any },
          ctx: this.resolveModuleContext(moduleName),
          controllers: [],
          services: [],
          models: [],
        };
      }

      this.assignFileToComponent(file, moduleMap[moduleName], config);
    }

    CdLog.debug(
      `[CdAppService][groupFilesIntoModules()] modules.total:, ${Object.keys(moduleMap).length}`,
    );

    return Object.values(moduleMap);
  }

  private resolveModuleContext(roleName: string): CdCtx {
    return roleName === 'sys' ? CdCtx.Sys : CdCtx.App;
  }

  /**
   * ============================================================
   * 🔷 ROLE RESOLUTION (DNA + REGEX)
   * ============================================================
   */
  // private resolveRole(file: string, roles: SeedRoleConfig[]): SeedRoleConfig | undefined {
  //   const ctx = this.buildExpressionContext(file);

  //   for (const role of roles) {
  //     // if (role.expression && this.evaluateExpression(role.expression, ctx)) {
  //     //   return role;
  //     // }
  //     if (role.expression && this.evaluateExpression(role.expression, ctx)) {
  //       return role;
  //     }

  //     if (role.namingPattern) {
  //       try {
  //         if (new RegExp(role.namingPattern).test(file)) {
  //           return role;
  //         }
  //       } catch {}
  //     }
  //   }

  //   return undefined;
  // }
  private resolveRole(file: string, roles: SeedRoleConfig[]): SeedRoleConfig | undefined {
    const method = 'resolveRole';
    const ctx = this.buildExpressionContext(file);

    CdLog.debug(`[CdAppService][${method}] file:, ${file}`);
    CdLog.debug(`[CdAppService][${method}] ctx:, ${JSON.stringify(ctx)}`);

    for (const role of roles) {
      CdLog.debug(`[CdAppService][${method}] checking role:, ${role.roleName}`);

      if (role.expression) {
        const result = this.evaluateExpression(role.expression, ctx);

        CdLog.debug(
          `[CdAppService][${method}] expression result:, role:, ${role.roleName}, result:, ${result}`,
        );

        if (result) return role;
      }

      if (role.namingPattern) {
        try {
          const matched = new RegExp(role.namingPattern).test(file);

          CdLog.debug(
            `[CdAppService][${method}] regex check:, ${role.namingPattern}, matched:, ${matched}`,
          );

          if (matched) return role;
        } catch (err) {
          CdLog.warning(
            `[CdAppService][${method}] invalid regex:, ${role.namingPattern}, error:, ${(err as Error).message}`,
          );
        }
      }
    }

    CdLog.debug(`[CdAppService][${method}] no role matched`);
    return undefined;
  }

  /**
   * ============================================================
   * 🔷 COMPONENT ASSIGNMENT
   * ============================================================
   */
  private assignFileToComponent(file: string, module: CdModuleDescriptor, config: SeedConfig) {
    const name = basename(file);
    const role = this.resolveRole(file, config.roles);

    if (!role) return;

    switch (role.roleName) {
      case 'controller':
        module.controllers.push({ name, type: ComponentType.Controller, fileName: file });
        break;
      case 'service':
        module.services.push({ name, type: ComponentType.Service, fileName: file });
        break;
      case 'model':
        module.models.push({ name, type: ComponentType.Model, fileName: file, fields: [] });
        break;
    }
  }

  /**
   * ============================================================
   * 🔷 TRUE TREE BUILDER (HIERARCHICAL)
   * ============================================================
   */
  // private buildDirectoryTree(rootPath: string, files: string[], config: SeedConfig): DirectoryNode {
  //   CdLog.debug(`[CdAppService][buildDirectoryTree()] start`);

  //   const root: DirectoryNode = {
  //     name: config.subsystemName,
  //     cdObjGuid: this.generateGuid(),
  //     children: [],
  //   };

  //   for (const file of files) {
  //     const relPath = relative(rootPath, file);
  //     const parts = relPath.split(/[/\\]+/);

  //     // CdLog.debug(`[CdAppService][buildDirectoryTree()] file:, ${file}`);
  //     // CdLog.debug(`[CdAppService][buildDirectoryTree()] relPath:, ${relPath}`);

  //     let current = root;

  //     parts.forEach((part, index) => {
  //       let next = current.children?.find((c) => c.name === part);

  //       if (!next) {
  //         const role = this.resolveRole(file, config.roles);

  //         next = {
  //           name: part,
  //           cdObjGuid: this.generateGuid(),
  //           isFile: index === parts.length - 1,
  //           cdObjRoleName: role?.roleName,
  //           weight: this.assignWeight(role?.roleName),
  //           children: [],
  //         };

  //         current.children = current.children || [];
  //         current.children.push(next);

  //         // CdLog.debug(`[CdAppService][buildDirectoryTree()] nodeCreated:, ${part}`);
  //         // CdLog.debug(`[CdAppService][buildDirectoryTree()] role:, ${role?.roleName}`);
  //       }

  //       current = next;
  //     });
  //   }

  //   CdLog.success(`[CdAppService][buildDirectoryTree()] tree built`);

  //   return root;
  // }
  private buildDirectoryTree(rootPath: string, files: string[], config: SeedConfig): DirectoryNode {
    const method = 'buildDirectoryTree';

    CdLog.debug(`[CdAppService][${method}] start`);
    CdLog.debug(`[CdAppService][${method}] rootPath:, ${rootPath}`);
    CdLog.debug(`[CdAppService][${method}] files.count:, ${files.length}`);

    const root: DirectoryNode = {
      name: config.subsystemName,
      cdObjGuid: this.generateGuid(),
      isFile: false,
      isCdCompliant: true,
      isCdForeign: false,
      lastUpdated: Date.now(),
      children: [],
    };

    for (const file of files) {
      const relPath = relative(rootPath, file);
      const parts = relPath.split(/[/\\]+/);

      CdLog.debug(`[CdAppService][${method}] processing file:, ${file}`);
      CdLog.debug(`[CdAppService][${method}] relPath:, ${relPath}`);

      let current = root;

      parts.forEach((part, index) => {
        let next = current.children?.find((c) => c.name === part);

        if (!next) {
          const isFile = index === parts.length - 1;
          const role = isFile ? this.resolveRole(file, config.roles) : undefined;

          const isZygote = part === 'main.ts';
          const isCdCompliant = !!role || isZygote;
          const isCdForeign = !isCdCompliant;

          next = {
            name: part,
            cdObjGuid: this.generateGuid(),
            isFile,
            cdObjRoleName: isZygote ? 'origin' : role?.roleName,
            weight: isZygote ? 10 : this.assignWeight(role?.roleName),
            isCdCompliant,
            isCdForeign,
            lastUpdated: Date.now(),
            children: [],
          };

          current.children = current.children || [];
          current.children.push(next);

          CdLog.debug(
            `[CdAppService][${method}] node created:, ${part}, role:, ${next.cdObjRoleName}, compliant:, ${isCdCompliant}, foreign:, ${isCdForeign}`,
          );
        }

        current = next;
      });
    }

    CdLog.success(`[CdAppService][${method}] tree built`);
    return root;
  }

  /**
   * ============================================================
   * 🔷 WEIGHT ASSIGNMENT (Stage 5 Hook)
   * ============================================================
   */
  private assignWeight(roleName?: string): number {
    const weights: Record<string, number> = {
      controller: 8,
      service: 8,
      model: 8,
      sys: 9,
      app: 8,
      utils: 5,
    };

    return roleName ? weights[roleName] || 1 : 1;
  }

  /**
   * ============================================================
   * 🔷 WRITE DESCRIPTOR
   * ============================================================
   */
  private async writeDescriptor(root: string, descriptor: CdAppDescriptor) {
    CdLog.debug(`[CdAppService][writeDescriptor()] root:, ${root}`);

    const cdDir = join(root, '.cd');
    await mkdir(cdDir, { recursive: true });

    const filePath = join(cdDir, 'cd-app.descriptor.json');

    await writeFile(filePath, JSON.stringify(descriptor, null, 2));

    CdLog.success(`[CdAppService][writeDescriptor()] filePath:, ${filePath}`);
  }

  /**
   * ============================================================
   * 🔷 EXPRESSION ENGINE
   * ============================================================
   */
  private buildExpressionContext(file: string): ExpressionContext {
    const name = basename(file);

    return {
      filePath: file,
      fileName: name,
      extension: name.split('.').pop() || '',
      moduleHint: file.includes('/sys/') ? 'sys' : file.includes('/app/') ? 'app' : 'unknown',
    };
  }

  // private evaluateExpression(expression: string, ctx: ExpressionContext): boolean {
  //   try {
  //     let exp = expression;

  //     exp = exp.replace(/file\.name/g, `"${ctx.fileName}"`);
  //     exp = exp.replace(/file\.ext/g, `"${ctx.extension}"`);
  //     exp = exp.replace(/file\.path/g, `"${ctx.filePath}"`);
  //     exp = exp.replace(/ctx/g, `"${ctx.moduleHint}"`);

  //     exp = exp
  //       .replace(/CONTAINS/g, '.includes')
  //       .replace(/STARTS_WITH/g, '.startsWith')
  //       .replace(/ENDS_WITH/g, '.endsWith')
  //       .replace(/EQUALS/g, '===')
  //       .replace(/AND/g, '&&')
  //       .replace(/OR/g, '||');

  //     return Boolean(eval(exp));
  //   } catch {
  //     return false;
  //   }
  // }

  private evaluateExpression(expression: CdExpression, ctx: ExpressionContext): boolean {
    const method = 'evaluateExpression';

    CdLog.debug(`[CdAppService][${method}] expression:, ${JSON.stringify(expression)}`);
    CdLog.debug(`[CdAppService][${method}] ctx:, ${JSON.stringify(ctx)}`);

    let result = false;

    switch (expression.op) {
      case 'contains':
        result = String(ctx[expression.field]).includes(expression.value);
        break;

      case 'startsWith':
        result = String(ctx[expression.field]).startsWith(expression.value);
        break;

      case 'endsWith':
        result = String(ctx[expression.field]).endsWith(expression.value);
        break;

      case 'equals':
        result = String(ctx[expression.field]) === expression.value;
        break;

      case 'and':
        result = expression.conditions.every((cond) => this.evaluateExpression(cond, ctx));
        break;

      case 'or':
        result = expression.conditions.some((cond) => this.evaluateExpression(cond, ctx));
        break;

      default:
        CdLog.warning(`[CdAppService][${method}] unknown op:, ${(expression as any).op}`);
        result = false;
    }

    CdLog.debug(`[CdAppService][${method}] result:, ${result}`);
    return result;
  }

  /**
   * ============================================================
   * 🔷 UTIL
   * ============================================================
   */
  private generateGuid(): string {
    return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, () =>
      ((Math.random() * 16) | 0).toString(16),
    );
  }

  private computeMetrics(root: DirectoryNode) {
    const method = 'computeMetrics';

    let total = 0;
    let compliant = 0;
    let foreign = 0;

    function walk(node: DirectoryNode) {
      total++;

      if (node.isCdCompliant) compliant++;
      if (node.isCdForeign) foreign++;

      node.children?.forEach(walk);
    }

    walk(root);

    const result = {
      CR: compliant / total,
      infectionRatio: foreign / total,
      totalNodes: total,
      compliantNodes: compliant,
      foreignNodes: foreign,
    };

    CdLog.debug(`[CdAppService][${method}] result:, ${JSON.stringify(result)}`);

    return result;
  }
}
