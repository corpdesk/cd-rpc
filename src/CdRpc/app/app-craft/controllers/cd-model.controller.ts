import { CdAssertReturn, CdFxReturn, ICdResponse, IQuery } from '../../../sys/base/i-base';
import { CdModelService } from '../services/cd-model.service';
import { CdModelDescriptor } from '../../../sys/dev-descriptor/models/cd-model-descriptor.model.js';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model.js';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { TestBedService } from '../services/test-bed.service';

export class CdModelController {
  svCdModel: CdModelService;
  svTestBed: TestBedService;

  constructor() {
    this.svCdModel = new CdModelService();
    this.svTestBed = new TestBedService();
  }

  /**
   * Create a new application
   * CdApi:
   * - setup development environment
   *    - npm
   *    - mysql
   *    - redis
   *    - ssl
   * - migration files
   * - clone corpdesk if not yet done
   * - create repository for new model
   * - sync workstation to repository
   * - sync db data
   *
   * @param modelDescriptor
   * @returns
   */
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
    CdLog.debug('Starting CdModelController::create()');
    CdLog.debug('Starting CdModuleService::create()');
    CdLog.debug(`CdModelController::create()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModelController::create()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModelController::create()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModelController::create()/repoName: ${repoName}`);
    switch (oEnv) {
      case 'workshop':
        CdLog.debug(`CdModelController::create()/case:workshop`);
        return this.svCdModel.create(actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        CdLog.debug(`CdModelController::create()/case:test-bed`);
        return this.svTestBed.create(actionTargetName, moduleName, oEnv, repoName);
    }

    return {
      state: false,
      data: null,
      message: `CdModelController::create: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  // async createFromSql(
  //   moduleDescriptor: CdModuleDescriptor,
  //   pathToSql: string,
  // ): Promise<CdFxReturn<null>> {
  //   return this.svCdModel.createFromSql(moduleDescriptor, pathToSql);
  // }

  async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    return this.svCdModel.read(q);
  }

  async update(
    actionTargetName: string,
    moduleName: string,
    oEnv: string,
    repoName: string,
    srcPath?: string,
  ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
    CdLog.debug('Starting CdModelController::update()');
    CdLog.debug('Starting CdModuleService::update()');
    CdLog.debug(`CdModelController::update()/actionTargetName: ${actionTargetName}`);
    CdLog.debug(`CdModelController::update()/moduleName: ${moduleName}`);
    CdLog.debug(`CdModelController::update()/oEnv: ${oEnv}`);
    CdLog.debug(`CdModelController::update()/repoName: ${repoName}`);
    CdLog.debug(`CdModelController::update()/srcPath: ${srcPath}`);
    switch (oEnv) {
      case 'workshop':
        CdLog.debug(`CdModelController::update()/case:workshop`);
        return this.svCdModel.update(actionTargetName, moduleName, oEnv, repoName, srcPath);
      /**
       * ci-cd is an entry point from BaseService.invokeCdRequest() via cli command or ai invocation.
       * It is meant to trigger workflows that are not necessarily tied to the current environment (workshop or test-bed)
       * but are related to CI/CD processes.
       * The routing is done based on the actionTargetName which should be provided in the request.
       * This allows for more flexibility in triggering specific workflows that may involve multiple environments or are specific to CI/CD operations.
       */
      case 'ci-cd':
        CdLog.debug(`CdModelController::update()/case:workshop`);
        return this.svCdModel.update(actionTargetName, moduleName, oEnv, repoName, srcPath);
      case 'test-bed':
        CdLog.debug(`CdModelController::update()/case:test-bed`);
        return this.svTestBed.update(actionTargetName, moduleName, oEnv, repoName);
      // /**
      //  * This case is specifically for handling updates that are triggered from CI/CD processes that are routed to cd-api backend.
      //  * It allows for updates to be processed in the workshop environment as part of CI/CD workflows, which may include tasks such as automated testing, deployment, or other operations that are initiated from CI/CD pipelines. The routing is based on the oEnv value being 'ci-cd', which indicates that the request is coming from a CI/CD context and should be handled accordingly.
      //  */
      // case 'cd-api-route':
      //   CdLog.debug(`CdModelController::update()/case:cd-api-route`);
      //   return this.svCdModel.update(actionTargetName, moduleName, oEnv, repoName, srcPath);
    }

    return {
      state: false,
      data: null,
      message: `CdModelController::update: could not route the process to appropriate workflow. Check your configuration`,
    };
  }

  async UpdateRfcData(query: IQuery): Promise<CdFxReturn<ICdResponse | null>> {
    CdLog.debug(`CdModelController::UpdateRfcData()/query: ${query}`);
    return await this.svCdModel.updateRfcData(query);
  }

  async delete(
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
        return this.svCdModel.delete(actionTargetName, moduleName, oEnv, repoName);
      case 'test-bed':
        CdLog.debug(`CdModuleController::delete()/case:test-bed`);
        return this.svTestBed.delete(actionTargetName, moduleName, oEnv, repoName);
    }

    return {
      state: false,
      data: null,
      message: `CdModuleController::update: could not route the process to appropriate workflow. Check your configuration`,
    };
  }
}
