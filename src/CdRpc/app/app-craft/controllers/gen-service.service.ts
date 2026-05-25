import path, { dirname, join, } from 'path';
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
} from '../../../sys/dev-descriptor/index';
import {
  injectTypeBeforeSnakeSuffix,
  injectTypeBeforeSuffix,
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toUniversalSnakeCase,
} from '../../../sys/utils/cd-naming.util';
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
import { CdFxReturn } from '../../../sys/base/i-base';

// Simulate __dirname in ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

/**
 * This method should work for any module type.
 * The output direcoty is set using the following formula
 * `${MOD_CRAFT_WORKSHOP_DIR}/${this.appType}/output`
 */
export class GenServiceService {
  async generateAllServices(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      for (const service of moduleData.services) {
        const servicePascal = toPascalCase(service.name);
        const serviceCamel = toCamelCase(service.name);
        const serviceKebab = toKebabCase(service.name);

        // Load the service template source
        const templatePath = path.join(__dirname, 'templates', 'abcd.service.ts');
        let content = await fs.readFile(templatePath, 'utf-8');

        // Replace placeholders
        content = content
          .replace(/Abcd/g, servicePascal)
          .replace(/abcd/g, serviceCamel)
          .replace(/abcd-kebab/g, serviceKebab);

        // Output file path
        const basePath = `${getModCraftOutputDir(AppType.CdApiModule)}/${moduleData.name}/services`;
        const filePath = path.join(basePath, `${serviceKebab}.service.ts`);

        // Write file safely or overwrite
        if (action === DevModeAction.CREATE) {
          await writePrettyFile(filePath, content);
        } else {
          await writePrettyFileSafely(filePath, content);
        }

        CdLog.debug(`Generated service: ${filePath}`);
      }

      return { state: true, message: 'All services generated successfully', data: null };
    } catch (e: any) {
      return { state: false, message: `Failed to generate services: ${e.message}`, data: null };
    }
  }
}
