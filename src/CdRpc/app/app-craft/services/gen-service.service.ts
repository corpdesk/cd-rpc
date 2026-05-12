import { dirname, join } from 'path';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import {
  AppType,
  CdModuleDescriptor,
  DependencyDescriptor,
} from '../../../sys/dev-descriptor/index.js';
import { toKebabCase } from '../../../sys/utils/cd-naming.util.js';
// import { BaseService, CdFxReturn } from '../../../sys/base/index.js';
// import { dirname, join } from "path";
import { fileURLToPath } from 'url';
// import { DevModeAction } from '../../../sys/dev-mode/index.js';
import {
  abcdServiceDependencies,
  MOD_CRAFT_SERVICES_TEMPLATE,
  ProcessTemplateOptions,
} from '../models/default.model.js';
import { GenComponentService } from './gen-component.service.js';
import { BaseService } from '../../../sys/base/base.service.js';
// import { VersionService } from '../../../sys/dev-descriptor/services/version.service.js';
// import { getModCraftOutputDir } from '../models/app-craft.model.js';

// Simulate __dirname in ESM
// const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * This method should work for any module type.
 * The output direcoty is set using the following formula
 * `${MOD_CRAFT_WORKSHOP_DIR}/${this.appType}/output`
 */
export class GenServiceService {
  b = new BaseService();
  svGenComponent = new GenComponentService();

  // async generateAllServices(action: DevModeAction, moduleData: CdModuleDescriptor) {
  //   this.b.logWithContext(this, 'generateAllServices:start', {
  //     moduleData: moduleData.services[0],
  //   }, 'debug');
  //   return this.svGenComponent.generateArtifactsFromConfig(action, moduleData, {
  //     artifactType: 'services',
  //     templatePath: MOD_CRAFT_SERVICES_TEMPLATE,
  //     dependencyList: abcdServiceDependencies,
  //     outputPath: getModCraftOutputDir(moduleData.appType || AppType.CdApi),
  //   });
  // }
}
