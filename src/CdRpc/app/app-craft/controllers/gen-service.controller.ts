// async generateControllerViewEntityFile(
//     moduleData: CdModuleDescriptor,
//     controllerName: string
//   ): Promise<CdFxReturn<null>> {

import { CdFxReturn, IQuery } from '../../../sys/base/i-base.js';
// import { GenEntityService } from '../services/cd-module.service.js';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model.js';
import { DevModeAction, DevModeModel } from '../../../sys/dev-mode/models/dev-mode.model.js';
import CdLog from '../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { GenServiceService } from '../services/gen-service.service.js';

export class GenServiceController {
  svGenService: GenServiceService;
  constructor() {
    this.svGenService = new GenServiceService();
  }

  async GenerateAllServices(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
    path: string,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting GenServiceController::GenerateAllServices()');
    return await this.svGenService.generateAllServices(action, moduleData);
  }
}
