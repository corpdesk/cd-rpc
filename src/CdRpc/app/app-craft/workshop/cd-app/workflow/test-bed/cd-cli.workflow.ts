import {
  CiCdDescriptor,
  CICdPipeline,
} from '../../../../../../sys/dev-descriptor/models/cicd-descriptor.model.js';
import { workshopConfig } from '../../../../models/app-craft.model.js';
import CdLog from '../../../../../../sys/comm/controllers/cd-logger.controller';
import { CdFxStateLevel } from '../../../../../../sys/base/i-base';
import { HOME } from '../../../../../../sys/utils/fs.util.js';
// import { MOD_CRAFT_OUTPUT_APP_DIR } from "../default.model.js";
import { inspect } from 'util';
import { DevModeAction } from '../../../../../../sys/dev-mode/index.js';
import { CdAppDescriptor, envCdCli } from '../../../../../../sys/dev-descriptor/index.js';
import { MOD_CRAFT_OUTPUT_APP_DIR } from '../../../../models/default.model.js';

export class CdCliWorkFlow {
  createWorkFlow(descriptor: CdAppDescriptor, moduleType: string, extraParam: any): CiCdDescriptor {
    CdLog.debug('Starting CdAppWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAppWorkFlow:: createWorkFlow()/cdModule: ${inspect(descriptor, {
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
                    repoName: descriptor.name,
                    descript: descriptor.description,
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
                    repoName: descriptor.name,
                    repoUrl: `https://github.com/corpdesk/${descriptor.name}`,
                    moduleType: 'cd-cli',
                    path: `${MOD_CRAFT_OUTPUT_APP_DIR}/${descriptor.name}`, // or "~/cd-ai",
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
                    moduleDir: `${MOD_CRAFT_OUTPUT_APP_DIR}/${descriptor.name}`,
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
                    moduleData: descriptor,
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: {
                      stageName: 'Database Preparation',
                      taskName: 'databasePreparation',
                    },
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
                    message: `Failed during repository creation for module: ${descriptor.name}`,
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
                    message: `Failed during repository creation for module: ${descriptor.name}`,
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
                    cdModule: descriptor,
                    pathToSql: workshopConfig(descriptor.name, moduleType).moduleWorkflowPaths
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

  readWorkFlow(descriptor: CdAppDescriptor, moduleType: string, extraParam: any): CiCdDescriptor {
    CdLog.debug('Starting CdAppWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAppWorkFlow:: createWorkFlow()/cdModule: ${inspect(descriptor, {
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
                    descript: descriptor.versionControl,
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
                    descript: descriptor.versionControl,
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
                    message: `Failed during repository creation for module: ${descriptor.name}`,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  updateWorkFlow(descriptor: CdAppDescriptor, moduleType: string, extraParam: any): CiCdDescriptor {
    CdLog.debug('Starting CdAppWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAppWorkFlow:: createWorkFlow()/cdModule: ${inspect(descriptor, {
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
                    descript: descriptor.versionControl,
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
                    descript: descriptor.versionControl,
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
                    message: `Failed during repository creation for module: ${descriptor.name}`,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  deleteWorkFlow(descriptor: CdAppDescriptor, moduleType: string, extraParam: any): CiCdDescriptor {
    CdLog.debug('Starting CdAppWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAppWorkFlow:: createWorkFlow()/cdModule: ${inspect(descriptor, {
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
                    descript: descriptor.versionControl,
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
                    descript: descriptor.versionControl,
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
                    message: `Failed during repository creation for module: ${descriptor.name}`,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  /**
   * Get the workflow resonsible for managing the post-derivation process:
   * - NB: by the time the descriptor is already derived
   * - save descriptor at the .cd of the project direcoty
   */
  deriveWorkFlow(descriptor: CdAppDescriptor, moduleType: string, extraParam: any): CiCdDescriptor {
    CdLog.debug('Starting CdAppWorkFlow::deriveWorkFlow()');
    CdLog.debug(
      `CdAppWorkFlow:: deriveWorkFlow()/cdModule: ${inspect(descriptor, {
        depth: 2,
      })}, type: ${moduleType}`,
    );
    CdLog.debug(
      `CdAppWorkFlow:: deriveWorkFlow()/cdModule: ${inspect(descriptor, {
        depth: 2,
      })}, type: ${moduleType}`,
    );
    const cdApiDir = descriptor.versionControl?.repository.directories?.find(
      (d) => d.environment === envCdCli,
    )?.path;
    return {
      cICdPipeline: {
        name: 'CdApp Derivation Pipeline',
        type: 'dev-env-setup',
        stages: [
          {
            name: 'Derive CdApp',
            description: 'Derive CdApp from exitisting project',
            tasks: [
              {
                name: 'saveDescriptor',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'CiCd',
                  a: 'CreateFile',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    path: `${cdApiDir}/.cd/cd-app.descriptor.json`,
                    contents: `${JSON.stringify(descriptor)}`,
                  },
                },
                onResult: [
                  // {
                  //   ifState: [
                  //     CdFxStateLevel.Success,
                  //     CdFxStateLevel.PartialSuccess,
                  //     CdFxStateLevel.LogicalFailure,
                  //   ],
                  //   toTask: 'cloneProject',
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
                    message: `Failed during repository derivation process for for module: ${descriptor.name}`,
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
    descriptor: CdAppDescriptor,
    moduleType: string,
    extraParam: any,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdAppWorkFlow::upgradeWorkFlow()');
    CdLog.debug(
      `CdAppWorkFlow:: upgradeWorkFlow()/CdAppDescriptor: ${inspect(descriptor, {
        depth: 1,
      })}, type: ${moduleType}`,
    );
    const version = extraParam.version || descriptor.versionControl?.version;
    if (!version) {
      throw new Error('Version is required for upgrade workflow');
    }
    const cdApiDir = descriptor.versionControl?.repository.directories?.find(
      (d) => d.environment === envCdCli,
    )?.path;
    if (!cdApiDir) {
      throw new Error('CdCli directory path is not defined in the descriptor');
    }
    CdLog.debug(`CdAppWorkFlow:: upgradeWorkFlow()/cdApiDir: ${cdApiDir}, version: ${version}`);
    const patchDescription = `Testing Upgrade CdApp to version ${version}`;
    /**
     * set up the options for incrementPatch method
     * - dryRun: true or false based on your requirement
     * - commitMessage: patchDescription
     *   - this is used to set the commit message for the patch increment
     *   - it can be customized based on your requirements
     *   - it is used to set the commit message for the patch increment
     */
    const versionOptions = {
      dryRun: false, // or false based on your requirement
      commitMessage: patchDescription,
    };
    return {
      cICdPipeline: {
        name: 'Uppgrade CdApp',
        type: 'dev-env-setup',
        stages: [
          {
            name: 'Upgrade CdApp',
            description: 'Upgrade TestBed from app-craft Workshop Output',
            tasks: [
              {
                name: 'beforeUpgrade',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'Version',
                  a: 'BeforeUpgrade',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    path: cdApiDir,
                    version: version,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'upgrade',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'upgrade',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'Version',
                  a: 'Upgrade',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    path: cdApiDir,
                    version: version,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'afterUpgrade',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'afterUpgrade',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'Version',
                  a: 'AfterUpgrade',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    path: cdApiDir,
                    version: version,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'incrementPatch',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              /**
               * place this task if you want to increment the patch version
               * - this is optional and can be skipped if you don't want to increment the patch version
               * Note that CdFxStateLevel can also be used to control the flow to be directed to increment
               * the patch.
               */
              {
                name: 'incrementPatch',
                description: 'Testing patch increment',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'sys',
                  m: 'dev-descriptor',
                  c: 'Version',
                  a: 'IncrementPatch',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    path: cdApiDir,
                    version: version,
                    opts: versionOptions,
                  },
                },
                onResult: [
                  // {
                  //   ifState: [
                  //     CdFxStateLevel.Success,
                  //     CdFxStateLevel.PartialSuccess,
                  //     CdFxStateLevel.LogicalFailure,
                  //   ],
                  //   toTask: 'afterUpgrade',
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
                    message: `Failed during repository creation for module: ${descriptor.name}`,
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
    descriptor: CdAppDescriptor,
    moduleType: string,
    extraParam: any,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdAppWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdAppWorkFlow:: createWorkFlow()/cdModule: ${inspect(descriptor, {
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
                    descript: descriptor.versionControl,
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
                    descript: descriptor.versionControl,
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
                    message: `Failed during repository creation for module: ${descriptor.name}`,
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  async getRoadMap(
    action: 'create' | 'read' | 'update' | 'delete' | 'derive' | 'upgrade' | 'migrate',
    descriptor: CdAppDescriptor,
    moduleType: string,
    extraParam: any,
  ): Promise<CICdPipeline> {
    /**
     * Notes on cd-cli roadmap:
     * - run upgrade to auto tag the version for 0.8.2
     * - place auto increment tast to perform patch increment
     * - update version documents (roadmap, changelog, docs)
     * - clean entry point ready for auto development
     * - documentation for entry point
     */
    return {
      name: 'cd-cli roadmap',
      type: 'dev-roadmap',
      description: 'Initial roadmap for cd-cli auto-development, starting from version 0.8.0',
      versionTag: 0,
      version: '0.8.0',
      fileMeta: {lastUpdated: '2025-07-26T22:05:36.273Z'},
      stages: [
        {
          name: 'afterUpgrade Testing',
          description:
            'Focus on verifying afterUpgrade features including changelog, patch, and docs updates.',
          orderId: 8,
          tasks: [
            {
              name: 'upgrade',
              type: 'method',
              executor: 'cd-cli',
              status: 'pending',
              cdRequest: {
                ctx: 'app',
                m: 'cd-auto-git',
                c: 'CdAutoGit',
                a: 'createGitHubRepoOctokit',
                dat: {
                  f_vals: [],
                  token: '<token>',
                },
                args: {
                  repoName: 'abcd',
                  repoHost: 'corpdesk',
                  isPrivate: true,
                },
              },
              assert: {
                ctx: 'app',
                m: 'cd-auto-git',
                c: 'CdAutoGit',
                a: 'checkIfRepoExists',
                dat: {
                  f_vals: [],
                  token: '<token>',
                },
                args: {
                  repoName: 'abcd',
                  repoHost: 'corpdesk',
                },
              },
              onResult: [
                {
                  ifState: [CdFxStateLevel.Success],
                  toTask: 'initializeReadme',
                },
                {
                  ifState: [CdFxStateLevel.SystemError, CdFxStateLevel.Fatal],
                  toTask: 'notifyFailure',
                },
              ],
            },
          ],
        },
      ],
    };
  }
}
