import { dirname, join } from 'path';
import { writeFile } from 'fs/promises';
import prettier from 'prettier';
import fs from 'fs/promises';
import fsSync from 'fs';
import { homedir } from 'os';
import { upperFirst, camelCase } from 'lodash';
import {
  AppType,
  CdCtx,
  CdModelDescriptor,
  CdModuleDescriptor,
  CdModuleTypeDescriptor,
  DependencyDescriptor,
  FieldDescriptor,
} from '../../../sys/dev-descriptor/index';
import {
  injectTypeBeforeSnakeSuffix,
  injectTypeBeforeSuffix,
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toUniversalSnakeCase,
} from '../../../sys/utils/cd-naming.util';
import { CdFxReturn } from '../../../sys/base/i-base';
import {
  writeFileSafely,
  writePrettyFile,
  writePrettyFileSafely,
} from '../../../sys/utils/fs.util';
// import { dirname, join } from "path";
import { fileURLToPath } from 'url';
import { getModCraftOutputDir, MOD_CRAFT_WORKSHOP_DIR } from '../models/app-craft.model';
import { cdFx } from '../../../sys/base/cd-fx-return.util';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { DevModeAction, DevModeModel } from '../../../sys/dev-mode/index';
import { inspect } from 'util';
import { CdModuleDescriptorService } from '../../../sys/dev-descriptor/services/cd-module-descriptor.service';
import {
  abcdControllerDependencies,
  MOD_CRAFT_CONTROLLERS_TEMPLATE,
  MOD_CRAFT_SERVICES_TEMPLATE,
  ProcessTemplateOptions,
} from '../models/default.model';

// import fs from 'fs';
import path from 'path';
import { GenComponentService } from './gen-component.service';
import { VersionService } from '../../../sys/dev-descriptor/services/version.service';
import { BaseService } from '../../../sys/base/base.service';

// Simulate __dirname in ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

/**
 * This method should work for any module type.
 * The output direcoty is set using the following formula
 * `${MOD_CRAFT_WORKSHOP_DIR}/${this.appType}/output`
 */
export class GenControllerService {
  b = new BaseService();
  svGenComponent = new GenComponentService();

  /**
   * 
   * artifactType: 'controllers' | 'services' | 'models';
  templatePath: string;
  dependencyList: DependencyDescriptor[];
  outputPath: string;
   * @param action 
   * @param moduleData 
   * @returns 
   */
  async generateAllControllers(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    this.b.logWithContext(
      this,
      'generateAllControllers:start',
      {
        action,
        moduleData: moduleData.controllers[0],
      },
      'debug',
    );

    return this.svGenComponent.generateArtifactsFromConfig(
      action, 
      moduleData, 
      {
      artifactType: 'controllers',
      templatePath: MOD_CRAFT_CONTROLLERS_TEMPLATE,
      dependencyList: abcdControllerDependencies,
      outputPath: getModCraftOutputDir(moduleData.appType || AppType.CdApi),
    });
  }
}
