import { CdModuleDescriptor } from '../../../../../../sys/dev-descriptor/models/cd-module-descriptor.model';
import { CiCdDescriptor } from '../../../../../../sys/dev-descriptor/models/cicd-descriptor.model';
import { workshopConfig } from '../../../../models/app-craft.model';
import CdLog from '../../../../../../sys/comm/controllers/cd-logger.controller';
import { CdFxStateLevel } from '../../../../../../sys/base/i-base';
import { inspect } from 'util';
import { DevModeAction } from '../../../../../../sys/dev-mode/index';
import { MOD_CRAFT_WORKSHOP_DIR } from '../../../../models/default.model';
import { AppType } from '../../../../../../sys/dev-descriptor/index';

export class CdRfcWorkFlow {
  appType = AppType.CdApiModule;
  cdObjName = 'cd-rfc';
  oEnv = 'ci-cd';
  outputDir = `${MOD_CRAFT_WORKSHOP_DIR}/${this.appType}/output`;

  createWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    extraParam: any,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdRfcWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdRfcWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}, extraParam: ${inspect(extraParam, { depth: 2 })}`,
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
                  },
                ],
              },
              {
                name: 'NotifyFailure',
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
    CdLog.debug('Starting CdRfcWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdRfcWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
                  },
                ],
              },
              {
                name: 'NotifyFailure',
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

  /**
   * This method generates a CI/CD workflow descriptor for updating an existing rfc data.
   * This involves extracting `cd-rfc` block from a given documentation hosted in a git repository,
   * then pushing it to update database via cd-cli.
   * @param cdModule
   * @param moduleType
   * @param extraParam
   * @returns
   */
  // updateWorkFlow(
  //   cdModule: CdModuleDescriptor,
  //   moduleType: string,
  //   extraParam: any,
  // ): CiCdDescriptor {
  //   CdLog.debug('Starting CdRfcWorkFlow::updateWorkFlow()');
  //   CdLog.debug(
  //     `CdRfcWorkFlow:: updateWorkFlow()/cdModule: ${inspect(cdModule, {
  //       depth: 2,
  //     })}, type: ${moduleType}, extraParam: ${inspect(extraParam, { depth: 2 })}`,
  //   );
  //   return {
  //     cICdPipeline: {
  //       name: 'CdRfc Update Pipeline',
  //       type: 'dev-env-setup',
  //       stages: [
  //         {
  //           name: 'Update RFC Data',
  //           description: 'Extract and Update RFC Data from documentation repository',
  //           tasks: [
  //             {
  //               name: 'fetchRfcData',
  //               type: 'method',
  //               executor: 'cd-cli',
  //               status: 'pending',
  //               cdRequest: {
  //                 ctx: 'app',
  //                 m: 'cd-auto-git',
  //                 c: 'CdAutoGit',
  //                 a: 'ReadDocBlock',
  //                 dat: {
  //                   f_vals: [
  //                     {
  //                       data: null,
  //                     },
  //                   ],
  //                   token: extraParam.cdToken,
  //                 },
  //                 args: {
  //                   identifier: extraParam.srcPath, // git path to rfc documentation, e.g. 'owner/repo/path/to/doc.md'. Extracted from the command argument src-path
  //                   blockType: cdModule.versionControl?.repository.name, // 'cd-rfc' | 'cd-seed' | 'cd-expression' | 'all' = 'all',
  //                 },
  //               },
  //               onResult: [
  //                 {
  //                   ifState: [
  //                     CdFxStateLevel.Success,
  //                     CdFxStateLevel.PartialSuccess,
  //                     CdFxStateLevel.LogicalFailure,
  //                   ],
  //                   toTask: 'updateRfcData',
  //                 },
  //                 {
  //                   ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
  //                   toTask: 'NotifyFailure',
  //                 },
  //               ],
  //             },
  //             {
  //               name: 'updateRfcData',
  //               type: 'method',
  //               executor: 'cd-cli',
  //               status: 'pending',
  //               cdRequest: {
  //                 ctx: 'app',
  //                 m: 'app-craft',
  //                 c: 'CdModel',
  //                 a: 'Update',
  //                 dat: {
  //                   f_vals: [
  //                     {
  //                       data: null,
  //                     },
  //                   ],
  //                   token: extraParam.cdToken,
  //                 },
  //                 args: {
  //                   query: ?, // update with data of type IQuery built from a git repository cd-rfc block
  //                 },
  //               },
  //               onResult: [
  //                 {
  //                   ifState: [
  //                     CdFxStateLevel.Success,
  //                     CdFxStateLevel.PartialSuccess,
  //                     CdFxStateLevel.LogicalFailure,
  //                   ],
  //                   toTask: 'updateRfcData',
  //                 },
  //                 {
  //                   ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
  //                   toTask: 'NotifyFailure',
  //                 },
  //               ],
  //             },
  //             {
  //               name: 'NotifyFailure',
  //               type: 'method',
  //               executor: 'cd-cli',
  //               status: 'pending',
  //               cdRequest: {
  //                 ctx: 'sys',
  //                 m: 'dev-descriptor',
  //                 c: 'CiCdRunner',
  //                 a: 'SendFailureAlert',
  //                 dat: {
  //                   f_vals: [{ data: null }],
  //                   token: extraParam.cdToken,
  //                 },
  //                 args: {
  //                   message: `Failed during repository creation for module: ${cdModule.name}`,
  //                 },
  //               },
  //             },
  //           ],
  //         },
  //       ],
  //     },
  //   };
  // }

  updateWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    extraParam: any,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdRfcWorkFlow::updateWorkFlow()');
    CdLog.debug(
      `CdRfcWorkFlow:: updateWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}, extraParam: ${inspect(extraParam, { depth: 2 })}`,
    );
    return {
      cICdPipeline: {
        name: 'CdRfc Update Pipeline',
        type: 'dev-env-setup',
        stages: [
          {
            name: 'Update RFC Data',
            description: 'Extract and Update RFC Data from documentation repository',
            tasks: [
              // ─────────────────────────────
              // 1. FETCH
              // ─────────────────────────────
              {
                name: 'FetchRfcData',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'cd-auto-git',
                  c: 'CdAutoGit',
                  a: 'ReadDocBlock',
                  dat: {
                    f_vals: [{ data: null }],
                    token: extraParam.cdToken,
                  },
                  args: {
                    identifier: extraParam.srcPath,
                    blockType: cdModule.versionControl?.repository.name,
                  },
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: 'UpdateRfcData',
                  },
                  {
                    ifState: [
                      CdFxStateLevel.LogicalFailure,
                      CdFxStateLevel.Error,
                      CdFxStateLevel.Fatal,
                      CdFxStateLevel.SystemError,
                    ],
                    toTask: 'NotifyFailure',
                  },
                ],
              },

              // ─────────────────────────────
              // 2. UPDATE (USES OUTPUT)
              // ─────────────────────────────
              {
                name: 'UpdateRfcData',
                type: 'remoteCdRequest',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'cd-bio-engine',
                  c: 'CdBioEngineDna',
                  a: 'UpdateCdBioEngineDna',
                  dat: {
                    f_vals: [
                      {
                        query: {
                          update: {
                            cdBioEngineDnaData: '$outputs.FetchRfcData.blocks',
                          },
                        },
                        jsonUpdate: [
                          {
                            v: '1.0',
                            path: ['cdBioEngineDnaSrc', 'url'],
                            value: extraParam.srcPath,
                            action: 'read',
                            op: 'eq',
                          },
                        ],
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {},
                },
                onResult: [
                  {
                    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                    toTask: 'GetRfcData',
                  },
                  {
                    ifState: [
                      CdFxStateLevel.Error,
                      CdFxStateLevel.Fatal,
                      CdFxStateLevel.SystemError,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'NotifyFailure',
                  },
                ],
              },
              // ─────────────────────────────
              // 3. TEST READING OF DNA
              // ─────────────────────────────
              {
                name: 'GetRfcData',
                type: 'remoteCdRequest',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'cd-bio-engine',
                  c: 'CdBioEngineDna',
                  a: 'JGet',
                  dat: {
                    f_vals: [
                      {
                        // query: {
                        //   update: {
                        //     cdBioEngineDnaData: '$outputs.FetchRfcData.blocks',
                        //   },
                        // },
                        jsonUpdate: [
                          {
                            v: '1.0',
                            path: ['cdBioEngineDnaSrc', 'url'],
                            value: extraParam.srcPath,
                            action: 'read',
                            op: 'eq',
                          },
                        ],
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {},
                },
                onResult: [
                  // {
                  //   ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
                  //   toTask: null, // end
                  // },
                  {
                    ifState: [
                      CdFxStateLevel.Error,
                      CdFxStateLevel.Fatal,
                      CdFxStateLevel.SystemError,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'NotifyFailure',
                  },
                ],
              },

              // ─────────────────────────────
              // 3. FAILURE HANDLER
              // ─────────────────────────────
              {
                name: 'NotifyFailure',
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
                    message: `RFC update failed for module: ${cdModule.name}`,
                    failedTask: '$outputs.UpdateRfcData',
                    stage: 'Update RFC Data',
                    task: 'UpdateRfcData',
                  },
                },
              },
            ],
          },
        ],
      },
    };
  }

  deleteWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    extraParam: any,
  ): CiCdDescriptor {
    CdLog.debug('Starting CdRfcWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdRfcWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
                  },
                ],
              },
              {
                name: 'NotifyFailure',
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
    CdLog.debug('Starting CdRfcWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdRfcWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
                  },
                ],
              },
              {
                name: 'NotifyFailure',
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
    CdLog.debug('Starting CdRfcWorkFlow::createWorkFlow()');
    CdLog.debug(
      `CdRfcWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
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
                    toTask: 'NotifyFailure',
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
                    toTask: 'NotifyFailure',
                  },
                ],
              },
              {
                name: 'NotifyFailure',
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
