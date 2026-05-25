// async generateControllerViewEntityFile(
//     moduleData: CdModuleDescriptor,
//     controllerName: string
//   ): Promise<CdFxReturn<null>> {

import { CdFxReturn, IQuery } from '../../../sys/base/i-base';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model';
import { DevModeAction, DevModeModel } from '../../../sys/dev-mode/models/dev-mode.model';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { GenEntityService } from '../services/gen-entity.service';
import {
  abcdModelDependencies,
  ComponentGenerationConfig,
  MOD_CRAFT_MODEL_TEMPLATE,
} from '../models/default.model';
import { getModCraftOutputDir } from '../models/app-craft.model';
import { AppType } from '../../../sys/dev-descriptor/index';

export class GenEntityController {
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
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
    path?: string,
  ): Promise<CdFxReturn<null>> {
    CdLog.debug('Starting CdModuleController::GenerateAllEntitiesForCdObj()');
    const config: ComponentGenerationConfig = {
      artifactType: 'models',
      templatePath: MOD_CRAFT_MODEL_TEMPLATE,
      dependencyList: abcdModelDependencies,
      outputPath: getModCraftOutputDir(moduleData.appType || AppType.CdApi),
    };
    return await this.svGenEntity.generateAllEntitiesForCdObj(action, moduleData, config);
  }

  
}
