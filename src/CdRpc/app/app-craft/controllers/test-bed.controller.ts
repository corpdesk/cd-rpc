import { Request, Response } from 'express';
import { CdAssertReturn, CdFxReturn, IQuery } from '../../../sys/base/i-base';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { TestBedService } from '../services/test-bed.service';
import { VersionControlDescriptor } from '../../../sys/dev-descriptor/index';
import { GenDbSchemaService } from '../services/gen-db-schema.service';
import { DbMigrationService } from '../services/do-migration.service';
import { ModuleRegisterService } from '../../../sys/moduleman/services/module-register.service';
import { CrudTestService } from '../services/crud-test.service';
import { ICdExecutionContext } from '../../../sys/dev-descriptor/models/runtime-descriptor.model';

export class TestBedController {
  svTestBed: TestBedService;
  svGenDBSchema = new GenDbSchemaService();
  svDbMigration = new DbMigrationService();
  svModuleRegister = new ModuleRegisterService();
  svCrudTest = new CrudTestService();
  constructor() {
    this.svTestBed = new TestBedService();
    this.svTestBed.init();
  }

  /**
   * Create a new module
   *
   * @param moduleDescriptor
   * @returns
   */
  // async create(
  //   d: CdModuleDescriptor,
  //   model: DevModeModel,
  // ): Promise<CdFxReturn<null>> {
  //   CdLog.debug('Starting TestBedController::create()');
  //   return this.svTestBed.create(d, model);
  // }

  // name, type, cdToken
  async create(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting TestBedController::create()');
    return this.svTestBed.create(cdCtx, actionTargetName, moduleName, oEnv, repoName);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    return this.svTestBed.read(q);
  }

  async update(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    moduleType: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    return this.svTestBed.update(cdCtx, actionTargetName, moduleName, moduleType, cdToken);
  }

  async upgrade(
    cdCtx: ICdExecutionContext,
    res: Response,
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    version: string,
    testTasks?: boolean,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting TestBedController::upgrade()');
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

  async delete(
    cdCtx: ICdExecutionContext,
    actionTargetName: string,
    moduleName: string,
    moduleType: string,
    cdToken: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>>{
    CdLog.debug('Starting TestBedController::delete()');
    return this.svTestBed.delete(cdCtx, actionTargetName, moduleName, moduleType, cdToken);
  }

  // Get all applications
  async getAllModules(): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    return await this.svTestBed.getAllModules();
  }

  // Get a single module by name
  async getModuleByName(name: string): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    return this.svTestBed.getModuleByName(name);
  }

  async CreateModuleDirectories(moduleDir: string): Promise<CdFxReturn<null>> {
    return await this.svTestBed.createModuleDirectories(moduleDir);
  }

  async PushFromOutput(
    versionControl: VersionControlDescriptor,
    dirName: string,
  ): Promise<CdFxReturn<null>> {
    return await this.svTestBed.pushFromOutput(versionControl, dirName);
  }

  async CloneToTestBed(versionControl: VersionControlDescriptor): Promise<CdFxReturn<null>> {
    return await this.svTestBed.cloneToTestBed(versionControl);
  }

  async PullToTestBed(versionControl: VersionControlDescriptor): Promise<CdFxReturn<null>> {
    return await this.svTestBed.pullToTestBed(versionControl);
  }

  async AddModuleToEntities(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    return await this.svTestBed.addModuleToEntities(module);
  }

  async SyncDatabaseSchema(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    return await this.svGenDBSchema.syncDbSchema(module);
  }

  async MigrateDatabaseSchema(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    await this.svDbMigration.init();
    return await this.svDbMigration.migrateFromModel(module);
  }

  async RegisterModuleInCdInstance(moduleData: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    return await this.svModuleRegister.registerModuleInCdInstance(moduleData);
  }


  async DeRegisterModuleInCdInstance(moduleData: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    return await this.svModuleRegister.deRegisterModuleFromCdInstance(moduleData);
  }

  async PurgeModuleFromDb(moduleData: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    return await this.svDbMigration.purgeModuleFromDatabase(moduleData);
  }

  async RunCRUDTests(moduleData: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    this.svCrudTest.init();
    return await this.svCrudTest.runAllTests(moduleData);
  }
}
