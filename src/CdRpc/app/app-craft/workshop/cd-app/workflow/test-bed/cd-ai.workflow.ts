import { CdModuleDescriptor } from "../../../../../../sys/dev-descriptor/models/cd-module-descriptor.model";
import { CiCdDescriptor } from "../../../../../../sys/dev-descriptor/models/cicd-descriptor.model";
import CdLog from "../../../../../../sys/comm/controllers/cd-logger.controller";
import { CdFxStateLevel } from "../../../../../../sys/base/i-base";
import { inspect } from "util";

export class CdAiWorkFlow {
  createWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    cdToken: string
  ): CiCdDescriptor {
    CdLog.debug("Starting CdAiWorkFlow::createWorkFlow()");
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`
    );
    return {
      cICdPipeline: {
        name: "TestBed Creation Pipeline",
        type: "dev-env-setup",
        stages: [
          {
            name: "Create TestBed",
            description:
              "Create TestBed from app-craft Workshop Output",
            tasks: [
              {
                name: "pushChanges",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "PushFromOutput",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "cloneProject",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "cloneProject",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "CloneToTestBed",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "notifyFailure",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "sys",
                  m: "dev-descriptor",
                  c: "CiCdRunner",
                  a: "SendFailureAlert",
                  dat: {
                    f_vals: [{ data: null }],
                    token: cdToken,
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

  readWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    cdToken: string
  ): CiCdDescriptor {
    CdLog.debug("Starting CdAiWorkFlow::createWorkFlow()");
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`
    );
    return {
      cICdPipeline: {
        name: "TestBed Creation Pipeline",
        type: "dev-env-setup",
        stages: [
          {
            name: "Create TestBed",
            description:
              "Create TestBed from app-craft Workshop Output",
            tasks: [
              {
                name: "pushChanges",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "PushFromOutput",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "cloneProject",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "cloneProject",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "CloneToTestBed",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "notifyFailure",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "sys",
                  m: "dev-descriptor",
                  c: "CiCdRunner",
                  a: "SendFailureAlert",
                  dat: {
                    f_vals: [{ data: null }],
                    token: cdToken,
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
    cdToken: string
  ): CiCdDescriptor {
    CdLog.debug("Starting CdAiWorkFlow::updateWorkFlow()");
    CdLog.debug(
      `CdAiWorkFlow:: updateWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`
    );
    return {
      cICdPipeline: {
        name: "TestBed Creation Pipeline",
        type: "dev-env-setup",
        stages: [
          {
            name: "Create TestBed",
            description:
              "Create TestBed from app-craft Workshop Output",
            tasks: [
              {
                name: "pushChanges",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "PushFromOutput",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "pullChanges",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "pullChanges",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "PullToTestBed",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "entitySetup",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "entitySetup",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "AddModuleToEntities",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
                  },
                  args: {
                    descript: cdModule,
                  },
                }, 
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                      CdFxStateLevel.LogicalFailure,
                    ],
                    toTask: "databaseSync",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "databaseSync",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "SyncDatabaseSchema",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
                  },
                  args: {
                    descript: cdModule,
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
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "notifyFailure",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "sys",
                  m: "dev-descriptor",
                  c: "CiCdRunner",
                  a: "SendFailureAlert",
                  dat: {
                    f_vals: [{ data: null }],
                    token: cdToken,
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

  deleteWorkFlow(
    cdModule: CdModuleDescriptor,
    moduleType: string,
    cdToken: string
  ): CiCdDescriptor {
    CdLog.debug("Starting CdAiWorkFlow::createWorkFlow()");
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`
    );
    return {
      cICdPipeline: {
        name: "TestBed Creation Pipeline",
        type: "dev-env-setup",
        stages: [
          {
            name: "Create TestBed",
            description:
              "Create TestBed from app-craft Workshop Output",
            tasks: [
              {
                name: "pushChanges",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "PushFromOutput",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "cloneProject",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "cloneProject",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "CloneToTestBed",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "notifyFailure",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "sys",
                  m: "dev-descriptor",
                  c: "CiCdRunner",
                  a: "SendFailureAlert",
                  dat: {
                    f_vals: [{ data: null }],
                    token: cdToken,
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
    cdToken: string
  ): CiCdDescriptor {
    CdLog.debug("Starting CdAiWorkFlow::createWorkFlow()");
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`
    );
    return {
      cICdPipeline: {
        name: "TestBed Creation Pipeline",
        type: "dev-env-setup",
        stages: [
          {
            name: "Create TestBed",
            description:
              "Create TestBed from app-craft Workshop Output",
            tasks: [
              {
                name: "pushChanges",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "PushFromOutput",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "cloneProject",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "cloneProject",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "CloneToTestBed",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "notifyFailure",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "sys",
                  m: "dev-descriptor",
                  c: "CiCdRunner",
                  a: "SendFailureAlert",
                  dat: {
                    f_vals: [{ data: null }],
                    token: cdToken,
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
    cdToken: string
  ): CiCdDescriptor {
    CdLog.debug("Starting CdAiWorkFlow::createWorkFlow()");
    CdLog.debug(
      `CdAiWorkFlow:: createWorkFlow()/cdModule: ${inspect(cdModule, {
        depth: 2,
      })}, type: ${moduleType}`
    );
    return {
      cICdPipeline: {
        name: "TestBed Creation Pipeline",
        type: "dev-env-setup",
        stages: [
          {
            name: "Create TestBed",
            description:
              "Create TestBed from app-craft Workshop Output",
            tasks: [
              {
                name: "pushChanges",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "PushFromOutput",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "cloneProject",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "cloneProject",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "TestBed",
                  a: "CloneToTestBed",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
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
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "notifyFailure",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "sys",
                  m: "dev-descriptor",
                  c: "CiCdRunner",
                  a: "SendFailureAlert",
                  dat: {
                    f_vals: [{ data: null }],
                    token: cdToken,
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
