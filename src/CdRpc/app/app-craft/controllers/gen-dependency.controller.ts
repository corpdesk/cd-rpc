import { DevModeAction } from '../../../sys/dev-mode/index';
import { GenDependencyService } from '../services/gen-dependency.service';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/index';
import { CdFxReturn } from '../../../sys/base/i-base';

export class GenDependencyController {
  svGenDependency = new GenDependencyService();
  constructor() {}

  // 1. Controller (ComponentType.Controller)
  async GenDependencyForModule(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    return this.svGenDependency.genDependencyForModule(
      action,
      moduleData,
    );
  }  
}
