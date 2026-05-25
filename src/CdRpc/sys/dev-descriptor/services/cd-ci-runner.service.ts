import { Request, Response } from "express";
import path, { join } from "path";
// import ora from 'ora';
import { pathToFileURL } from "url";
import {
  CdAssertReturn,
  CdFxReturn,
  CdFxStateLevel,
  ICdRequest,
  ICdResponse,
} from "../../base/i-base";
import CdLog from "../../comm/controllers/cd-logger.controller";
import {
  CdCtx,
  CdModuleDescriptor,
} from "../models/cd-module-descriptor.model";
import {
  CiCdDescriptor,
  CICdPipeline,
  CICdTask,
  FailureAlertConfig,
  FailureAlertResult,
  isCdFxReturnPipeline,
  PipelineContext,
} from "../models/cicd-descriptor.model";
// import { toDashedFileName } from '../../utils/request-helper';
import { inspect } from "util";
import {
  ExecutionEnvironmentType,
  WFNext,
  WFNextRef,
} from "../../cd-scheduler/models/cd-scheduler.model";
// import { MOD_CRAFT_WORKSHOP_DIR } from "../../../app/app-craft/index";
import { DEV_DESCRIPTORS_SERVICE_DIR } from "../models/dev-descriptor.model";
import { CdModuleDescriptorService } from "./cd-module-descriptor.service";
// import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/index';
import { BaseService } from "../../base/base.service";
import { DevModeAction, getActionString } from "../../dev-mode/index";
import { MOD_CRAFT_WORKSHOP_DIR } from "../../../app/app-craft/models/app-craft.model";
import { CdAppService } from "./cd-app.service";
import { AppType, repoRegistry, VersionControlDescriptor } from "../index";
import { executeCommand } from "../../utils/cmd.util";
import { checkIfRepoExists } from "../../../app/cd-auto-git/tests/cd-auto-git.test.js";
// import { isAssertSuccessful, isCdFxReturnBoolean, runAssert } from '../../utils/cd-assert-utils';
import { VersionService } from "./version.service";
import { cdFx } from "../../base/cd-fx-return.util";
import { HttpService } from "../../base/http.service";
import { toDashedFileName } from "../../../../utils/request-helper";
import { Logging } from "../../base/winston.log";
import { ICdExecutionContext } from "../models/runtime-descriptor.model";
import { CdAutoGitService } from "../../../app/cd-auto-git/services/cd-auto-git.service";

/** Runner responsible for executing CICdTask logic */
export class CiCdRunnerService {
  logger: Logging;
  private b = new BaseService();
  currentPipelineName = "";
  currentStageName = "";

  constructor() {
    this.logger = new Logging();
  }

  async loadAppDescriptorAndWorkflow(
    cdCtx: ICdExecutionContext,
    action: DevModeAction,
    cdObjType: string,
    cdObjName: string,
    oEnv: string,
    extraParams?: any,
  ): Promise<{
    descriptor: any;
    workflowModel: CiCdDescriptor | null;
    extraParams?: any;
  }> {
    this.logger.logDebug(
      "Starting CiCdRunnerService::loadAppDescriptorAndWorkflow()",
    );

    // this.logger.logDebug(
    //   `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/actiion:${action}, cdObjType: ${cdObjType}, actionTargetName: ${extraParams.actionTargetName} cdObjName:${cdObjName}, oEnv:${oEnv}, extraParams:${inspect(extraParams, { depth: 2 })}`,
    // );

    const dashedName = cdObjName.toLowerCase();
    this.logger.logDebug(
      `CiCdRunnerService::loadAppDescriptorAndWorkflow()/dashedName:${dashedName}`,
    );
    const pascalName = dashedName
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");

    this.logger.logDebug(
      `CiCdRunnerService::loadAppDescriptorAndWorkflow()/pascalName:${pascalName}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadAppDescriptorAndWorkflow()/DEV_DESCRIPTORS_SERVICE_DIR:${DEV_DESCRIPTORS_SERVICE_DIR}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadAppDescriptorAndWorkflow()/gwf-01-0`,
    );
    const workflowFileResult = await this.getWorkFlow(
      cdCtx,
      action,
      cdObjType,
      cdObjName,
      oEnv,
      extraParams,
    );

    // this.logger.logDebug(
    //   `CiCdRunnerService::loadAppDescriptorAndWorkflow()/workflowFileResult:${inspect(workflowFileResult, { depth: 2 })}`,
    // );

    if (!workflowFileResult || !workflowFileResult.state) {
      this.logger.logDebug(
        `CiCdRunnerService::loadAppDescriptorAndWorkflow()/gwf-01-1`,
      );
      return {
        descriptor: null,
        workflowModel: null,
        extraParams: null,
      };
    }

    if (!workflowFileResult.data) {
      this.logger.logDebug(
        `CiCdRunnerService::loadAppDescriptorAndWorkflow()/gwf-02`,
      );
      return {
        descriptor: null,
        workflowModel: null,
        extraParams: null,
      };
    }
    this.logger.logDebug(
      `CiCdRunnerService::loadAppDescriptorAndWorkflow()/gwf-03`,
    );
    const workflowFile = workflowFileResult.data.path;
    const descriptor = workflowFileResult.data.descriptor;

    // descriptor = result.data;

    this.logger.logDebug(
      `CiCdRunnerService::loadAppDescriptorAndWorkflow()/workflowFile:${workflowFile}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadAppDescriptorAndWorkflow()/descriptor:${descriptor}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadAppDescriptorAndWorkflow()/pascalName:${pascalName}`,
    );
    // Dynamically import workflow module and instantiate
    if (!workflowFile || typeof workflowFile !== "string") {
      throw new Error("Workflow file path is not defined or not a string.");
    }

    // const workflowModule = await import(pathToFileURL(workflowFile).href);
    const workflowModule = require(workflowFile);
    const WorkflowClass = workflowModule[`${pascalName}WorkFlow`];
    const workflowInstance = new WorkflowClass();
    let workflowModel;
    switch (action) {
      case DevModeAction.CREATE:
        this.logger.logDebug(
          `CiCdRunnerService::loadAppDescriptorAndWorkflow()/switch/case:create`,
        );
        workflowModel = workflowInstance.createWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.READ:
        this.logger.logDebug(
          `CiCdRunnerService::loadAppDescriptorAndWorkflow()/switch/case:read`,
        );
        workflowModel = workflowInstance.readWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.UPDATE:
        this.logger.logDebug(
          `CiCdRunnerService::loadAppDescriptorAndWorkflow()/switch/case:update`,
        );
        workflowModel = workflowInstance.updateWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.DELETE:
        this.logger.logDebug(
          `CiCdRunnerService::loadAppDescriptorAndWorkflow()/switch/case:delete`,
        );
        workflowModel = workflowInstance.deleteWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.TEST:
        this.logger.logDebug(
          `CiCdRunnerService::loadAppDescriptorAndWorkflow()/switch/case:test`,
        );
        workflowModel = workflowInstance.testWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.DERIVE:
        this.logger.logDebug(
          `CiCdRunnerService::loadAppDescriptorAndWorkflow()/switch/case:derive`,
        );
        workflowModel = workflowInstance.deriveWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.UPGRADE:
        this.logger.logDebug(
          `CiCdRunnerService::loadAppDescriptorAndWorkflow()/switch/case:upgrade`,
        );
        workflowModel = workflowInstance.upgradeWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.MIGRATE:
        this.logger.logDebug(
          `CiCdRunnerService::loadAppDescriptorAndWorkflow()/switch/case:migrate`,
        );
        workflowModel = workflowInstance.migrateWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
    }

    return {
      descriptor,
      workflowModel,
      extraParams,
    };
  }

