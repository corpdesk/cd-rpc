import { CdAssertReturn, CdFxReturn, IQuery } from '../../../sys/base/i-base.js';
import { Logging } from '../../../sys/base/winston.log.js';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model.js';
// import CdLog from '../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { CdModuleService } from '../services/cd-module.service.js';
import { TestBedService } from '../services/test-bed.service.js';

export class CdModuleController {
  logger!: Logging;
  svCdModule: CdModuleService;
  svTestBed: TestBedService;
  constructor() {
    this.svCdModule = new CdModuleService();
    this.svCdModule.init();
    this.svTestBed = new TestBedService();
    this.svTestBed.init();
  }

  /**
   * Create a new module
   *
   * @param moduleDescriptor
   * @returns
   */
  async create(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug('Starting CdModuleController::create()');
    this.logger.logDebug('Starting CdModuleService::create()');
    this.logger.logDebug(`CdModuleController::create()/actionTargetName: ${actionTargetName}`);
    this.logger.logDebug(`CdModuleController::create()/moduleName: ${moduleName}`);
    this.logger.logDebug(`CdModuleController::create()/oEnv: ${oEnv}`);
    this.logger.logDebug(`CdModuleController::create()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        this.logger.logDebug(`CdModuleController::create()/case:workshop`);
        return this.svCdModule.create(actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        this.logger.logDebug(`CdModuleController::create()/case:test-bed`);
        return this.svTestBed.create(actionTargetName, moduleName, oEnv, repoName);
    }

    return {
      state: false,
      data: null,
      message: `CdModuleController::create: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    return this.svCdModule.read(q);
  }

  async update(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug('Starting CdModuleController::update()');
    this.logger.logDebug('Starting CdModuleService::update()');
    this.logger.logDebug(`CdModuleController::update()/actionTargetName: ${actionTargetName}`);
    this.logger.logDebug(`CdModuleController::update()/moduleName: ${moduleName}`);
    this.logger.logDebug(`CdModuleController::update()/oEnv: ${oEnv}`);
    this.logger.logDebug(`CdModuleController::update()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        this.logger.logDebug(`CdModuleController::update()/case:workshop`);
        return this.svCdModule.update(actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        this.logger.logDebug(`CdModuleController::update()/case:test-bed`);
        return this.svTestBed.update(actionTargetName, moduleName, oEnv, repoName);
    }

    return {
      state: false,
      data: null,
      message: `CdModuleController::update: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  async delete(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug('Starting CdModuleController::delete()');
    this.logger.logDebug('Starting CdModuleService::delete()');
    this.logger.logDebug(`CdModuleController::delete()/actionTargetName: ${actionTargetName}`);
    this.logger.logDebug(`CdModuleController::delete()/moduleName: ${moduleName}`);
    this.logger.logDebug(`CdModuleController::delete()/oEnv: ${oEnv}`);
    this.logger.logDebug(`CdModuleController::delete()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        this.logger.logDebug(`CdModuleController::delete()/case:workshop`);
        return this.svCdModule.delete(actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        this.logger.logDebug(`CdModuleController::delete()/case:test-bed`);
        return this.svTestBed.delete(actionTargetName, moduleName, oEnv, repoName);
    }

    return {
      state: false,
      data: null,
      message: `CdModuleController::update: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  async test(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug('Starting CdModuleController::test()');
    this.logger.logDebug('Starting CdModuleService::test()');
    this.logger.logDebug(`CdModuleController::test()/actionTargetName: ${actionTargetName}`);
    this.logger.logDebug(`CdModuleController::test()/moduleName: ${moduleName}`);
    this.logger.logDebug(`CdModuleController::test()/oEnv: ${oEnv}`);
    this.logger.logDebug(`CdModuleController::test()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        this.logger.logDebug(`CdModuleController::test()/case:workshop`);
        return this.svCdModule.test(actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        this.logger.logDebug(`CdModuleController::test()/case:test-bed`);
        return this.svTestBed.test(actionTargetName, moduleName, oEnv, repoName);
    }

    return {
      state: false,
      data: null,
      message: `CdModuleController::update: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  
  async upgrade(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    version: string,
    testTasks?: boolean,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    this.logger.logDebug('Starting CdModuleController::upgrade()');
    this.logger.logDebug('Starting CdModuleService::upgrade()');
    this.logger.logDebug(`CdModuleController::upgrade()/actionTargetName: ${actionTargetName}`);
    this.logger.logDebug(`CdModuleController::upgrade()/moduleName: ${moduleName}`);
    this.logger.logDebug(`CdModuleController::upgrade()/oEnv: ${oEnv}`);
    this.logger.logDebug(`CdModuleController::upgrade()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        this.logger.logDebug(`CdModuleController::upgrade()/case:workshop`);
        return this.svCdModule.upgrade(
          actionTargetName,
          moduleName,
          oEnv,
          repoName,
          version,
          testTasks !== undefined ? String(testTasks) : undefined,
        );
      case 'test-bed':
        this.logger.logDebug(`CdModuleController::upgrade()/case:test-bed`);
        return this.svTestBed.upgrade(
          actionTargetName,
          moduleName,
          oEnv,
          repoName,
          version,
          testTasks !== undefined ? String(testTasks) : undefined,
        );
    }

    return {
      state: false,
      data: null,
      message: `CdModuleController::upgrade: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  // Get all applications
  async getAllModules(): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    return await this.svCdModule.getAllModules();
  }

  // Get a single module by name
  async getModuleByName(name: string): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    return this.svCdModule.getModuleByName(name);
  }

  async CreateRootFiles(
    moduleDir: string,
    moduleDescriptor: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    return await this.svCdModule.createModuleRootFiles(moduleDir, moduleDescriptor);
  }

  async CreateModuleDirectories(moduleDir: string): Promise<CdFxReturn<null>> {
    return await this.svCdModule.createModuleDirectories(moduleDir);
  }
}
