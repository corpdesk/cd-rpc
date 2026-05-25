import { Request, Response } from 'express';
// src/CdCli/app/app-craft/controllers/cd-app.controller.ts
import { CdAssertReturn, CdFxReturn, ICdResponse, IQuery } from '../../../sys/base/i-base';
import { CdAppDescriptor } from '../../../sys/dev-descriptor/models/cd-app.model';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { CdAppService } from '../services/cd-app.service';
import { CdModuleService } from '../services/cd-module.service';
import { ICdExecutionContext } from '../../../sys/dev-descriptor/models/runtime-descriptor.model';

export class CdAppController {
  svCdApp: CdAppService;
  svCdModule: CdModuleService;
  constructor() {
    this.svCdApp = new CdAppService();
    this.svCdModule = new CdModuleService();
    this.svCdApp.init();
  }

  /**
   * Create a new module
   *
   * @param AppDescriptor
   * @returns
   */
  async create(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    moduleType: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdAppController::create()');
    return this.svCdApp.create(cdCtx, actionTargetName, moduleName, moduleType, cdToken);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdAppDescriptor[] | null>> {
    return this.svCdApp.read(q);
  }

  async update(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    moduleType: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    return this.svCdApp.update(cdCtx, actionTargetName, moduleName, moduleType, cdToken);
  }

  async delete(q: IQuery): Promise<CdFxReturn<null>> {
    return this.svCdApp.delete(q);
  }

  // Get all applications
  async getAllModules(): Promise<CdFxReturn<CdAppDescriptor[] | null>> {
    return await this.svCdApp.getAllModules();
  }

  // Get a single module by name
  async getModuleByName(name: string): Promise<CdFxReturn<CdAppDescriptor[] | null>> {
    return this.svCdApp.getModuleByName(name);
  }

  async CreateModuleDirectories(moduleDir: string): Promise<CdFxReturn<null>> {
    return await this.svCdModule.createModuleDirectories(moduleDir);
  }

  async upgrade(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    version: string,
    testTasks?: boolean,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdAppController::upgrade()');
    return this.svCdApp.upgrade(
      cdCtx,
      actionTargetName,
      moduleName,
      oEnv,
      repoName,
      version,
      testTasks !== undefined ? String(testTasks) : undefined,
    );
  }

  async derive(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    cdObjName: string,
    oEnv: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdAppController::derive()');
    return this.svCdApp.derive(cdCtx, actionTargetName, cdObjName, oEnv, cdToken);
  }

  async scan(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    cdObjName: string,
    cdObjTypeName: string,
    cdToken: string,
  ): Promise<CdFxReturn<ICdResponse>> {
    CdLog.debug('Starting CdAppController::scan()');
    return this.svCdApp.scan(cdCtx, actionTargetName, cdObjName, cdObjTypeName, cdToken);
  }
}
