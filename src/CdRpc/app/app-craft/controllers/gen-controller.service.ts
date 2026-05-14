import { dirname, join } from 'path';
import { writeFile } from 'fs/promises';
import prettier from 'prettier';
import fs from 'fs/promises';
import { homedir } from 'os';
import { upperFirst, camelCase } from 'lodash';
import {
  AppType,
  CdCtx,
  CdModelDescriptor,
  CdModuleDescriptor,
  CdModuleTypeDescriptor,
  FieldDescriptor,
} from '../../../sys/dev-descriptor/index.js';
import {
  injectTypeBeforeSnakeSuffix,
  injectTypeBeforeSuffix,
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toUniversalSnakeCase,
} from '../../../sys/utils/cd-naming.util.js';
import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/index.js';
import {
  writeFileSafely,
  writePrettyFile,
  writePrettyFileSafely,
} from '../../../sys/utils/fs.util.js';
// import { dirname, join } from "path";
import { fileURLToPath } from 'url';
import { getModCraftOutputDir, MOD_CRAFT_WORKSHOP_DIR } from '../models/app-craft.model.js';
import { cdFx } from '../../../sys/base/cd-fx-return.util.js';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { DevModeAction, DevModeModel } from '../../../sys/dev-mode/index.js';
import { inspect } from 'util';
import { CdModuleDescriptorService } from '../../../sys/dev-descriptor/services/cd-module-descriptor.service';

// Simulate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * This method should work for any module type.
 * The output direcoty is set using the following formula
 * `${MOD_CRAFT_WORKSHOP_DIR}/${this.appType}/output`
 */
export class GenControllerService {
  async generateAllControllers(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      for (const controller of moduleData.controllers) {
        const controllerPascal = toPascalCase(controller.name);
        const controllerCamel = toCamelCase(controller.name);
        const controllerKebab = toKebabCase(controller.name);

        // Load the controller template source
        const templatePath = path.join(__dirname, 'templates', 'abcd.controller.ts');
        let content = await fs.readFile(templatePath, 'utf-8');

        // Replace placeholders
        content = content
          .replace(/Abcd/g, controllerPascal)
          .replace(/abcd/g, controllerCamel)
          .replace(/abcd-kebab/g, controllerKebab);

        // Output file path
        const basePath = `${getModCraftOutputDir(AppType.CdApiModule)}/${moduleData.name}/controllers`;
        const filePath = path.join(basePath, `${controllerKebab}.controller.ts`);

        // Write file safely or overwrite
        if (action === DevModeAction.CREATE) {
          await writePrettyFile(filePath, content);
        } else {
          await writePrettyFileSafely(filePath, content);
        }

        CdLog.debug(`Generated controller: ${filePath}`);
      }

      return { state: true, message: 'All controllers generated successfully', data: null };
    } catch (e: any) {
      return { state: false, message: `Failed to generate controllers: ${e.message}`, data: null };
    }
  }
}
