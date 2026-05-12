// async generateControllerViewEntityFile(
//     moduleData: CdModuleDescriptor,
//     controllerName: string
//   ): Promise<CdFxReturn<null>> {

import { CdFxReturn, IQuery } from '../../../sys/base/i-base.js';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model.js';
// import { DevModeAction, DevModeModel } from '../../../sys/dev-mode/models/dev-mode.model.js';
// import CdLog from '../../../sys/cd-comm/controllers/cd-logger.controller.js';
import { GenEntityService } from '../services/gen-entity.service.js';
import {
  abcdModelDependencies,
  ComponentGenerationConfig,
  MOD_CRAFT_MODEL_TEMPLATE,
} from '../models/default.model.js';
import { getModCraftOutputDir } from '../models/app-craft.model.js';
import { AppType } from '../../../sys/dev-descriptor/index.js';
import { Logging } from '../../../sys/base/winston.log.js';

export class GenEntityController {
  logger!: Logging;
  svGenEntity: GenEntityService;
  constructor() {
    this.svGenEntity = new GenEntityService();
    // this.svGenEntity.init();
  }

  /**
   * Create a new module
   *
   * @param moduleDescriptor
   * @returns
   */

  async GenerateAllEntitiesForCdObj(
    action: any, // DevModeAction | DevModeModel,
    moduleData: CdModuleDescriptor,
    path?: string,
  ): Promise<CdFxReturn<null>> {
    this.logger.logDebug('Starting CdModuleController::GenerateAllEntitiesForCdObj()');
    const config: ComponentGenerationConfig = {
      artifactType: 'models',
      templatePath: MOD_CRAFT_MODEL_TEMPLATE,
      dependencyList: abcdModelDependencies,
      outputPath: getModCraftOutputDir(moduleData.appType || AppType.CdApi),
    };
    return await this.svGenEntity.generateAllEntitiesForCdObj(action, moduleData, config);
  }

  
}
