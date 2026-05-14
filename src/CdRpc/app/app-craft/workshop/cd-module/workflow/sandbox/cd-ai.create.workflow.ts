import { CdModuleDescriptor } from "../../../../../../sys/dev-descriptor/models/cd-module-descriptor.model.js";
import { CiCdDescriptor } from "../../../../../../sys/dev-descriptor/models/cicd-descriptor.model.js";
import { workshopConfig } from "../../../../models/app-craft.model.js";
import CdLog from "../../../../../../sys/comm/controllers/cd-logger.controller";
import { CdFxStateLevel } from "../../../../../../sys/base/i-base";
import { HOME } from "../../../../../../sys/utils/fs.util.js";
// import { MOD_CRAFT_OUTPUT_DIR } from "../default.model.js";
import { inspect } from "util";
import { MOD_CRAFT_OUTPUT_SANDBOX_DIR } from "../../../../../../app/app-craft/models/default.model.js";
// import { MOD_CRAFT_OUTPUT_DIR } from "../../../cd-module/workflow/default.model.js";

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
        name: "Module Creation Pipeline",
        type: "cd-module-development",
        stages: [
          {
            name: "Create Module Repository",
            description:
              "Initialize the folder and basic structure for the module.",
            tasks: [
              {
                name: "createRepository",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "cd-auto-git",
                  c: "CdAutoGit",
                  a: "createGitHubRepoOctokit",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
                  },
                  args: {
                    repoName: cdModule.name,
                    descript: cdModule.description,
                    isPrivate: false,
                    repoHost: "corpdesk",
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                    ],
                    toTask: "postCreateRepository",
                  },
                  {
                    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
                    toTask: "notifyFailure",
                  },
                ],
              },
              {
                name: "postCreateRepository",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "cd-auto-git",
                  c: "CdAutoGit",
                  a: "performPostRepoCreationActions",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
                  },
                  args: {
                    repoName: cdModule.name,
                    repoUrl: `https://github.com/corpdesk/${cdModule.name}`,
                    moduleType: "cd-api",
                    path: `${MOD_CRAFT_OUTPUT_SANDBOX_DIR}/${cdModule.name}`, // or "~/cd-ai",
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                    ],
                    toTask: {
                      stageName: "Create Module Repository",
                      taskName: "createModuleDirectories",
                    },
                  },
                ],
              },
              {
                name: "createModuleDirectories",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "CdModule",
                  a: "CreateModuleDirectories",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
                  },
                  args: {
                    moduleDir: `${MOD_CRAFT_OUTPUT_SANDBOX_DIR}/${cdModule.name}`,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                    ],
                    toTask: {
                      stageName: "Create Module Repository",
                      taskName: "generateEntityFiles",
                    },
                  },
                ],
              },
              {
                name: "generateEntityFiles",
                type: "method",
                executor: "cd-cli",
                status: "pending",
                cdRequest: {
                  ctx: "app",
                  m: "app-craft",
                  c: "GenEntity",
                  a: "GenerateAllEntitiesForCdObj",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
                  },
                  args: {
                    moduleData: cdModule,
                  },
                },
                onResult: [
                  {
                    ifState: [
                      CdFxStateLevel.Success,
                      CdFxStateLevel.PartialSuccess,
                    ],
                    toTask: {
                      stageName: "Database Preparation",
                      taskName: "databasePreparation",
                    },
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
            name: "Database Preparation",
            description: "Initial sync of database schema or seed content.",
            tasks: [
              {
                name: "databasePreparation",
                type: "method",
                executor: "runner",
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
            name: "Setup typeorm models",
            description:
              "create models for each controller based on sql script",
            tasks: [
              {
                name: "modelsDevelopment",
                type: "method",
                executor: "cd-cli",
                className: "CdModelController",
                methodName: "createFromSql",
                status: "pending",
                cdRequest: {
                  ctx: "App",
                  m: "ModCraft",
                  c: "CdModelController",
                  a: "createFromSql",
                  dat: {
                    f_vals: [
                      {
                        data: null,
                      },
                    ],
                    token: cdToken,
                  },
                  args: {
                    cdModule: cdModule,
                    pathToSql: workshopConfig(cdModule.name, moduleType)
                      .moduleWorkflowPaths.createSql,
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
