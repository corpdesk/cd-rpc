import { CdFxReturn } from '../../../sys/base/i-base';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model';
import { DevModeAction } from '../../../sys/dev-mode/models/dev-mode.model';
import { GenControllerService } from '../services/gen-controller.service';
import { BaseService } from '../../../sys/base/base.service';

export class GenControllerController {
  b = new BaseService();
  svGenController: GenControllerService;
  constructor() {
    this.svGenController = new GenControllerService();
  }

  async GenerateAllControllers(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
    path: string,
  ): Promise<CdFxReturn<null>> {
    // this.b.logWithContext(this, `GenerateAllControllers:`, { action, moduleData });
    return await this.svGenController.generateAllControllers(action, moduleData);
  }
}
