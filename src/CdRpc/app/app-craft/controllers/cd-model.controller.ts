import { CdAssertReturn, CdFxReturn, ICdResponse, IQuery } from '../../../sys/base/i-base.js';
import { CdModelService } from '../services/cd-model.service.js';
import { CdModelDescriptor } from '../../../sys/dev-descriptor/models/cd-model-descriptor.model.js';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model.js';
// import CdLog from '../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { TestBedService } from '../services/test-bed.service.js';
import { Logging } from '../../../sys/base/winston.log.js';

export class CdModelController {
  logger!: Logging;
  svCdModel: CdModelService;
  svTestBed: TestBedService;

  constructor() {
    this.logger = new Logging();
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
  // async create(
  //   actionTargetName: string,
  //   moduleName: string,
  //   oEnv: string,
  //   repoName: string,
  // ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
  //   this.logger.logDebug('Starting CdModelController::create()');
  //   this.logger.logDebug('Starting CdModuleService::create()');
  //   this.logger.logDebug(`CdModelController::create()/actionTargetName: ${actionTargetName}`);
  //   this.logger.logDebug(`CdModelController::create()/moduleName: ${moduleName}`);
  //   this.logger.logDebug(`CdModelController::create()/oEnv: ${oEnv}`);
  //   this.logger.logDebug(`CdModelController::create()/repoName: ${repoName}`);
  //   switch (oEnv) {
  //     case 'workshop':
  //       this.logger.logDebug(`CdModelController::create()/case:workshop`);
  //       return this.svCdModel.create(actionTargetName, moduleName, oEnv, repoName);
  //     case 'test-bed':
  //       this.logger.logDebug(`CdModelController::create()/case:test-bed`);
  //       return this.svTestBed.create(actionTargetName, moduleName, oEnv, repoName);
  //   }

  //   return {
  //     state: false,
  //     data: null,
  //     message: `CdModelController::create: could not route the process to appropriate workflow. Check your configuration`,
  //   };
  // }

  // // async createFromSql(
  // //   moduleDescriptor: CdModuleDescriptor,
  // //   pathToSql: string,
  // // ): Promise<CdFxReturn<null>> {
  // //   return this.svCdModel.createFromSql(moduleDescriptor, pathToSql);
  // // }

  // async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
  //   return this.svCdModel.read(q);
  // }

  // async update(
  //   actionTargetName: string,
  //   moduleName: string,
  //   oEnv: string,
  //   repoName: string,
  //   srcPath?: string,
  // ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
  //   this.logger.logDebug('Starting CdModelController::update()');
  //   this.logger.logDebug('Starting CdModuleService::update()');
  //   this.logger.logDebug(`CdModelController::update()/actionTargetName: ${actionTargetName}`);
  //   this.logger.logDebug(`CdModelController::update()/moduleName: ${moduleName}`);
  //   this.logger.logDebug(`CdModelController::update()/oEnv: ${oEnv}`);
  //   this.logger.logDebug(`CdModelController::update()/repoName: ${repoName}`);
  //   this.logger.logDebug(`CdModelController::update()/srcPath: ${srcPath}`);
  //   switch (oEnv) {
  //     case 'workshop':
  //       this.logger.logDebug(`CdModelController::update()/case:workshop`);
  //       return this.svCdModel.update(actionTargetName, moduleName, oEnv, repoName, srcPath);
  //     /**
  //      * ci-cd is an entry point from BaseService.invokeCdRequest() via cli command or ai invocation.
  //      * It is meant to trigger workflows that are not necessarily tied to the current environment (workshop or test-bed)
  //      * but are related to CI/CD processes.
  //      * The routing is done based on the actionTargetName which should be provided in the request.
  //      * This allows for more flexibility in triggering specific workflows that may involve multiple environments or are specific to CI/CD operations.
  //      */
  //     case 'ci-cd':
  //       this.logger.logDebug(`CdModelController::update()/case:workshop`);
  //       return this.svCdModel.update(actionTargetName, moduleName, oEnv, repoName, srcPath);
  //     case 'test-bed':
  //       this.logger.logDebug(`CdModelController::update()/case:test-bed`);
  //       return this.svTestBed.update(actionTargetName, moduleName, oEnv, repoName);
  //     // /**
  //     //  * This case is specifically for handling updates that are triggered from CI/CD processes that are routed to cd-api backend.
  //     //  * It allows for updates to be processed in the workshop environment as part of CI/CD workflows, which may include tasks such as automated testing, deployment, or other operations that are initiated from CI/CD pipelines. The routing is based on the oEnv value being 'ci-cd', which indicates that the request is coming from a CI/CD context and should be handled accordingly.
  //     //  */
  //     // case 'cd-api-route':
  //     //   this.logger.logDebug(`CdModelController::update()/case:cd-api-route`);
  //     //   return this.svCdModel.update(actionTargetName, moduleName, oEnv, repoName, srcPath);
  //   }

  //   return {
  //     state: false,
  //     data: null,
  //     message: `CdModelController::update: could not route the process to appropriate workflow. Check your configuration`,
  //   };
  // }

  // async UpdateRfcData(query: IQuery): Promise<CdFxReturn<ICdResponse | null>> {
  //   this.logger.logDebug(`CdModelController::UpdateRfcData()/query: ${query}`);
  //   return await this.svCdModel.updateRfcData(query);
  // }

  // async delete(
  //   actionTargetName: string,
  //   moduleName: string,
  //   oEnv: string,
  //   repoName: string,
  // ): Promise<CdFxReturn<null | CdAssertReturn[]>> {
  //   this.logger.logDebug('Starting CdModuleController::delete()');
  //   this.logger.logDebug('Starting CdModuleService::delete()');
  //   this.logger.logDebug(`CdModuleController::delete()/actionTargetName: ${actionTargetName}`);
  //   this.logger.logDebug(`CdModuleController::delete()/moduleName: ${moduleName}`);
  //   this.logger.logDebug(`CdModuleController::delete()/oEnv: ${oEnv}`);
  //   this.logger.logDebug(`CdModuleController::delete()/repoName: ${repoName}`);
  //   switch (oEnv) {
  //     case 'workshop':
  //       this.logger.logDebug(`CdModuleController::delete()/case:workshop`);
  //       return this.svCdModel.delete(actionTargetName, moduleName, oEnv, repoName);
  //     case 'test-bed':
  //       this.logger.logDebug(`CdModuleController::delete()/case:test-bed`);
  //       return this.svTestBed.delete(actionTargetName, moduleName, oEnv, repoName);
  //   }

  //   return {
  //     state: false,
  //     data: null,
  //     message: `CdModuleController::update: could not route the process to appropriate workflow. Check your configuration`,
  //   };
  // }
}
