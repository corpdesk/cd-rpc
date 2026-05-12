import { CdModuleDescriptor } from '../../../../../../sys/dev-descriptor/models/cd-module-descriptor.model.js';
import { CiCdDescriptor } from '../../../../../../sys/dev-descriptor/models/cicd-descriptor.model.js';
import CdLog from '../../../../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { CdFxStateLevel } from '../../../../../../sys/base/i-base.js';
import { inspect } from 'util';
import { AppType } from '../../../../../../sys/dev-descriptor/index.js';

export class CdAiWorkFlow {
  appType = AppType.CdApiModule;
  cdObjName = 'cd-ai';
  oEnv = 'test-bed';
  
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
        name: 'TestBed Creation Pipeline',
        type: 'dev-env-setup',
        stages: [
          {
            name: 'Create TestBed',
            description: 'Create TestBed from app-craft Workshop Output',
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
                    toTask: 'pushChanges',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
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
                    vc: cdModule.versionControl,
                    dirName: 'workshopModuleOutput',
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
                    vc: cdModule.versionControl,
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
                    vc: cdModule.versionControl,
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
                    vc: cdModule.versionControl,
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
    CdLog.debug('Starting CdAiWorkFlow::updateWorkFlow()');
    CdLog.debug(
      `CdAiWorkFlow:: updateWorkFlow()/cdModule: ${inspect(cdModule, {
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
                    vc: cdModule.versionControl,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'pullChanges',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'pullChanges',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'PullToTestBed',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    vc: cdModule.versionControl,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'entitySetup',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'entitySetup',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'AddModuleToEntities',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    module: cdModule,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'databaseSync',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'databaseSync',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                retryCount: 3, // ⬅️ Retry up to 3 times
                retryDelay: 3000, // ⏱ Optional: 3 seconds between retries
                timeout: 120000, // ⏳ Optional: give each attempt 60s before timing out
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'MigrateDatabaseSchema',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    module: cdModule,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: "initModuleInCdInstance",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'initModuleInCdInstance',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                retryCount: 3, // ⬅️ Retry up to 3 times
                retryDelay: 3000, // ⏱ Optional: 3 seconds between retries
                timeout: 120000, // ⏳ Optional: give each attempt 60s before timing out
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'RegisterModuleInCdInstance',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    module: cdModule,
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
            name: 'Purge Module from TestBed',
            description: 'Create TestBed from app-craft Workshop Output',
            tasks: [
              {
                name: 'deregisterModule',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'DeRegisterModuleInCdInstance',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    module: cdModule,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: 'purgeDbObjects',
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: 'notifyFailure',
                  },
                ],
              },
              {
                name: 'purgeDbObjects',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'PurgeModuleFromDb',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    module: cdModule,
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

  testWorkFlow(cdModule: CdModuleDescriptor, moduleType: string, extraParam: any): CiCdDescriptor {
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
            name: 'CRUD Test Module',
            description: 'Perform CRUD test operations on the module',
            tasks: [
              {
                name: 'crudTest',
                type: 'method',
                executor: 'cd-cli',
                status: 'pending',
                cdRequest: {
                  ctx: 'app',
                  m: 'app-craft',
                  c: 'TestBed',
                  a: 'RunCRUDTests',
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: extraParam.cdToken,
                  },
                  args: {
                    module: cdModule,
                  },
                },
                onResult: [
                  // {
                  //   ifState: [
                  //     CdFxStateLevel.Success,
                  //     CdFxStateLevel.PartialSuccess,
                  //     CdFxStateLevel.LogicalFailure,
                  //   ],
                  //   toTask: 'purgeDbObjects',
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
