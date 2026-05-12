// src/CdCli/app/app-craft/controllers/cd-app.controller.ts
import { CdAssertReturn, CdFxReturn, ICdResponse, IQuery } from '../../../sys/base/i-base.js';
import { CdAppDescriptor } from '../../../sys/dev-descriptor/models/cd-app.model.js';
// import CdLog from '../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { CdAppService } from '../services/cd-app.service.js';
import { CdModuleService } from '../services/cd-module.service.js';
import { Logging } from '../../../sys/base/winston.log.js';

export class CdAppController {
  logger!: Logging;
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
    actionTargetName: string,
    moduleName: string,
    moduleType: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug('Starting CdAppController::create()');
    return this.svCdApp.create(actionTargetName, moduleName, moduleType, cdToken);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdAppDescriptor[] | null>> {
    return this.svCdApp.read(q);
  }

  async update(
    actionTargetName: string,
    moduleName: string,
    moduleType: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    return this.svCdApp.update(actionTargetName, moduleName, moduleType, cdToken);
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
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    version: string,
    testTasks?: boolean,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug('Starting CdAppController::upgrade()');
    return this.svCdApp.upgrade(
      actionTargetName,
      moduleName,
      oEnv,
      repoName,
      version,
      testTasks !== undefined ? String(testTasks) : undefined,
    );
  }

  async derive(
    actionTargetName: string,
    cdObjName: string,
    oEnv: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug('Starting CdAppController::derive()');
    return this.svCdApp.derive(actionTargetName, cdObjName, oEnv, cdToken);
  }

  async scan(
    actionTargetName: string,
    cdObjName: string,
    cdObjTypeName: string,
    cdToken: string,
  ): Promise<CdFxReturn<ICdResponse>> {
    this.logger.logDebug('Starting CdAppController::scan()');
    return this.svCdApp.scan(actionTargetName, cdObjName, cdObjTypeName, cdToken);
  }
}
