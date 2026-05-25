import { dirname, join } from 'path';
import { writeFile } from 'fs/promises';
import prettier /*{ util }*/ from 'prettier';
import fs from 'fs/promises';
import { homedir } from 'os';
import { upperFirst, camelCase } from 'lodash';
import {
  AppType,
  CdControllerDescriptor,
  CdCtx,
  CdModelDescriptor,
  CdModuleDescriptor,
  CdModuleTypeDescriptor,
  CdServiceDescriptor,
  FieldDescriptor,
  getExtensionByLangProfile,
  getLanguageByName,
  LanguageName,
  languages,
} from '../../../sys/dev-descriptor/index';
import {
  injectTypeBeforeSnakeSuffix,
  injectTypeBeforeSuffix,
  isVisitorField,
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
import { getModCraftOutputDir } from '../models/app-craft.model';
import { cdFx } from '../../../sys/base/cd-fx-return.util';
import CdLog from '../../../sys/comm/controllers/cd-logger.controller';
import { DevModeAction } from '../../../sys/dev-mode/index';
import {
  abcdModelDependencies,
  ComponentGenerationConfig,
  MOD_CRAFT_MODEL_TEMPLATE,
} from '../models/default.model';
import { GenComponentService } from './gen-component.service';
import {
  ComponentDescriptor,
  ComponentType,
} from '../../../sys/dev-descriptor/models/component-descriptor.model';
import util from 'util';
import { exec } from 'child_process';
// import { ModuleRegisterService } from './module-register.service';
import { SessonController } from '../../../sys/user/controllers/session.controller';
import { CdCliProfileController } from '../../../sys/cd-cli/index';
import config from '../../../../config';
import { BaseService } from '../../../sys/base/base.service';
import { HttpService } from '../../../sys/base/http.service';
import { CdFxReturn, CdFxStateLevel, ICdRequest } from '../../../sys/base/i-base';
import { CdRequest } from '../../../sys/utils/request';

// Simulate __dirname in ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // const __filename = fileURLToPath(import.meta.url);

const execPromise = util.promisify(exec);

/**
 * This method should work for any module type.
 * The output direcoty is set using the following formula
 * `${MOD_CRAFT_WORKSHOP_DIR}/${this.appType}/output`
 */
export class GenEntityService {
  b = new BaseService();
  http = new HttpService();
  cdToken = '';

  constructor() {}

  async init() {
    const ctlSession = new SessonController();
    const ctlCdCliProfile = new CdCliProfileController();
    const profileRet = await ctlCdCliProfile.loadProfiles();
    if (!profileRet.state) {
      // CdLog.error(`Failed to load profiles: ${profileRet.message}`);
      return null; // Handle the failure case properly
    }

    const r = await ctlSession.getSession(config.cdApiLocal);
    if (r && r.cd_token) {
      this.cdToken = r.cd_token;
      CdLog.info(`GenEntityService: this.cdToken:${this.cdToken}`);
      CdLog.info('cdToken has been set');
    } else {
      CdLog.error('There is a problem setting cdToken');
    }
  }

  async generateControllerEntityFile(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
    controllerName: string,
    config: ComponentGenerationConfig,
    component: ComponentDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      this.b.logWithContext(
        this,
        `generateControllerEntityFile:start`,
        { controllerName },
        'debug',
      );
      const controllerKebab = toKebabCase(controllerName); // e.g., coop-member
      const controllerPascal = toPascalCase(controllerName); // e.g., CoopMember
      const controllerSnake = toUniversalSnakeCase(controllerName); // e.g., coop_member

      const extensionResult = getExtensionByLangProfile(
        LanguageName.TypeScript,
        languages,
        'tsSource',
      );
      if (extensionResult.state === false) {
        return {
          state: false,
          message: `Failed to get extension for TypeScript: ${extensionResult.message}`,
          data: null,
        };
      }
      config.language = getLanguageByName(LanguageName.TypeScript, languages);

      if (!config.extension) {
        config.extension = extensionResult.data || '.ts';
        this.b.logWithContext(
          this,
          'generateControllerEntityFile:extension-set',
          { extension: config.extension },
          'debug',
        );
      }

      const model = moduleData.models.find((m) => m.name === controllerKebab);
      if (!model) {
        return {
          state: false,
          message: `Model for controller '${controllerName}' not found.`,
          data: null,
        };
      }

      const fileName = model.fileName || `${toKebabCase(controllerName)}.model.${config.extension}`;
      const tableName = model.tableName || controllerSnake;
      const className = `${controllerPascal}Model`;

      // version 2
      const modelFields = model.fields.map((field: FieldDescriptor) => {
        const dbColumn = field.dbName || toUniversalSnakeCase(field.name);
        const defaultVal = field.defaultValue
          ? `,\n    default: ${JSON.stringify(field.defaultValue)}`
          : '';
        const nullable = !field.required ? ',\n    nullable: true' : '';

        const isPrimaryField = field.name === `${toCamelCase(toKebabCase(controllerPascal))}Id`;

        const columnDecorator = isPrimaryField
          ? `@PrimaryGeneratedColumn({\n    name: "${dbColumn}"\n  })`
          : `@Column({\n    name: "${dbColumn}"${nullable}${defaultVal}\n  })`;

        // ✅ Only one of `!` or `?` now
        const tsSuffix = field.required ? '!' : '?';

        return `  ${columnDecorator}\n  ${field.name}${tsSuffix}: ${field.type};`;
      });

      const content = `import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
    import { v4 as uuidv4 } from 'uuid';

    @Entity({
      name: "${tableName}",
      synchronize: false,
    })
    export class ${className} {
    ${modelFields.join('\n\n')}
    }
    `;

      const basePath = `${getModCraftOutputDir(AppType.CdApiModule)}/${moduleData.name}/models`;
      const outputFileName = config.componentDescriptor?.fileName;
      const svGenComponent = new GenComponentService();
      const pathResult = await svGenComponent.resolveOutputFilePath(
        config,
        moduleData,
        outputFileName,
        component,
      );

      this.b.logWithContext(
        this,
        `generateControllerEntityFile:pathResult1:`,
        { pathResult },
        'debug',
      );
      this.b.logWithContext(this, `generateControllerEntityFile:content1:`, { content }, 'debug');
      if (!pathResult || !pathResult.data) {
        return {
          state: CdFxStateLevel.LogicalFailure,
          message: 'Could not resolve the output path',
        };
      }

      const fullPath = pathResult.data;

      // --- BEFORE TREE ---
      const outputDir = getModCraftOutputDir(moduleData.appType || AppType.CdApi);
      try {
        this.b.logWithContext(this, 'writeFile:before-tree', { outputDir }, 'debug');
        const { stdout: beforeTree } = await execPromise(
          `tree -a -I 'node_modules|.git' ${outputDir}`,
        );
        this.b.logWithContext(
          this,
          'writeFile:before-tree',
          { outputDir, tree: beforeTree },
          'debug',
        );
      } catch (treeErr) {
        this.b.logWithContext(this, 'writeFile:before-tree:error', treeErr, 'error');
      }
      // end before tree

      if (action === DevModeAction.CREATE) {
        await writePrettyFile(fullPath, content);
      } else {
        await writePrettyFileSafely(fullPath, content);
      }

      return {
        state: true,
        message: `Entity file generated successfully at ${fullPath}`,
        data: null,
      };
    } catch (e: any) {
      return {
        state: false,
        message: `Failed to generate entity file: ${e.message}`,
        data: null,
      };
    }
  }
  

  async generateControllerTypeEntityFile(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
    controllerName: string,
    config: ComponentGenerationConfig,
    component: ComponentDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      this.b.logWithContext(
        this,
        `generateControllerTypeEntityFile:start`,
        { controllerName },
        'debug',
      );

      const controllerKebab = toKebabCase(controllerName);
      const controllerPascal = toPascalCase(controllerName);
      const controllerSnake = toUniversalSnakeCase(controllerName);
      this.b.logWithContext(
        this,
        `generateControllerTypeEntityFile:controllerSnake`,
        { controllerSnake },
        'debug',
      );

      const extensionResult = getExtensionByLangProfile(
        LanguageName.TypeScript,
        languages,
        'tsSource',
      );
      if (!extensionResult.state) {
        return {
          state: false,
          message: `Failed to get extension for TypeScript: ${extensionResult.message}`,
          data: null,
        };
      }
      config.language = getLanguageByName(LanguageName.TypeScript, languages);

      if (!config.extension) {
        config.extension = extensionResult.data || '.ts';
        this.b.logWithContext(
          this,
          'generateControllerTypeEntityFile:extension-set',
          { extension: config.extension },
          'debug',
        );
      }

      const model = moduleData.models.find((m) => m.name === controllerKebab);
      if (!model) {
        return {
          state: false,
          message: `Type model for controller '${controllerName}' not found.`,
          data: null,
        };
      }

      const typePascal = `${controllerPascal}`;
      const typeSnake = `${controllerSnake}`; // ensure table is *_type
      this.b.logWithContext(
        this,
        `generateControllerTypeEntityFile:typeSnake`,
        { typeSnake },
        'debug',
      );
      const fileName = `${toKebabCase(controllerName)}-type.model.ts`;
      const className = `${typePascal}Model`;

      // ✅ Deduplicate fields by snake name
      const seen = new Set<string>();
      let primaryAssigned = false;

      const modelFields = model.fields
        .map((field: FieldDescriptor) => {
          const fieldSnake = toUniversalSnakeCase(field.name);

          // ✅ Ensure no duplicates
          if (seen.has(fieldSnake)) return null;
          seen.add(fieldSnake);

          // ✅ Special exemption for doc_id
          if (fieldSnake === 'doc_id') {
            return `  @Column({ name: "doc_id" })\n  docId!: number;`;
          }

          // ✅ Visitor field (company_id, coop_id, etc.)
          if (isVisitorField(fieldSnake)) {
            const fieldName = toCamelCase(fieldSnake);
            return `  @Column({ name: "${fieldSnake}" })\n  ${fieldName}!: number;`;
          }

          // ✅ Normal resident field
          const fieldName = injectTypeBeforeSuffix(field.name);
          const dbColumn = injectTypeBeforeSnakeSuffix(fieldSnake);

          const defaultVal = field.defaultValue
            ? `,\n    default: ${JSON.stringify(field.defaultValue)}`
            : '';
          const nullable = !field.required ? ',\n    nullable: true' : '';

          // ✅ Identify primary field
          const isPrimaryField =
            !primaryAssigned &&
            (fieldSnake === `${controllerSnake}_type_id` || fieldSnake.endsWith('_type_id'));

          let columnDecorator: string;
          if (isPrimaryField) {
            primaryAssigned = true;
            columnDecorator = `@PrimaryGeneratedColumn({\n    name: "${dbColumn}"\n  })`;
          } else {
            columnDecorator = `@Column({\n    name: "${dbColumn}"${nullable}${defaultVal}\n  })`;
          }

          const tsSuffix = field.required ? '!' : '?';

          return `  ${columnDecorator}\n  ${fieldName}${tsSuffix}: ${field.type};`;
        })
        .filter(Boolean);

      const content = `import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity({
  name: "${typeSnake}",
  synchronize: false,
})
export class ${className} {
${modelFields.join('\n\n')}
}
`;

      const svGenComponent = new GenComponentService();
      const pathResult = await svGenComponent.resolveOutputFilePath(
        config,
        moduleData,
        config.componentDescriptor?.fileName,
        component,
      );

      if (!pathResult?.data) {
        return {
          state: CdFxStateLevel.LogicalFailure,
          message: 'Could not resolve the output path',
        };
      }

      const fullPath = pathResult.data;
      if (action === DevModeAction.CREATE) {
        await writePrettyFile(fullPath, content);
      } else {
        await writePrettyFileSafely(fullPath, content);
      }

      return {
        state: true,
        message: `Type entity file generated successfully at ${fullPath}`,
        data: null,
      };
    } catch (e: any) {
      return {
        state: false,
        message: `Failed to generate type entity file: ${e.message}`,
        data: null,
      };
    }
  }

  getEnvRegisterModule(moduleName: string): ICdRequest {
    return {
      ctx: 'Sys',
      m: 'Moduleman',
      c: 'Module',
      a: 'Create',
      dat: {
        f_vals: [
          {
            data: {
              moduleName: moduleName,
              isSysModule: false,
            },
            cdObj: {
              cdObjName: moduleName,
              cdObjTypeGuid: '809a6e31-9fb1-4874-b61a-38cf2708a3bb',
              parentModuleGuid: '04060dfa-fc94-4e3a-98bc-9fbd739deb87',
            },
          },
        ],
        token: '3ffd785f-e885-4d37-addf-0e24379af338',
      },
      args: {},
    };
  }

  async generateControllerViewEntityFile(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
    controllerName: string,
    config: ComponentGenerationConfig,
    component: ComponentDescriptor,
  ): Promise<CdFxReturn<null>> {
    try {
      this.b.logWithContext(
        this,
        `generateControllerViewEntityFile:start`,
        { controllerName },
        'debug',
      );

      const baseControllerName = controllerName.replace(/-view$/, '');
      this.b.logWithContext(
        this,
        `generateControllerViewEntityFile:baseControllerName`,
        { baseControllerName },
        'debug',
      );
      const baseKebab = toKebabCase(baseControllerName);
      const basePascal = toPascalCase(baseControllerName);
      const baseCamel = toCamelCase(baseControllerName);
      const baseSnake = toUniversalSnakeCase(baseControllerName);


      const baseControllerTypeName = `${baseControllerName}-type`
      const baseTypeKebab = toKebabCase(baseControllerTypeName);
      const baseTypePascal = toPascalCase(baseControllerTypeName);
      const baseTypeCamel = toCamelCase(baseControllerTypeName);
      const baseTypeSnake = toUniversalSnakeCase(baseControllerTypeName);



      const controllerKebab = toKebabCase(controllerName);
      const controllerPascal = toPascalCase(controllerName);
      const controllerCamel = toCamelCase(controllerName);
      const controllerSnake = toUniversalSnakeCase(controllerName);

      const extensionResult = getExtensionByLangProfile(
        LanguageName.TypeScript,
        languages,
        'tsSource',
      );
      if (extensionResult.state === false) {
        return {
          state: false,
          message: `Failed to get extension for TypeScript: ${extensionResult.message}`,
          data: null,
        };
      }
      config.language = getLanguageByName(LanguageName.TypeScript, languages);

      if (!config.extension) {
        config.extension = extensionResult.data || '.ts';
        this.b.logWithContext(
          this,
          'generateControllerViewEntityFile:extension-set',
          { extension: config.extension },
          'debug',
        );
      }

      const viewModelName = `${controllerPascal}Model`;
      const fileName = `${toKebabCase(controllerName)}.view-model.ts`;
      const viewName = `${controllerSnake}`;

      const typeSnake = `${baseSnake}_type`;
      const typeIdField = `${baseSnake}_type_id`;
      const typeGuidField = `${baseSnake}_type_guid`;

      const content = `import { ViewEntity, ViewColumn } from 'typeorm';
      import { IQuery } from '../../../sys/base/i-base';

      export function siGet(q: IQuery) {
        return {
          serviceModel: ${viewModelName},
          docName: '${controllerPascal}Model::siGet',
          cmd: {
            action: 'find',
            query: q
          },
          dSource: 1
        };
      }

      @ViewEntity({
        name: '${viewName}',
        synchronize: false,
        expression: \`
          SELECT 
            ${baseSnake}.${baseSnake}_id AS ${baseSnake}_id,
            ${baseSnake}.${baseSnake}_guid AS ${baseSnake}_guid,
            ${baseSnake}.${baseSnake}_name AS ${baseSnake}_name,
            ${baseSnake}.${baseSnake}_description AS ${baseSnake}_description,
            ${baseSnake}.doc_id AS docId,
            ${typeSnake}.${typeIdField} AS ${typeIdField},
            ${typeSnake}.${typeGuidField} AS ${typeGuidField}
          FROM
            ${baseSnake}
          JOIN
            ${typeSnake} ON ${typeSnake}.${typeIdField} = ${baseSnake}.${typeIdField}
        \`
      })
      export class ${viewModelName} {
        @ViewColumn({ name: '${baseSnake}_id' })
        ${baseCamel}Id!: number;

        @ViewColumn({ name: '${baseSnake}_guid' })
        ${baseCamel}Guid!: string;

        @ViewColumn({ name: '${baseSnake}_name' })
        ${baseCamel}Name!: string;

        @ViewColumn({ name: '${baseSnake}_description' })
        ${baseCamel}Description!: string;

        @ViewColumn({ name: 'doc_id' })
        docId!: number;

        @ViewColumn({ name: '${typeIdField}' })
        ${toCamelCase(typeIdField)}!: number;

        @ViewColumn({ name: '${typeGuidField}' })
        ${toCamelCase(typeGuidField)}!: string;
      }
      `;

      const basePath = `${getModCraftOutputDir(AppType.CdApiModule)}/${moduleData.name}/models`;
      const outputFileName = config.componentDescriptor?.fileName;
      const svGenComponent = new GenComponentService();
      const pathResult = await svGenComponent.resolveOutputFilePath(
        config,
        moduleData,
        outputFileName,
        component,
      );

      this.b.logWithContext(this, `content3:`, { content }, 'debug');
      if (!pathResult || !pathResult.data) {
        return {
          state: CdFxStateLevel.LogicalFailure,
          message: 'Could not resolve the output path',
        };
      }

      const fullPath = pathResult.data;
      if (action === DevModeAction.CREATE) {
        await writePrettyFile(fullPath, content);
      } else {
        await writePrettyFileSafely(fullPath, content);
      }

      return {
        state: true,
        message: `View model generated successfully at ${fullPath}`,
        data: null,
      };
    } catch (e: any) {
      return {
        state: false,
        message: `Failed to generate view model: ${e.message}`,
        data: null,
      };
    }
  }

  async generateAllEntitiesForCdObj(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
    config: ComponentGenerationConfig,
  ): Promise<CdFxReturn<null>> {
    try {
      CdLog.debug('🛠️ GenEntityService::generateAllEntitiesForCdObj()/01');
      // CdLog.debug(
      //   `🛠️ GenEntityService::generateAllEntitiesForCdObj()/moduleData:${inspect(moduleData, {
      //     depth: 2,
      //   })}`,
      // );
      this.b.logWithContext(
        this,
        `generateAllEntitiesForCdObj:moduleData.models[1]:`,
        moduleData.models[1],
        'debug',
      );
      config = {
        artifactType: 'models',
        templatePath: MOD_CRAFT_MODEL_TEMPLATE,
        dependencyList: abcdModelDependencies,
        outputPath: getModCraftOutputDir(moduleData.appType || AppType.CdApi),
      };

      // Group all component types into one iterable array
      const allComponents = [
        ...(moduleData.controllers || []),
        ...(moduleData.services || []),
        ...(moduleData.models || []),
      ];

      // starting loop for each controller
      // for (const controller of moduleData.controllers) {
      allComponents.forEach(async (artifactTypeDescriptor) => {
        config!.componentDescriptor = artifactTypeDescriptor as
          | CdControllerDescriptor
          | CdServiceDescriptor
          | CdModelDescriptor;
        const controllerName = artifactTypeDescriptor.name as string;

        // CdLog.debug(
        //   `🔧 GenEntityService::GenerateAllEntitiesFoorCdObj()/artifactTypeDescriptor: ${inspect(artifactTypeDescriptor, { depth: 2 })}`,
        // );

        if (artifactTypeDescriptor.type === ComponentType.Model) {
          // start model
          const controllerResult = await this.generateControllerEntityFile(
            action,
            moduleData,
            controllerName,
            config,
            artifactTypeDescriptor,
          );
          CdLog.debug('🛠️ GenEntityService::generateAllEntitiesForCdObj()/02');
          if (!controllerResult.state) return controllerResult;
        }

        if (artifactTypeDescriptor.type === ComponentType.ModelType) {
          // start model-type
          CdLog.debug('🛠️ GenEntityService::generateAllEntitiesForCdObj()/03');
          const typeResult = await this.generateControllerTypeEntityFile(
            action,
            moduleData,
            controllerName,
            config,
            artifactTypeDescriptor,
          );
          CdLog.debug('🛠️ GenEntityService::generateAllEntitiesForCdObj()/04');
          if (!typeResult.state) return typeResult;
        }

        if (artifactTypeDescriptor.type === ComponentType.ModelView) {
          // start model-view
          CdLog.debug('🛠️ GenEntityService::generateAllEntitiesForCdObj()/05');
          const viewResult = await this.generateControllerViewEntityFile(
            action,
            moduleData,
            controllerName,
            config,
            artifactTypeDescriptor,
          );
          if (!viewResult.state) return viewResult;
          CdLog.debug('🛠️ GenEntityService::generateAllEntitiesForCdObj()/06');
        }

        // } // end for loop
      }); // end of forEach loop

      // if(moduleData){
      //   throw new Error(`Process stoped for observation!`);
      // }

      CdLog.debug('🛠️ GenEntityService::generateAllEntitiesForCdObj()/07');
      return cdFx(CdFxStateLevel.Success, 'All controller entities generated successfully.');
    } catch (error: any) {
      CdLog.debug('🛠️ GenEntityService::generateAllEntitiesForCdObj()/08');
      return cdFx(CdFxStateLevel.Error, `Failed during bulk entity generation: ${error.message}`);
    }
  }
}
