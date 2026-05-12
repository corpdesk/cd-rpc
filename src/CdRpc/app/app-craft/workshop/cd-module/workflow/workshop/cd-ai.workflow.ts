import { CdModuleDescriptor } from '../../../../../../sys/dev-descriptor/models/cd-module-descriptor.model.js';
import { CiCdDescriptor } from '../../../../../../sys/dev-descriptor/models/cicd-descriptor.model.js';
import { workshopConfig } from '../../../../models/app-craft.model.js';
import CdLog from '../../../../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { CdFxStateLevel } from '../../../../../../sys/base/i-base.js';
import { HOME } from '../../../../../../sys/utils/fs.util.js';
// import { MOD_CRAFT_OUTPUT_DIR } from "../default.model.js";
import { inspect } from 'util';
import { DevModeAction } from '../../../../../../sys/dev-mode/index.js';
import {
  MOD_CRAFT_OUTPUT_APP_DIR,
  MOD_CRAFT_OUTPUT_MODULE_DIR,
  MOD_CRAFT_WORKSHOP_DIR,
} from '../../../../models/default.model.js';
import { AppType } from '../../../../../../sys/dev-descriptor/index.js';
// import { MOD_CRAFT_OUTPUT_DIR } from "../../../cd-module/workflow/default.model.js";
// import { MOD_CRAFT_OUTPUT_DIR } from "../../../cd-api/workflow/default.model.js";

export class CdAiWorkFlow {
  appType = AppType.CdApiModule;
  cdObjName = 'cd-ai';
  oEnv = 'workshop';
  outputDir = `${MOD_CRAFT_WORKSHOP_DIR}/${this.appType}/output`;
  // MOD_CRAFT_OUTPUT_MODULE_DIR
  // outputDir = `${MOD_CRAFT_WORKSHOP_DIR}/output`;

  createWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    extraParam: any,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdAiWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`,
    );
    return {
      cICdPipeline: {
        name: 'Module Creation Pipeline',
        type: 'cd-module-development',
        stages: [
          {
            name: 'Create Module Repository',
            description: 'Initialize the folder and basic structure for the module.',
            tasks: [
              {
                name: 'PreCreateCleanup',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'AppCraft',
                  a: 'PreCreateCleanup',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    appType: this.appType,
                    cdObjName: cdModule.name,
                    oEnv: this.oEnv,
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: 'createRepository',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'createRepository',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'cd-auto-git',
                  c: 'CdAutoGit',
                  a: 'createGitHubRepoOctokit',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    repoName: cdModule.name,
                    descript: cdModule.description,
                    isPrivate: false,
                    repoHost: 'corpdesk',
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: 'postCreateRepository',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'postCreateRepository',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'cd-auto-git',
                  c: 'CdAutoGit',
                  a: 'performPostRepoCreationActions',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    repoName: cdModule.name,
                    repoUrl: `https://github.com/corpdesk/${cdModule.name}`,
                    moduleType: 'cd-api',
                    path: `${this.outputDir}/${this.cdObjName}`,
                    appType: AppType.CdApiModule,
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: {
                      stageName: 'Create Module Repository',
                      taskName: 'createRootFiles',
                    },
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'createRootFiles',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'CdModule',
                  a: 'CreateRootFiles',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    moduleDir: `${this.outputDir}/${this.cdObjName}`,
                    moduleDescriptor: cdModule,
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: {
                      stageName: 'Create Module Repository',
                      taskName: 'createModuleDirectories',
                    },
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'createModuleDirectories',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'CdModule',
                  a: 'CreateModuleDirectories',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    // moduleDir: `${MOD_CRAFT_OUTPUT_APP_DIR}/${cdModule.name}`,
                    moduleDir: `${this.outputDir}/${this.cdObjName}`,
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: {
                      stageName: 'Create Module Repository',
                      taskName: 'generateEntityFiles',
                    },
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'generateEntityFiles',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'GenEntity',
                  a: 'GenerateAllEntitiesForCdObj',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    action: DevModeAction.CREATE,
                    moduleData: cdModule,
                    path: `${this.outputDir}/${this.cdObjName}`,
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: {
                      stageName: 'Create Module Repository',
                      taskName: 'generateControllers',
                      // commitAndPush
                      // taskName: 'commitAndPush',
                    },
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'generateControllers',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'GenController',
                  a: 'GenerateAllControllers',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    action: DevModeAction.CREATE,
                    moduleData: cdModule,
                    path: `${this.outputDir}/${this.cdObjName}`,
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: {
                      stageName: 'Create Module Repository',
                      taskName: 'generateServices',
                    },
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'generateServices',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'GenService',
                  a: 'GenerateAllServices',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    action: DevModeAction.CREATE,
                    moduleData: cdModule,
                    path: `${this.outputDir}/${this.cdObjName}`,
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: {
                      stageName: 'Create Module Repository',
                      taskName: 'commitAndPush',
                    },
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'commitAndPush',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'cd-auto-git',
                  c: 'CdAutoGit',
                  a: 'CommitAndPushIfChanges',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    moduleDir: `${this.outputDir}/${cdModule.name}`,
                    versionDescriptor: cdModule.versionControl,
                    comment: 'services and modules created',
                    action: DevModeAction.CREATE,
                  },
                },
                onResult: [
                  // {
                  //   ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                  //   toTask: {
                  //     stageName: 'Setup typeorm models',
                  //     taskName: 'modelsDevelopment',
                  //   },
                  // },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'notifyFailure',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'CiCdRunner',
                  a: 'SendFailureAlert',
                  dat: {
                    f_vals: [{ data: null }],
                    token: extraParam.cdToken,
                  },
                  args: {
                    message: `Failed during repository creation for module: ${cdModule.name}`,
                  },
                },
              },
            ],
          },
          /**
           * This assumes we have a cd-cli command dedicated to
           * executing bash scripts.
           * There would be a controller CdExecController which would have methods
           * for executing scripts eg
           * - CdExec()
           * - CdExecSql()
           *
           */
          {
            name: 'Database Preparation',
            description: 'Initial sync of database schema or seed content.',
            tasks: [
              {
                name: 'databasePreparation',
                type: 'method',
                executor: 'runner',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'CiCdRunner',
                  a: 'SendFailureAlert',
                  dat: {
                    f_vals: [{ data: null }],
                    token: extraParam.cdToken,
                  },
                  args: {
                    message: `Failed during repository creation for module: ${cdModule.name}`,
                  },
                },
                // onResult: [
                //   {
                //     ifState: [
                //       CdFxStateLevel.Success,
                //       CdFxStateLevel.PartialSuccess,
                //     ],
                //     toTask: {
                //       stageName: "Database Preparation",
                //       taskName: "databasePreparation",
                //     },
                //   },
                // ],
              },
            ],
          },
          /**
           * This assumes we have ModCraft module
           * CdExecController with the method createFromSql
           * createFromSql() would be responsible for creating models from sql definitions
           * and module descriptor
           *
           */
          {
            name: 'Setup typeorm models',
            description: 'create models for each controller based on sql script',
            tasks: [
              {
                name: 'modelsDevelopment',
                type: 'method',
                executor: 'cd-cli',
                className: 'CdModelController',
                methodName: 'createFromSql',
                status: 'pending',
                cdRequest: {
                  ctx: 'App',
                  m: 'ModCraft',
                  c: 'CdModelController',
                  a: 'createFromSql',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    cdModule: cdModule,
                    pathToSql: workshopConfig(cdModule.name, moduleType).moduleWorkflowPaths
                      .createSql,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  readWorkFlow(cdModule: CdModuleDescriptor, moduleType: string, extraParam: any): CiCdDescriptor {
    CdLog.debug('Starting CdAiWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`,
    );
    return {
      cICdPipeline: {
        name: 'TestBed Creation Pipeline',
        type: 'dev-env-setup',
        stages: [
          {
            name: 'Create TestBed',
            description: 'Create TestBed from app-craft Workshop Output',
            tasks: [
              {
                name: 'pushChanges',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'PushFromOutput',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'cloneProject',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'cloneProject',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'CloneToTestBed',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  // {
                  //   ifState: [
                  //     CdFxStateLevel.Success,
                  //     CdFxStateLevel.PartialSuccess,
                  //     CdFxStateLevel.LogicalFailure,
                  //   ],
                  //   toTask: "postCreateRepository",
                  // },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'notifyFailure',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'CiCdRunner',
                  a: 'SendFailureAlert',
                  dat: {
                    f_vals: [{ data: null }],
                    token: extraParam.cdToken,
                  },
                  args: {
                    message: `Failed during repository creation for module: ${cdModule.name}`,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  updateWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    extraParam: any,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdAiWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`,
    );
    return {
      cICdPipeline: {
        name: 'TestBed Creation Pipeline',
        type: 'dev-env-setup',
        stages: [
          {
            name: 'Create TestBed',
            description: 'Create TestBed from app-craft Workshop Output',
            tasks: [
              {
                name: 'pushChanges',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'PushFromOutput',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'cloneProject',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'cloneProject',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'CloneToTestBed',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  // {
                  //   ifState: [
                  //     CdFxStateLevel.Success,
                  //     CdFxStateLevel.PartialSuccess,
                  //     CdFxStateLevel.LogicalFailure,
                  //   ],
                  //   toTask: "postCreateRepository",
                  // },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'notifyFailure',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'CiCdRunner',
                  a: 'SendFailureAlert',
                  dat: {
                    f_vals: [{ data: null }],
                    token: extraParam.cdToken,
                  },
                  args: {
                    message: `Failed during repository creation for module: ${cdModule.name}`,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  deleteWorkFlow(cdModule: CdModuleDescriptor, moduleType: string, extraParam: any): CiCdDescriptor {
    CdLog.debug('Starting CdAiWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`,
    );
    return {
      cICdPipeline: {
        name: 'TestBed Creation Pipeline',
        type: 'dev-env-setup',
        stages: [
          {
            name: 'Create TestBed',
            description: 'Create TestBed from app-craft Workshop Output',
            tasks: [
              {
                name: 'pushChanges',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'PushFromOutput',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'cloneProject',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'cloneProject',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'CloneToTestBed',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  // {
                  //   ifState: [
                  //     CdFxStateLevel.Success,
                  //     CdFxStateLevel.PartialSuccess,
                  //     CdFxStateLevel.LogicalFailure,
                  //   ],
                  //   toTask: "postCreateRepository",
                  // },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'notifyFailure',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'CiCdRunner',
                  a: 'SendFailureAlert',
                  dat: {
                    f_vals: [{ data: null }],
                    token: extraParam.cdToken,
                  },
                  args: {
                    message: `Failed during repository creation for module: ${cdModule.name}`,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  upgradeWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    extraParam: any,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdAiWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`,
    );
    return {
      cICdPipeline: {
        name: 'TestBed Creation Pipeline',
        type: 'dev-env-setup',
        stages: [
          {
            name: 'Create TestBed',
            description: 'Create TestBed from app-craft Workshop Output',
            tasks: [
              {
                name: 'pushChanges',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'PushFromOutput',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'cloneProject',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'cloneProject',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'CloneToTestBed',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  // {
                  //   ifState: [
                  //     CdFxStateLevel.Success,
                  //     CdFxStateLevel.PartialSuccess,
                  //     CdFxStateLevel.LogicalFailure,
                  //   ],
                  //   toTask: "postCreateRepository",
                  // },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'notifyFailure',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'CiCdRunner',
                  a: 'SendFailureAlert',
                  dat: {
                    f_vals: [{ data: null }],
                    token: extraParam.cdToken,
                  },
                  args: {
                    message: `Failed during repository creation for module: ${cdModule.name}`,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  migrateWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    extraParam: any,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdAiWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`,
    );
    return {
      cICdPipeline: {
        name: 'TestBed Creation Pipeline',
        type: 'dev-env-setup',
        stages: [
          {
            name: 'Create TestBed',
            description: 'Create TestBed from app-craft Workshop Output',
            tasks: [
              {
                name: 'pushChanges',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'PushFromOutput',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'cloneProject',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'cloneProject',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'CloneToTestBed',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    descript: cdModule.versionControl,
                  },
                },
                onResult: [
                  // {
                  //   ifState: [
                  //     CdFxStateLevel.Success,
                  //     CdFxStateLevel.PartialSuccess,
                  //     CdFxStateLevel.LogicalFailure,
                  //   ],
                  //   toTask: "postCreateRepository",
                  // },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'notifyFailure',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'CiCdRunner',
                  a: 'SendFailureAlert',
                  dat: {
                    f_vals: [{ data: null }],
                    token: extraParam.cdToken,
                  },
                  args: {
                    message: `Failed during repository creation for module: ${cdModule.name}`,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }
}
