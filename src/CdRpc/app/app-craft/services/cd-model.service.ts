/* eslint-disable style/brace-style */

// import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model';
import { Request, Response } from "express";
import {
  DevModeAction,
  DevModeModel,
} from "../../../sys/dev-mode/models/dev-mode.model";
import { CiCdRunnerService } from "../../../sys/dev-descriptor/services/cd-ci-runner.service";
// import { CdObjModel, defaultCdObjEnv } from '../../../sys/moduleman/models/cd-obj.model';
import { GenericService } from "../../../sys/base/generic-service";
import { DevDescriptorService } from "../../../sys/dev-descriptor/services/dev-descriptor.service";
import {
  CD_FX_FAIL,
  CdAssertReturn,
  CdFxReturn,
  DEFAULT_ENVELOPE,
  DEFAULT_ENVELOPE_CREATE,
  ICdRequest,
  ICdResponse,
  IQuery,
  IServiceInput,
} from "../../../sys/base/i-base";
import { AppType, CdModuleDescriptor } from "../../../sys/dev-descriptor/index";
import CdLog from "../../../sys/comm/controllers/cd-logger.controller";
import { inferCdObjType } from "../../../sys/utils/cd-naming.util";
import { HttpService } from "../../../sys/base/http.service";
import { CdModelModel } from "../models/cd-model.model";
import { TestBedService } from "./test-bed.service";
import { inspect } from "node:util";
import { BaseService } from "../../../sys/base/base.service";
import { Logging } from "../../../sys/base/winston.log";
import { ICdExecutionContext } from "../../../sys/dev-descriptor/models/runtime-descriptor.model";
import { SessionService } from "../../../sys/user/services/session.service";
import { CD_FX_PARTIAL_SUCCESS } from "../../../sys/base/cd-fx-return.util";
// import { CdModuleDescriptor } from '../workshop/cd-api/workflow/default.model';

// export class CdModelService {
export class CdModelService extends GenericService<CdModelModel> {
  cdToken;
  logger: Logging;
  // private svCiCdRunner: CiCdRunnerService;
  // svDevDescriptors;
  svTestBed: TestBedService = new TestBedService();
  postData: ICdRequest = DEFAULT_ENVELOPE_CREATE;
  serviceModel = CdModelModel;
  docName: string = "";

  constructor() {
    super(CdModelModel);
    this.logger = new Logging();
    // this.svDevDescriptors = new DevDescriptorService();
    // this.svCiCdRunner = new CiCdRunnerService();
  }

  init(): this {
    // this.svCiCdRunner = new CiCdRunnerService();
    return this;
  }