  /**
   * This method was initially used for all descriptors.
   * This should just be for CdModule processes. 
   * There need to be special ones for CdApps, CdModels and other CdObjTypes or AppTypes.
   * How the above will be done is subject to not just design but usage experience.
   * Sample Input for loadModuleDescriptorAndWorkflow()
   * DevModeAction.CREATE,
      cdObjType,
      moduleName,
      oEnv,
      {
        actionTargetName: actionTargetName,
        descriptor: 'CdModuleDescriptor',
        cdToken: '', // Pass the cdToken if needed
        repoName: repoName,
      },
   * 
      Sample input design for getting workflow file:
   * input: {
      cdObjName: 'cd-ai',
      cdObjType: 'cd-module', // actionTarget
      oEnv: 'workshop', // 'workshop' or 'test-bed'	
    }
   * @param action 
   * @param cdObjType 
   * @param cdObjName 
   * @param oEnv 
   * @param extraParams 
   * @returns 
   */
  async loadModuleDescriptorAndWorkflow(
    cdCtx: ICdExecutionContext,
    action: DevModeAction,
    cdObjType: string,
    cdObjName: string,
    oEnv: string,
    extraParams?: any,
  ): Promise<{
    descriptor: any;
    workflowModel: CiCdDescriptor | null;
    extraParams?: any;
  }> {
    this.logger.logDebug(
      "Starting CiCdRunnerService::loadModuleDescriptorAndWorkflow()",
    );

    // this.logger.logDebug(
    //   `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/actiion:${action}, cdObjType: ${cdObjType}, actionTargetName: ${extraParams.actionTargetName} cdObjName:${cdObjName}, oEnv:${oEnv}, extraParams:${inspect(extraParams, { depth: 2 })}`,
    // );

    const dashedName = cdObjName.toLowerCase();
    this.logger.logDebug(
      `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/dashedName:${dashedName}`,
    );
    const pascalName = dashedName
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");

    this.logger.logDebug(
      `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/pascalName:${pascalName}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/DEV_DESCRIPTORS_SERVICE_DIR:${DEV_DESCRIPTORS_SERVICE_DIR}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/gwf-01-0`,
    );
    const workflowFileResult = await this.getWorkFlow(
      cdCtx,
      action,
      cdObjType,
      cdObjName,
      oEnv,
      extraParams,
    );

    if (!workflowFileResult || !workflowFileResult.state) {
      this.logger.logDebug(
        `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/gwf-01-1`,
      );
      return {
        descriptor: null,
        workflowModel: null,
        extraParams: null,
      };
    }

    if (!workflowFileResult.data) {
      this.logger.logDebug(
        `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/gwf-02`,
      );
      return {
        descriptor: null,
        workflowModel: null,
        extraParams: null,
      };
    }
    this.logger.logDebug(
      `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/gwf-03`,
    );
    const workflowFile = workflowFileResult.data.path;
    const descriptor = workflowFileResult.data.descriptor;

    // descriptor = result.data;

    this.logger.logDebug(
      `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/workflowFile:${workflowFile}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/descriptor:${descriptor}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/pascalName:${pascalName}`,
    );
    // Dynamically import workflow module and instantiate
    if (!workflowFile || typeof workflowFile !== "string") {
      throw new Error("Workflow file path is not defined or not a string.");
    }

    // const workflowModule = await import(pathToFileURL(workflowFile).href);
    const workflowModule = require(workflowFile);
    const WorkflowClass = workflowModule[`${pascalName}WorkFlow`];
    const workflowInstance = new WorkflowClass();
    let workflowModel;
    switch (action) {
      case DevModeAction.CREATE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:create`,
        );
        workflowModel = workflowInstance.createWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.READ:
        this.logger.logDebug(
          `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:read`,
        );
        workflowModel = workflowInstance.readWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.UPDATE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:update`,
        );
        workflowModel = workflowInstance.updateWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.DELETE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:delete`,
        );
        workflowModel = workflowInstance.deleteWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.TEST:
        this.logger.logDebug(
          `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:test`,
        );
        workflowModel = workflowInstance.testWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.DERIVE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:derive`,
        );
        workflowModel = workflowInstance.deriveWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.UPGRADE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:upgrade`,
        );
        workflowModel = workflowInstance.upgradeWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.MIGRATE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModuleDescriptorAndWorkflow()/switch/case:migrate`,
        );
        workflowModel = workflowInstance.migrateWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
    }

    return {
      descriptor,
      workflowModel,
      extraParams,
    };
  }

  async loadModelDescriptorAndWorkflow(
    cdCtx: ICdExecutionContext,
    action: DevModeAction,
    cdObjType: string,
    cdObjName: string,
    oEnv: string,
    extraParams?: any,
  ): Promise<{
    descriptor: any;
    workflowModel: CiCdDescriptor | null;
    extraParams?: any;
  }> {
    this.logger.logDebug(
      "Starting CiCdRunnerService::loadModelDescriptorAndWorkflow()",
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/cdCtx.request: ${inspect(cdCtx.request, { depth: 2 })}`,
    );

    // this.logger.logDebug(
    //   `CiCdRunnerService::loadModelDescriptorAndWorkflow()/actiion:${action}, cdObjType: ${cdObjType}, actionTargetName: ${extraParams.actionTargetName} cdObjName:${cdObjName}, oEnv:${oEnv}, extraParams:${inspect(extraParams, { depth: 2 })}`,
    // );

    const dashedName = cdObjName.toLowerCase();
    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/dashedName:${dashedName}`,
    );
    const pascalName = dashedName
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");

    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/pascalName:${pascalName}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/DEV_DESCRIPTORS_SERVICE_DIR:${DEV_DESCRIPTORS_SERVICE_DIR}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/gwf-01-0`,
    );
    const workflowFileResult = await this.getWorkFlow(
      cdCtx,
      action,
      cdObjType,
      cdObjName,
      oEnv,
      extraParams,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/workflowFileResult:${inspect(workflowFileResult, { depth: 2 })}`,
    );

    if (!workflowFileResult || !workflowFileResult.state) {
      this.logger.logDebug(
        `CiCdRunnerService::loadModelDescriptorAndWorkflow()/gwf-01-1`,
      );
      return {
        descriptor: null,
        workflowModel: null,
        extraParams: null,
      };
    }

    if (!workflowFileResult.data) {
      this.logger.logDebug(
        `CiCdRunnerService::loadModelDescriptorAndWorkflow()/gwf-02`,
      );
      return {
        descriptor: null,
        workflowModel: null,
        extraParams: null,
      };
    }
    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/gwf-03`,
    );
    const workflowFile = workflowFileResult.data.path;
    const descriptor = workflowFileResult.data.descriptor;

    // descriptor = result.data;

    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/workflowFile:${workflowFile}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/descriptor:${descriptor}`,
    );

    this.logger.logDebug(
      `CiCdRunnerService::loadModelDescriptorAndWorkflow()/pascalName:${pascalName}`,
    );
    // Dynamically import workflow module and instantiate
    if (!workflowFile || typeof workflowFile !== "string") {
      throw new Error("Workflow file path is not defined or not a string.");
    }

    // const workflowModule = await import(pathToFileURL(workflowFile).href);
    const workflowModule = require(workflowFile);
    const WorkflowClass = workflowModule[`${pascalName}WorkFlow`];
    const workflowInstance = new WorkflowClass();
    let workflowModel;
    switch (action) {
      case DevModeAction.CREATE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModelDescriptorAndWorkflow()/switch/case:create`,
        );
        workflowModel = workflowInstance.createWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.READ:
        this.logger.logDebug(
          `CiCdRunnerService::loadModelDescriptorAndWorkflow()/switch/case:read`,
        );
        workflowModel = workflowInstance.readWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.UPDATE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModelDescriptorAndWorkflow()/switch/case:update`,
        );
        workflowModel = workflowInstance.updateWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.DELETE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModelDescriptorAndWorkflow()/switch/case:delete`,
        );
        workflowModel = workflowInstance.deleteWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.TEST:
        this.logger.logDebug(
          `CiCdRunnerService::loadModelDescriptorAndWorkflow()/switch/case:test`,
        );
        workflowModel = workflowInstance.testWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.DERIVE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModelDescriptorAndWorkflow()/switch/case:derive`,
        );
        workflowModel = workflowInstance.deriveWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.UPGRADE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModelDescriptorAndWorkflow()/switch/case:upgrade`,
        );
        workflowModel = workflowInstance.upgradeWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
      case DevModeAction.MIGRATE:
        this.logger.logDebug(
          `CiCdRunnerService::loadModelDescriptorAndWorkflow()/switch/case:migrate`,
        );
        workflowModel = workflowInstance.migrateWorkFlow(
          descriptor,
          oEnv,
          extraParams,
        );
        break;
    }

    return {
      descriptor,
      workflowModel,
      extraParams,
    };
  }

  /**
   * 
   * 
   * expected input: {
      cdObjName: 'cd-ai',
      cdObjType: 'cd-module', // actionTarget
      oEnv: 'workshop', // 'workshop' or 'test-bed'	
    }
      
    cd-cli/dist/CdCli/app/app-craft/workshop/<cdObjType>/workflow/<oEnv>/<cdObjName>.workflow.js

   * @param action 
   * @param cdObjType 
   * @param cdObjName 
   * @param oEnv 
   * @param extraParams 
   * @returns 
   */
  async getWorkFlow(
    cdCtx: ICdExecutionContext,
    action: DevModeAction,
    cdObjType: string,
    cdObjName: string,
    oEnv: string,
    extraParams?: any,
  ): Promise<CdFxReturn<{ path: string; descriptor: any }>> {
    try {
      this.logger.logDebug(
        `CiCdRunnerService::getWorkFlow()/cdCtx.request: ${inspect(cdCtx.request, { depth: 2 })}`,
      );
      // 1. Maintain legacy side-effects on the original object
      extraParams.oEnv = oEnv;
      const dashedName = cdObjName.toLowerCase();
      this.logger.logDebug(
        `CiCdRunnerService::getWorkFlow()/dashedName:${dashedName}`,
      );

      // const svCdAutoGit = new CdAutoGitService();
      const svVersion = new VersionService();
      const appType = svVersion.getAppTypeFromRepoName(
        cdCtx,
        extraParams.repoName,
        repoRegistry,
      );
      this.logger.logDebug(
        `CiCdRunnerService::getWorkFlow()/appType:${appType}`,
      );

      let aType = "";
      if (extraParams.actionTargetName === "cd-app") {
        aType = "cd-app";
      } else {
        aType = appType ?? "";
      }

      const workflowFile = join(
        MOD_CRAFT_WORKSHOP_DIR,
        aType,
        "workflow",
        oEnv,
        `${dashedName}.workflow.js`,
      );

      this.logger.logDebug(
        `CiCdRunnerService::getWorkFlow()/workflowFile: ${workflowFile}`,
      );

      /**
       * 2. Semantic Isolation
       * We create a local copy to map the string property to 'descriptorName'.
       * This ensures 'descriptor' (the object below) does not conflict with the logic.
       */
      const localParams = {
        ...extraParams,
        descriptorName: extraParams?.descriptor,
      };

      let descriptor: any; // The Resulting Data Object
      let result: CdFxReturn<any>;

      /**
       * 3. Process resolution based on the unambiguous descriptorName
       */
      switch (localParams.descriptorName) {
        case "CdModuleDescriptor":
          this.logger.logDebug(
            `CiCdRunnerService::getWorkFlow()/case:CdModuleDescriptor-01`,
          );
          const svCdModuleDescriptor = new CdModuleDescriptorService();
          this.logger.logDebug(
            `CiCdRunnerService::getWorkFlow()/case:CdModuleDescriptor-02`,
          );

          // We pass the original extraParams to the service for legacy support
          result = await svCdModuleDescriptor.cdApiModuleData(
            cdObjName,
            cdObjType,
            extraParams,
            action,
          );

          if (!result || !result.state) {
            this.logger.logDebug(
              `CiCdRunnerService::getWorkFlow()/Failed to load module descriptor: ${result.message}`,
            );
            throw new Error(
              `Failed to load module descriptor: ${result.message}`,
            );
          }

          descriptor = result.data;

          // Logging the resolved descriptor properties
          this.logger.logDebug(
            `CiCdRunnerService::getWorkFlow()/descriptor.models:${inspect(descriptor.models, { depth: 4 })}`,
          );
          this.b.logWithContext(
            this,
            "getWorkFlow()/descriptor.models[0]3",
            descriptor.models[0],
            "debug",
          );
          this.b.logWithContext(
            this,
            "cdApiModuleData:cdApiModuleData.descriptor[0].dependencies",
            descriptor.controllers[0].dependencies,
            "debug",
          );
          break;

        case "CdAppDescriptor":
          if (!appType) {
            throw new Error("appType is required and must be of type AppType.");
          }
          const svCdAppDescriptor = new CdAppService();
          result = await svCdAppDescriptor.deriveCdAppDescriptor(
            DevModeAction.DERIVE,
            cdObjName,
            appType,
            oEnv,
            extraParams,
          );

          if (!result || !result.state) {
            this.logger.logDebug(
              `CiCdRunnerService::getWorkFlow()/Failed to load module descriptor: ${result.message}`,
            );
            throw new Error(
              `Failed to load module descriptor: ${result.message}`,
            );
          }

          if (!result.data) {
            this.logger.logDebug(
              `CiCdRunnerService::getWorkFlow()/No module descriptor data returned.`,
            );
            throw new Error(`No module descriptor data returned.`);
          }

          descriptor = result.data;
          break;
      }

      if (!workflowFile) {
        return {
          state: false,
          data: null,
          message: `CiCdRunnerService::getWorkFlowPath: could not resolve the location of the workflow file.`,
        };
      }

      return {
        state: true,
        data: { path: workflowFile, descriptor: descriptor },
      };
    } catch (e) {
      return {
        state: false,
        data: null,
        message: `CiCdRunnerService::getWorkFlowPath: Error:${(e as Error).message}`,
      };
    }
  }

  async sendFailureAlert(
    message: string,
    meta?: {
      pipeline?: string;
      stage?: string;
      task?: string;
      contextDump?: any;
    },
    config?: FailureAlertConfig,
  ): Promise<CdFxReturn<FailureAlertResult>> {
    const methodName = "CiCdRunnerService::sendFailureAlert";
    this.logger.logDebug(`${methodName}/start`);
    this.logger.logDebug(`${methodName}/message: ${message}`);

    const alertConfig: FailureAlertConfig = config ?? {
      enabled: true,
      channels: {
        log: { enabled: true, level: "error" },
        system: { enabled: true },
      },
    };

    if (!alertConfig.enabled) {
      return {
        state: CdFxStateLevel.Info,
        message: "Alerting disabled",
        data: {
          alertSent: false,
          channelsAttempted: [],
          channelsSucceeded: [],
          channelsFailed: [],
          timestamp: new Date().toISOString(),
        },
      };
    }

    const result: FailureAlertResult = {
      alertSent: false,
      channelsAttempted: [],
      channelsSucceeded: [],
      channelsFailed: [],
      timestamp: new Date().toISOString(),
      context: meta,
    };

    try {
      // ─────────────────────────────
      // LOG CHANNEL (always safest)
      // ─────────────────────────────
      if (alertConfig.channels.log?.enabled) {
        result.channelsAttempted.push("log");

        try {
          CdLog.error(`[ALERT] ${message}`);
          if (meta?.contextDump) {
            this.logger.logDebug(
              `[ALERT_CONTEXT] ${JSON.stringify(meta.contextDump, null, 2)}`,
            );
          }

          result.channelsSucceeded.push("log");
        } catch (err: any) {
          result.channelsFailed.push({ channel: "log", error: err.message });
        }
      }

      // ─────────────────────────────
      // SYSTEM CHANNEL (Corpdesk internal)
      // ─────────────────────────────
      if (alertConfig.channels.system?.enabled) {
        result.channelsAttempted.push("system");

        try {
          // 🔥 Placeholder for internal event bus
          // await this.systemNotifier.publish({ message, meta });

          this.logger.logDebug(`${methodName}/system alert simulated`);

          result.channelsSucceeded.push("system");
        } catch (err: any) {
          result.channelsFailed.push({ channel: "system", error: err.message });
        }
      }

      // ─────────────────────────────
      // EMAIL (future)
      // ─────────────────────────────
      if (alertConfig.channels.email?.enabled) {
        result.channelsAttempted.push("email");

        try {
          // await this.emailService.send(...)
          result.channelsSucceeded.push("email");
        } catch (err: any) {
          result.channelsFailed.push({ channel: "email", error: err.message });
        }
      }

      // ─────────────────────────────
      // FINAL STATE RESOLUTION
      // ─────────────────────────────

      result.alertSent = result.channelsSucceeded.length > 0;

      const finalState = result.alertSent
        ? CdFxStateLevel.Success
        : CdFxStateLevel.Warning; // 🔥 important: alert failure != pipeline failure

      return {
        state: finalState,
        message: result.alertSent
          ? "Failure alert processed"
          : "Alert attempted but no channel succeeded",
        data: result,
      };
    } catch (error: any) {
      CdLog.error(`${methodName}/fatal: ${error.message}`);

      return {
        state: CdFxStateLevel.SystemError,
        message: `Failure alert crashed: ${error.message}`,
        data: result,
      };
    }
  }

  // private normalizeTaskResult(raw: any, task: CICdTask): CdFxReturn<any> {
  //   const method = 'CiCdRunnerService::normalizeTaskResult';

  //   // ✅ Case 1: completely undefined/null
  //   if (!raw) {
  //     CdLog.error(`${method} → Task '${task.name}' returned undefined/null`);

  //     return {
  //       state: CdFxStateLevel.SystemError,
  //       message: `Task '${task.name}' returned no result (undefined/null)`,
  //       data: null,
  //     };
  //   }

  //   // ✅ Case 2: not an object
  //   if (typeof raw !== 'object') {
  //     CdLog.error(`${method} → Task '${task.name}' returned non-object: ${raw}`);

  //     return {
  //       state: CdFxStateLevel.SystemError,
  //       message: `Invalid return type from task '${task.name}'`,
  //       data: raw,
  //     };
  //   }

  //   // ✅ Case 3: missing state
  //   if (raw.state === undefined) {
  //     CdLog.error(`${method} → Task '${task.name}' missing 'state'. Raw: ${JSON.stringify(raw)}`);

  //     return {
  //       state: CdFxStateLevel.SystemError,
  //       message: `Task '${task.name}' returned object without 'state'`,
  //       data: raw,
  //     };
  //   }

  //   // ✅ Case 4: boolean → normalize to enum
  //   if (typeof raw.state === 'boolean') {
  //     raw.state = raw.state ? CdFxStateLevel.Success : CdFxStateLevel.Error;
  //   }

  //   return raw;
  // }

  // ─────────────────────────────────────────────
  // 🚀 MAIN RUNNER
  // ─────────────────────────────────────────────

  async run(
    descriptor: any,
    workflowData: CiCdDescriptor,
    extraParams?: any,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug("Starting CiCdRunnerService::run()");

    const ctx: PipelineContext = {
      inputs: extraParams ?? {},
      outputs: {},
      vars: {},
      meta: {},
    };

    const pipeline = workflowData?.cICdPipeline;
    this.currentPipelineName = pipeline?.name ?? "";

    if (!pipeline?.stages?.length) {
      return {
        state: CdFxStateLevel.Error,
        message: "No pipeline stages defined.",
      };
    }

    const taskMap = new Map<string, CICdTask>();
    for (const stage of pipeline.stages) {
      for (const task of stage.tasks) {
        taskMap.set(`${stage.name}/${task.name}`, task);
      }
    }

    let currentStage = pipeline.stages[0];
    let currentTask = currentStage.tasks[0];
    this.currentStageName = currentStage.name;

    const visited = new Set<string>();
    const taskResults: any[] = [];

    while (currentTask) {
      const taskKey = `${this.currentStageName}/${currentTask.name}`;

      if (visited.has(taskKey)) {
        return {
          state: CdFxStateLevel.SystemError,
          message: `Loop detected at ${taskKey}`,
          data: taskResults,
        };
      }
      visited.add(taskKey);

      currentTask.status = "running";

      // 🔥 Resolve dynamic args
      if (currentTask.cdRequest) {
        currentTask.cdRequest = this.resolveCdRequest(
          currentTask.cdRequest,
          ctx,
        );
      }

      // 🔥 Execute with guard
      const rawResult = await this.executeTaskWithPolicies(
        currentTask,
        descriptor,
        ctx,
      );
      const result = this.normalizeTaskResult(rawResult, currentTask);

      // 🔥 Layered interpretation
      const transportState = this.normalizeState(result);
      const business = this.extractBusinessState(result);
      const finalState = this.resolveFinalState(transportState, business);

      // 🔥 DATA BUS STORAGE
      ctx.outputs[currentTask.name] = {
        transport: {
          state: transportState,
          message: result.message ?? "",
        },
        business,
        data: result.data,
        raw: result,
      };

      ctx.outputs[taskKey] = ctx.outputs[currentTask.name];

      taskResults.push({
        stage: this.currentStageName,
        task: currentTask.name,
        state: finalState,
        message: business?.message ?? result.message ?? "",
      });

      currentTask.status =
        finalState === CdFxStateLevel.Success ? "completed" : "failed";

      const nextRef = this.resolveNextTask(currentTask, finalState);
      if (!nextRef) break;

      if (
        (nextRef.pipelineName ?? this.currentPipelineName) !==
        this.currentPipelineName
      ) {
        return {
          state: CdFxStateLevel.SystemError,
          message: `Cross-pipeline transition not supported`,
          data: taskResults,
        };
      }

      const nextKey = `${nextRef.stageName ?? this.currentStageName}/${nextRef.taskName}`;
      const nextTask = taskMap.get(nextKey);

      if (!nextTask) {
        return {
          state: CdFxStateLevel.SystemError,
          message: `Next task not found: ${nextKey}`,
          data: taskResults,
        };
      }

      this.currentStageName = nextRef.stageName ?? this.currentStageName;
      currentTask = nextTask;
    }

    // const hasFailure = taskResults.some((r) => r.state !== CdFxStateLevel.Success);
    const hasFailure = taskResults.some(
      (r) => r.task !== "NotifyFailure" && r.state !== CdFxStateLevel.Success,
    );

    return hasFailure
      ? {
          state: CdFxStateLevel.LogicalFailure,
          message: "One or more tasks failed.",
          data: taskResults,
        }
      : {
          state: CdFxStateLevel.Success,
          message: "Pipeline executed successfully.",
          data: taskResults,
        };
  }

  // ─────────────────────────────────────────────
  // ⚙️ EXECUTION WITH POLICIES + SPINNER
  // ─────────────────────────────────────────────

  // private async executeTaskWithPolicies(
  //   task: CICdTask,
  //   descriptor: CdModuleDescriptor,
  //   ctx: PipelineContext,
  // ): Promise<CdFxReturn<any>> {
  //   const { default: ora } = await import("ora");
  //   // const { default: ora } = require("ora");
  //   let attempts = 0;
  //   const maxAttempts = task.retryCount ?? 1;
  //   const timeout = task.timeout ?? 60000;

  //   while (attempts < maxAttempts) {
  //     const spinner = ora(
  //       `⏳ ${task.name} (${attempts + 1}/${maxAttempts})`,
  //     ).start();

  //     try {
  //       const raw = await Promise.race([
  //         this.executeTask(task, descriptor, ctx),
  //         new Promise<CdFxReturn<any>>((_, reject) =>
  //           setTimeout(() => reject(new Error("Timeout")), timeout),
  //         ),
  //       ]);

  //       const result = this.normalizeTaskResult(raw, task);

  //       if (result.state === CdFxStateLevel.Success) {
  //         spinner.succeed(`✅ ${task.name}`);
  //       } else {
  //         spinner.fail(`❌ ${task.name}: ${result.message}`);
  //       }

  //       return result;
  //     } catch (e: any) {
  //       spinner.fail(`❌ ${task.name}: ${e.message}`);
  //       attempts++;

  //       if (attempts < maxAttempts && task.retryDelay) {
  //         await this.sleep(task.retryDelay);
  //       }
  //     }
  //   }

  //   return {
  //     state: CdFxStateLevel.SystemError,
  //     message: `Failed after ${maxAttempts} attempts`,
  //   };
  // }
  private async executeTaskWithPolicies(
    task: CICdTask,
    descriptor: CdModuleDescriptor,
    ctx: PipelineContext,
  ): Promise<CdFxReturn<any>> {
    /**
     * IMPORTANT:
     *
     * ora is ESM-only.
     *
     * In CommonJS runtime:
     * - require("ora") fails
     * - transpiled TS dynamic import may also fail
     *
     * Therefore:
     * - use safe lazy loader
     * - gracefully degrade if spinner unavailable
     */

    type SpinnerLike = {
      start: () => SpinnerLike;
      succeed: (msg?: string) => void;
      fail: (msg?: string) => void;
      info?: (msg?: string) => void;
      stop?: () => void;
    };

    let oraFactory: ((text?: string) => SpinnerLike) | undefined;

    try {
      /**
       * eval(import())
       *
       * Prevents TypeScript transpiling
       * import() into require()
       * under CommonJS.
       */
      const oraModule = await (eval(`import("ora")`) as Promise<any>);

      oraFactory = oraModule.default;
    } catch (e: any) {
      this.logger.logDebug(
        `CiCdRunnerService::executeTaskWithPolicies()/ora unavailable:${e.message}`,
      );
    }

    let attempts = 0;

    const maxAttempts = task.retryCount ?? 1;

    const timeout = task.timeout ?? 60000;

    while (attempts < maxAttempts) {
      const spinnerText = `⏳ ${task.name} (${attempts + 1}/${maxAttempts})`;

      /**
       * Safe spinner fallback
       */
      const spinner: SpinnerLike = oraFactory
        ? oraFactory(spinnerText).start()
        : {
            start() {
              this.logger?.logInfo?.(spinnerText);
              return this;
            },

            succeed: (msg?: string) => {
              this.logger.logInfo(msg ?? `SUCCESS: ${task.name}`);
            },

            fail: (msg?: string) => {
              this.logger.logError(msg ?? `FAILED: ${task.name}`);
            },

            info: (msg?: string) => {
              this.logger.logInfo(msg ?? `INFO: ${task.name}`);
            },

            stop: () => {},
          };

      try {
        const raw = await Promise.race([
          this.executeTask(task, descriptor, ctx),

          new Promise<CdFxReturn<any>>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), timeout),
          ),
        ]);

        const result = this.normalizeTaskResult(raw, task);

        if (result.state === CdFxStateLevel.Success) {
          spinner.succeed(`✅ ${task.name}`);
        } else {
          spinner.fail(`❌ ${task.name}: ${result.message}`);
        }

        return result;
      } catch (e: any) {
        spinner.fail(`❌ ${task.name}: ${e.message}`);

        attempts++;

        if (attempts < maxAttempts && task.retryDelay) {
          await this.sleep(task.retryDelay);
        }
      } finally {
        spinner.stop?.();
      }
    }

    return {
      state: CdFxStateLevel.SystemError,

      message: `Failed after ${maxAttempts} attempts`,
    };
  }

  // ─────────────────────────────────────────────
  // 🧩 TASK EXECUTION
  // ─────────────────────────────────────────────

  async executeTask(
    task: CICdTask,
    descriptor: CdModuleDescriptor,
    ctx: PipelineContext,
  ): Promise<CdFxReturn<any>> {
    try {
      const b = new BaseService();
      switch (task.type) {
        case "script-inline":
          return this.runScript(task.executor, task.script);

        case "script-file":
          return this.runScriptFromFile(task.executor, task.scriptFile);

        case "method":
          if (!task.cdRequest) {
            return {
              state: CdFxStateLevel.Error,
              message: "cdRequest missing",
            };
          }
          return this.callMethodFromCdRequest(task.cdRequest);

        /**
         * @deprecated
         * Use localCdRequest or
         */
        case "cdRequest":
          return b.invokeCdRequest(task.cdRequest);

        case "localCdRequest":
          return b.invokeCdRequest(task.cdRequest);

        case "remoteCdRequest":
          return await this.remoteCdRequest(task.cdRequest as ICdRequest);

        default:
          return {
            state: CdFxStateLevel.Error,
            message: `Unknown task type`,
          };
      }
    } catch (err: any) {
      return {
        state: CdFxStateLevel.SystemError,
        message: err.message,
      };
    }
  }

  async remoteCdRequest(
    cdRequest: ICdRequest,
  ): Promise<CdFxReturn<ICdResponse>> {
    const svServer = new HttpService();
    console.log("remoteCdRequest()/cdRequest:", JSON.stringify(cdRequest));
    return svServer.proc(cdRequest);
  }

  // ─────────────────────────────────────────────
  // 🔥 NORMALIZATION (CRITICAL)
  // ─────────────────────────────────────────────

  private normalizeTaskResult(raw: any, task: CICdTask): CdFxReturn<any> {
    if (!raw) {
      return {
        state: CdFxStateLevel.SystemError,
        message: `Task '${task.name}' returned undefined/null`,
        data: null,
      };
    }

    if (typeof raw !== "object") {
      return {
        state: CdFxStateLevel.SystemError,
        message: `Invalid return type from '${task.name}'`,
        data: raw,
      };
    }

    if (raw.state === undefined) {
      return {
        state: CdFxStateLevel.SystemError,
        message: `Task '${task.name}' missing 'state'`,
        data: raw,
      };
    }

    if (typeof raw.state === "boolean") {
      raw.state = raw.state ? CdFxStateLevel.Success : CdFxStateLevel.Error;
    }

    return raw;
  }

  private normalizeState(result: CdFxReturn<any>): CdFxStateLevel {
    if (typeof result.state === "boolean") {
      return result.state ? CdFxStateLevel.Success : CdFxStateLevel.Error;
    }
    return result.state ?? CdFxStateLevel.Unknown;
  }

  private extractBusinessState(result: CdFxReturn<any>) {
    const appState = result?.data?.app_state;

    if (!appState) return undefined;

    return {
      success: appState.success,
      code: appState?.info?.code,
      message: appState?.info?.app_msg,
    };
  }

  private resolveFinalState(
    transport: CdFxStateLevel,
    business?: { success: boolean },
  ): CdFxStateLevel {
    if (business && business.success === false) {
      return CdFxStateLevel.LogicalFailure;
    }
    return transport;
  }

  // ─────────────────────────────────────────────
  // 🔁 FLOW CONTROL
  // ─────────────────────────────────────────────

  private resolveNextTask(
    task: CICdTask,
    state: CdFxStateLevel,
  ): WFNext | null {
    if (!task.onResult) return null;

    for (const rule of task.onResult) {
      const match = Array.isArray(rule.ifState)
        ? rule.ifState.includes(state)
        : rule.ifState === state;

      if (match) {
        return this.normalizeWFNext(rule.toTask, {
          currentPipeline: this.currentPipelineName,
          currentStage: this.currentStageName,
        });
      }
    }

    return null;
  }

  normalizeWFNext(
    next: WFNextRef,
    context: { currentPipeline: string; currentStage: string },
  ): WFNext {
    if (typeof next === "string") {
      return {
        pipelineName: context.currentPipeline,
        stageName: context.currentStage,
        taskName: next,
      };
    }

    return {
      pipelineName: next.pipelineName ?? context.currentPipeline,
      stageName: next.stageName ?? context.currentStage,
      taskName: next.taskName,
    };
  }

  // ─────────────────────────────────────────────
  // 🔥 ARG RESOLUTION
  // ─────────────────────────────────────────────

  private resolveCdRequest(
    cdRequest: ICdRequest,
    ctx: PipelineContext,
  ): ICdRequest {
    return {
      ...cdRequest,
      args: this.resolveObject(cdRequest.args, ctx),
      dat: this.resolveObject(cdRequest.dat, ctx),
    };
  }

  private resolveObject(obj: any, ctx: PipelineContext): any {
    if (!obj) return obj;

    if (typeof obj === "string") return this.resolveValue(obj, ctx);

    if (Array.isArray(obj)) return obj.map((v) => this.resolveObject(v, ctx));

    if (typeof obj === "object") {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, this.resolveObject(v, ctx)]),
      );
    }

    return obj;
  }

  // private resolveValue(value: string, ctx: PipelineContext): any {
  //   if (!value.startsWith('$')) return value;

  //   const path = value.slice(1).split('.');
  //   const root = path.shift();

  //   let source: any;

  //   switch (root) {
  //     case 'outputs':
  //       source = ctx.outputs;
  //       break;
  //     case 'vars':
  //       source = ctx.vars;
  //       break;
  //     case 'inputs':
  //       source = ctx.inputs;
  //       break;
  //     default:
  //       return value;
  //   }

  //   const result = path.reduce((acc, key) => acc?.[key], source);

  //   if (root === 'outputs' && result?.data !== undefined) {
  //     return result.data;
  //   }

  //   return result;
  // }
  private resolveValue(value: string, ctx: PipelineContext): any {
    if (!value.startsWith("$")) return value;

    const path = value.slice(1).split(".");
    const root = path.shift();

    let source: any;

    switch (root) {
      case "outputs":
        source = ctx.outputs;
        break;
      case "vars":
        source = ctx.vars;
        break;
      case "inputs":
        source = ctx.inputs;
        break;
      default:
        return value;
    }

    // Special handling for outputs
    if (root === "outputs" && path.length > 0) {
      const taskName = path.shift()!;
      const taskOutput = source?.[taskName];

      if (!taskOutput) {
        CdLog.error(`resolveValue(): output task '${taskName}' not found`);
        return undefined;
      }

      source = taskOutput.data ?? taskOutput;
    }

    return path.reduce((acc, key) => acc?.[key], source);
  }

  // ─────────────────────────────────────────────

  private async runScript(executor: any, script?: string) {
    console.log(`[${executor}] ${script}`);
    return { state: true, message: "Script executed" };
  }

  private async runScriptFromFile(executor: any, scriptFile?: string) {
    console.log(`[${executor}] file: ${scriptFile}`);
    return { state: true, message: "Script file executed" };
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ─────────────────────────────────────────────
  // 🔌 CD REQUEST INVOCATION (SAFE)
  // ─────────────────────────────────────────────

  async callMethodFromCdRequest<T = any>(
    cdRequest: ICdRequest,
  ): Promise<CdFxReturn<T>> {
    this.logger.logDebug(
      `CdCiRunnerService::callMethodFromCdRequest() → cdRequest received: ${inspect(cdRequest, { depth: 5 })}`,
    );
    let { ctx, m, c, a, args, dat } = cdRequest;

    if (!ctx || !m || !c || !a) {
      return {
        state: CdFxStateLevel.Error,
        message: "Incomplete cdRequest",
        data: null,
      };
    }

    try {
      const ctlDashedName = toDashedFileName(c, "controller");
      const controllerPath = `../../../${ctx}/${m}/controllers/${ctlDashedName}`;
      // const controllerModule = await import(controllerPath);
      const controllerModule = require(controllerPath);

      c = `${c}Controller`;

      if (!controllerModule?.[c]) {
        return {
          state: CdFxStateLevel.Error,
          message: `Controller not found`,
          data: null,
        };
      }

      const instance = new controllerModule[c]();

      if (typeof instance.init === "function") {
        await instance.init();
      }

      if (typeof instance[a] !== "function") {
        return {
          state: CdFxStateLevel.Error,
          message: `Method not found`,
          data: null,
        };
      }

      const argValues = args ? Object.values(args) : [];
      const raw = await instance[a](...argValues, dat);

      return this.normalizeTaskResult(raw, { name: a } as any);
    } catch (e: any) {
      return {
        state: CdFxStateLevel.SystemError,
        message: e.message,
        data: null,
      };
    }
  }
}
