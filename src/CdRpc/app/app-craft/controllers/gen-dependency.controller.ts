// import { DevModeAction } from '../../../sys/dev-mode/index.js';
import { GenDependencyService } from '../services/gen-dependency.service.js';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/index.js';
import { CdFxReturn } from '../../../sys/base/i-base.js';

export class GenDependencyController {
  svGenDependency = new GenDependencyService();
  constructor() {}

  // 1. Controller (ComponentType.Controller)
  // async GenDependencyForModule(
  //   action: DevModeAction,
  //   moduleData: CdModuleDescriptor,
  // ): Promise<CdFxReturn<null>> {
  //   return this.svGenDependency.genDependencyForModule(
  //     action,
  //     moduleData,
  //   );
  // }  
}