  async createRpc(
    req: Request,
    res: Response,
  ): Promise<CdFxReturn<CdModelModel> | CdModelModel[] | ICdResponse | void> {}

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
  async createLocal(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug("Starting CdModelService::create()");
    this.logger.logDebug(
      `CdModelService::create()/actionTargetName: ${actionTargetName}`,
    );
    this.logger.logDebug(`CdModelService::create()/moduleName: ${moduleName}`);
    this.logger.logDebug(`CdModelService::create()/oEnv: ${oEnv}`);
    this.logger.logDebug(`CdModelService::create()/repoName: ${repoName}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    const runner = new CiCdRunnerService();
    const { descriptor, workflowModel } =
      await runner.loadModelDescriptorAndWorkflow(
        cdCtx,
        DevModeAction.CREATE,
        cdObjType,
        moduleName,
        oEnv,
        {
          actionTargetName: actionTargetName,
          descriptor: "CdModuleDescriptor",
          cdToken: "", // Pass the cdToken if needed
          repoName: repoName,
          appType: AppType.CdApiModule,
          oEnv: oEnv,
        },
      );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdModelService::createLocal()/ No valid workflowModel`,
      };
    }
    const svCiCdRunner = new CiCdRunnerService();
    return await svCiCdRunner.run(descriptor, workflowModel);
  }

  async createFromSql(
    moduleDescriptor: CdModuleDescriptor,
    pathToSql: string,
  ) {}

  async createFromDescriptor(
    moduleDescriptor: CdModuleDescriptor,
    pathToSql: string,
  ) {}

  // async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
  //   try {
  //     /**
  //      * The q is allowed to be null
  //      * If null it is substituted by { where: {} }
  //      * Which would then fetch all the data
  //      */
  //     const payload = this.svDevDescriptors.setEnvelope("Read", {
  //       query: q ?? { where: {} },
  //     });
  //     return CD_FX_FAIL; // placeholder until this method is properly implemented
  //   } catch (error) {
  //     return {
  //       data: null,
  //       state: false,
  //       message: `Read failed: ${(error as Error).message}`,
  //     };
  //   }
  // }

  protected getTypeId(): number {
    return 1; // CdModel type
  }

  // async update(
  //   actionTargetName: string,
  //   moduleName: string,
  //   oEnv: string,
  //   repoName: string,
  //   srcPath?: string,
  // ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
  //   this.logger.logDebug("Starting CdModelService::update()");
  //   this.logger.logDebug(
  //     `CdModelService::update()/actionTargetName: ${actionTargetName}`,
  //   );
  //   this.logger.logDebug(`CdModelService::update()/moduleName: ${moduleName}`);
  //   this.logger.logDebug(`CdModelService::update()/oEnv: ${oEnv}`);
  //   this.logger.logDebug(`CdModelService::update()/repoName: ${repoName}`);
  //   this.logger.logDebug(`CdModelService::update()/srcPath: ${srcPath}`);
  //   const cdObjType = inferCdObjType(this.constructor.name);
  //   const runner = new CiCdRunnerService();
  //   const { descriptor, workflowModel } =
  //     await runner.loadModelDescriptorAndWorkflow(
  //       DevModeAction.UPDATE,
  //       cdObjType,
  //       moduleName,
  //       oEnv,
  //       {
  //         actionTargetName: actionTargetName,
  //         descriptor: "CdModuleDescriptor",
  //         cdToken: "", // Pass the cdToken if needed
  //         repoName: repoName,
  //         appType: AppType.CdApiModule,
  //         srcPath: srcPath,
  //       },
  //     );

  //   if (!workflowModel) {
  //     return {
  //       state: false,
  //       data: null,
  //       message: `CdModelService::update()/ No valid workflowModel`,
  //     };
  //   }
  //   this.init();
  //   return await this.svCiCdRunner.run(descriptor, workflowModel);
  // }

  async updateEntry(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    srcPath?: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug(
      "Starting [CdRpc][CdModelController][updateEntry] → Starting update...",
    );

    this.logger.logDebug(
      `CdModelService::updateEntry()/cdCtx.request: ${inspect(cdCtx.request, { depth: 2 })}`,
    );
    // this.logger.logDebug(
    //   `CdModelService::updateEntry()/(cdCtx.request as any).post.args: ${inspect((cdCtx.request as any).post, { depth: 2 })}`,
    // );
    this.logger.logDebug("Starting CdModuleService::update()");
    this.logger.logDebug(
      `[CdRpc][CdModelController][updateEntry] → actionTargetName: ${actionTargetName}`,
    );
    this.logger.logDebug(
      `[CdRpc][CdModelController][updateEntry] → moduleName: ${moduleName}`,
    );
    this.logger.logDebug(
      `[CdRpc][CdModelController][updateEntry] → oEnv: ${oEnv}`,
    );
    this.logger.logDebug(
      `[CdRpc][CdModelController][updateEntry] → repoName: ${repoName}`,
    );
    this.logger.logDebug(
      `[CdRpc][CdModelController][updateEntry] → srcPath: ${srcPath}`,
    );
    switch (oEnv) {
      case "workshop":
        this.logger.logDebug(
          `[CdRpc][CdModelController][updateEntry] → case:workshop`,
        );
        return this.updateLocal(
          cdCtx,
          actionTargetName,
          moduleName,
          oEnv,
          repoName,
          srcPath,
        );
      /**
       * ci-cd is an entry point from BaseService.invokeCdRequest() via cli command or ai invocation.
       * It is meant to trigger workflows that are not necessarily tied to the current environment (workshop or test-bed)
       * but are related to CI/CD processes.
       * The routing is done based on the actionTargetName which should be provided in the request.
       * This allows for more flexibility in triggering specific workflows that may involve multiple environments or are specific to CI/CD operations.
       */
      case "ci-cd":
        this.logger.logDebug(
          `[CdRpc][CdModelController][updateEntry] → case:ci-cd with actionTargetName: ${actionTargetName}`,
        );
        return this.updateLocal(
          cdCtx,
          actionTargetName,
          moduleName,
          oEnv,
          repoName,
          srcPath,
        );
      case "test-bed":
        this.logger.logDebug(
          `[CdRpc][CdModelController][updateEntry] → case:test-bed`,
        );
        return this.svTestBed.update(
          cdCtx,
          actionTargetName,
          moduleName,
          oEnv,
          repoName,
        );
      // /**
      //  * This case is specifically for handling updates that are triggered from CI/CD processes that are routed to cd-api backend.
      //  * It allows for updates to be processed in the workshop environment as part of CI/CD workflows, which may include tasks such as automated testing, deployment, or other operations that are initiated from CI/CD pipelines. The routing is based on the oEnv value being 'ci-cd', which indicates that the request is coming from a CI/CD context and should be handled accordingly.
      //  */
      // case 'cd-api-route':
      //   this.logger.logDebug(`CdModelController::update()/case:cd-api-route`);
      //   return this.svCdModel.update(actionTargetName, moduleName, oEnv, repoName, srcPath);
    }

    return {
      state: false,
      data: null,
      message: `CdModelController::updateEntry: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  async updateCommon() {}

  async updateLocal(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    srcPath?: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug("Starting CdModelService::update()");
    this.logger.logDebug(
      `CdModelService::updateLocal()/cdCtx.request: ${inspect(cdCtx.request, { depth: 2 })}`,
    );
    this.logger.logDebug(
      `CdModelService::updateLocal()/actionTargetName: ${actionTargetName}`,
    );
    this.logger.logDebug(
      `CdModelService::updateLocal()/moduleName: ${moduleName}`,
    );
    this.logger.logDebug(`CdModelService::updateLocal()/oEnv: ${oEnv}`);
    this.logger.logDebug(`CdModelService::updateLocal()/repoName: ${repoName}`);
    this.logger.logDebug(`CdModelService::updateLocal()/srcPath: ${srcPath}`);
    const cdObjType = inferCdObjType(this.constructor.name);
    this.logger.logDebug(
      `CdModelService::updateLocal()/(cdCtx.request as any).post.args2: ${inspect((cdCtx.request as any).post, { depth: 2 })}`,
    );
    const runner = new CiCdRunnerService();
    this.logger.logDebug(
      `CdModelService::updateLocal()/(cdCtx.request as any).post.args3: ${inspect((cdCtx.request as any).post, { depth: 2 })}`,
    );
    const { descriptor, workflowModel } =
      await runner.loadModelDescriptorAndWorkflow(
        cdCtx,
        DevModeAction.UPDATE,
        cdObjType,
        moduleName,
        oEnv,
        {
          actionTargetName: actionTargetName,
          descriptor: "CdModuleDescriptor",
          cdToken: "", // Pass the cdToken if needed
          repoName: repoName,
          appType: AppType.CdApiModule,
          srcPath: srcPath,
        },
      );

    if (!workflowModel) {
      return {
        state: false,
        data: null,
        message: `CdModelService::updateLocal()/ No valid workflowModel`,
      };
    }
    // this.init();
    // const svCiCdRunner = new CiCdRunnerService();
    return await runner.run(descriptor, workflowModel);
  }

  async updateRpc(req, res, cdCtx: ICdExecutionContext): Promise<void> {
    const svSess = new SessionService();

    try {
      ///////////////////////////////////////////////////////
      // Request payload
      ///////////////////////////////////////////////////////

      const request = cdCtx.request as ICdRequest;

      this.logger.logDebug(
        `CdModelService::updateRpc()/requestId:${cdCtx.requestId}`,
      );

      this.logger.logDebug(
        `CdModelService::updateRpc()/args:${inspect(request.args, { depth: 2 })}`,
      );

      ///////////////////////////////////////////////////////
      // Validate args
      ///////////////////////////////////////////////////////

      const args = request.args;

      if (!args) {
        this.b.i = {
          messages: ["Invalid arguments provided"],
          code: "CdModelService:updateRpc",
          app_msg: "Missing request args",
        };

        this.b.setAppState(false, this.b.i, svSess.sessResp);

        await this.b.respond(req, res);
        // return {
        //   state: false,
        //   data: null,
        //   message: "Missing request args",
        // };
      }

      ///////////////////////////////////////////////////////
      // Extract args
      ///////////////////////////////////////////////////////

      const actionTargetName = args.actionTargetName;

      const moduleName = args.name;

      const oEnv = args.oEnv || args["o-env"];

      const repoName = args.repo || args.repoName;

      args["src-path"] = this.normalizeSrcPath(args["src-path"]);
      const srcPath = args["src-path"] || args.srcPath;

      this.logger.logDebug(
        `CdModelService::updateRpc()/normailized srcPath:${srcPath}`,
      );

      ///////////////////////////////////////////////////////
      // Execute update
      ///////////////////////////////////////////////////////

      const ret = await this.updateEntry(
        cdCtx,
        actionTargetName,
        moduleName,
        oEnv,
        repoName,
        srcPath,
      );

      ///////////////////////////////////////////////////////
      // Success response
      ///////////////////////////////////////////////////////

      this.b.i = {
        messages: [],
        code: "CdModelService:updateRpc:Success",
        app_msg: ret.message || "Update completed successfully",
      };

      this.b.setAppState(
        ret.state === true || ret.state === 1,
        this.b.i,
        svSess.sessResp,
      );

      this.b.cdResp.data = ret;

      this.logger.logDebug(
        `CdModelService::updateRpc()/response-preview:${inspect(this.b.cdResp, {
          depth: 4,
        })}`,
      );

      try {
        this.logger.logDebug(
          `CdModelService::updateRpc()/response-preview:001`,
        );
        // JSON.stringify(this.b.cdResp);
        this.logger.logDebug(
          `CdModelService::updateRpc()/response-preview:${JSON.stringify(this.b.cdResp)}`,
        );
        this.logger.logDebug(
          `CdModelService::updateRpc()/response-preview:002`,
        );
      } catch (e) {
        this.logger.logDebug(
          `CdModelService::updateRpc()/response-preview:003`,
        );
        this.logger.logError(
          `Response serialization failed:${(e as Error).message}`,
        );

        this.b.i = {
          messages: [e.message],
          code: "CdModelService:updateRpc:Error",
          app_msg: "Response serialization failed",
        };

        this.b.setAppState(false, this.b.i, svSess.sessResp);

        await this.b.respond(req, res);

        // return {
        //   state: false,
        //   data: null,
        //   message: "Response serialization failed"
        // };
      }

      this.logger.logDebug(`CdModelService::updateRpc()/response-preview:004`);

      await this.b.respond(req, res);
      // return {
      //   state: true,
      //   data: ret,
      // };
    } catch (e: any) {
      ///////////////////////////////////////////////////////
      // Error response
      ///////////////////////////////////////////////////////

      this.logger.logError(`CdModelService::updateRpc()/error:${e.message}`);

      this.b.i = {
        messages: [e.message],
        code: "CdModelService:updateRpc:Error",
        app_msg: "Update failed",
      };

      this.b.setAppState(false, this.b.i, svSess.sessResp);

      await this.b.respond(req, res);
      // return {
      //   state: false,
      //   data: null,
      //   message: "Update failed",
      // };
    }
  }

  private normalizeSrcPath(value: unknown): string {
    if (typeof value !== "string") return "";

    return value.trim().replace(/^"+|"+$/g, ""); // removes wrapping quotes
  }

  // async delete(
  //   actionTargetName: string,
  //   moduleName: string,
  //   oEnv: string,
  //   repoName: string,
  // ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
  //   this.logger.logDebug("Starting CdModelService::delete()");
  //   this.logger.logDebug(
  //     `CdModelService::delete()/actionTargetName: ${actionTargetName}`,
  //   );
  //   this.logger.logDebug(`CdModelService::delete()/moduleName: ${moduleName}`);
  //   this.logger.logDebug(`CdModelService::delete()/oEnv: ${oEnv}`);
  //   this.logger.logDebug(`CdModelService::delete()/repoName: ${repoName}`);
  //   const cdObjType = inferCdObjType(this.constructor.name);
  //   const runner = new CiCdRunnerService();
  //   const { descriptor, workflowModel } =
  //     await runner.loadModelDescriptorAndWorkflow(
  //       DevModeAction.DELETE,
  //       cdObjType,
  //       moduleName,
  //       oEnv,
  //       {
  //         actionTargetName: actionTargetName,
  //         descriptor: "CdModuleDescriptor",
  //         cdToken: "", // Pass the cdToken if needed
  //         repoName: repoName,
  //         appType: AppType.CdApiModule,
  //       },
  //     );

  //   if (!workflowModel) {
  //     return {
  //       state: false,
  //       data: null,
  //       message: `CdModelService::update()/ No valid workflowModel`,
  //     };
  //   }
  //   return await this.svCiCdRunner.run(descriptor, workflowModel);
  // }

  /**
   * This method sets the entities in the database.
   * It processes the provided developer module data for creating database items.
   * @param developerData
   * @returns
   */
  async setEntities(
    developerData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      if (!developerData || developerData.models.length === 0) {
        return {
          data: null,
          state: false,
          message: "No developer data provided.",
        };
      }

      // Process each model item
      for (const model of developerData.models) {
        // Here you would typically save the data to the database
        // For now, we just log it
        console.log("Setting entity:", model);
      }

      return {
        data: null,
        state: true,
        message: "Entities set successfully.",
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Failed to set entities: ${(error as Error).message}`,
      };
    }
  }

  async updateRfcData(q: IQuery): Promise<CdFxReturn<ICdResponse | null>> {
    this.logger.logDebug("Starting CdModelService::updateRfcData()");
    try {
      const svServer = new HttpService();
      this.setEnvelope("UpdateRfcData", { query: q });
      console.log(
        "CdModelService::updateRfcData()/this.postData:",
        JSON.stringify(this.postData),
      );
      const ret = await svServer.proc(
        this.setEnvelope("UpdateRfcData", { query: q }),
      );
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `updateRfcData failed: ${(error as Error).message}`,
      };
    }
  }

  setEnvelope(action: string, data: any): ICdRequest {
    this.logger.logDebug("CdAppService::setEnvelope()/starting...");
    // Reset f_vals array to avoid unintended accumulation
    DEFAULT_ENVELOPE.dat.f_vals = [];
    // Update the envelope with new action and data
    DEFAULT_ENVELOPE.a = action;
    DEFAULT_ENVELOPE.dat.f_vals.push(data);
    DEFAULT_ENVELOPE.dat.token = this.cdToken;
    return DEFAULT_ENVELOPE;
  }
}
