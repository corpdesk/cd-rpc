import { Request, Response } from 'express';
import { CdAssertReturn, CdFxReturn, IQuery } from '../../../sys/base/i-base';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { CdModuleService } from '../services/cd-module.service';
import { TestBedService } from '../services/test-bed.service';
import { ICdExecutionContext } from '../../../sys/dev-descriptor/models/runtime-descriptor.model';

export class CdModuleController {
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
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModuleController::create()');
    CdLog.debug('Starting CdModuleService::create()');
    CdLog.debug(`CdModuleController::create()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleController::create()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleController::create()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleController::create()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        CdLog.debug(`CdModuleController::create()/case:workshop`);
        return this.svCdModule.create(cdCtx, actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        CdLog.debug(`CdModuleController::create()/case:test-bed`);
        return this.svTestBed.create(cdCtx, actionTargetName, moduleName, oEnv, repoName);
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
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModuleController::update()');
    CdLog.debug('Starting CdModuleService::update()');
    CdLog.debug(`CdModuleController::update()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleController::update()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleController::update()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleController::update()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        CdLog.debug(`CdModuleController::update()/case:workshop`);
        return this.svCdModule.update(cdCtx, actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        CdLog.debug(`CdModuleController::update()/case:test-bed`);
        return this.svTestBed.update(cdCtx, actionTargetName, moduleName, oEnv, repoName);
    }

    return {
      state: false,
      data: null,
      message: `CdModuleController::update: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  async delete(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModuleController::delete()');
    CdLog.debug('Starting CdModuleService::delete()');
    CdLog.debug(`CdModuleController::delete()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleController::delete()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleController::delete()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleController::delete()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        CdLog.debug(`CdModuleController::delete()/case:workshop`);
        return this.svCdModule.delete(cdCtx, actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        CdLog.debug(`CdModuleController::delete()/case:test-bed`);
        return this.svTestBed.delete(cdCtx, actionTargetName, moduleName, oEnv, repoName);
    }

    return {
      state: false,
      data: null,
      message: `CdModuleController::update: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  async test(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModuleController::test()');
    CdLog.debug('Starting CdModuleService::test()');
    CdLog.debug(`CdModuleController::test()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleController::test()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleController::test()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleController::test()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        CdLog.debug(`CdModuleController::test()/case:workshop`);
        return this.svCdModule.test(cdCtx, actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        CdLog.debug(`CdModuleController::test()/case:test-bed`);
        return this.svTestBed.test(cdCtx, actionTargetName, moduleName, oEnv, repoName);
    }

    return {
      state: false,
      data: null,
      message: `CdModuleController::update: could not route the process to appropriate workflow. Check your configuration`,
    };
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
    CdLog.debug('Starting CdModuleController::upgrade()');
    CdLog.debug('Starting CdModuleService::upgrade()');
    CdLog.debug(`CdModuleController::upgrade()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModuleController::upgrade()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModuleController::upgrade()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModuleController::upgrade()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        CdLog.debug(`CdModuleController::upgrade()/case:workshop`);
        return this.svCdModule.upgrade(
          cdCtx,
          actionTargetName,
          moduleName,
          oEnv,
          repoName,
          version,
          testTasks !== undefined ? String(testTasks) : undefined,
        );
      case 'test-bed':
        CdLog.debug(`CdModuleController::upgrade()/case:test-bed`);
        return this.svTestBed.upgrade(
          cdCtx,
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
