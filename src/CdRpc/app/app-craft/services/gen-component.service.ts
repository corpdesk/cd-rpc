import { dirname } from 'path';
import fs from 'fs/promises';
import {
  AppType,
  CdControllerDescriptor,
  CdModelDescriptor,
  CdModuleDescriptor,
  CdServiceDescriptor,
  DependencyDescriptor,
  getExtensionByLangProfile,
  getLanguageByName,
  LanguageName,
  languages,
} from '../../../sys/dev-descriptor/index.js';
import { toPascalCase } from '../../../sys/utils/cd-naming.util.js';
// import { BaseService, CdFxReturn, CdFxStateLevel } from '../../../sys/base/index.js';
// import { writePrettyFile, writePrettyFileSafely } from '../../../sys/utils/fs.util.js';
import { fileURLToPath } from 'url';
// import CdLog from '../../../sys/cd-comm/controllers/cd-logger.controller.js';
// import { DevModeAction } from '../../../sys/dev-mode/index.js';
import { inspect } from 'util';
import { ComponentGenerationConfig, MOD_CRAFT_CD_API_TEMPLATE } from '../models/default.model.js';

// import fs from 'fs';
import path from 'path';
import { DependencyProcessorService } from './dependency-processor.service.js';
import { NamingFilterService } from './naming-filter.service.js';
import { TemplateSnippetService } from './template-snipet.service.js';
import { PreWriteValidatorService } from './pre-write-validator.service.js';
import { exec } from 'child_process';
import util from 'util';
import {
  ComponentDescriptor,
  ComponentType,
  Ext,
  PrimaryComponentType,
  Suffix,
} from '../../../sys/dev-descriptor/models/component-descriptor.model.js';
import { GenControllerImplementationService } from './gen-controller-implementation.service.js';
import { TemplateLoaderService } from './template-loader.service.js';
import { cdFx } from '../../../sys/base/cd-fx-return.util.js';
import { GenServiceImplementationService } from './gen-service-implementation.service.js';
import { BaseService } from '../../../sys/base/base.service.js';
import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/i-base.js';
import { Logging } from '../../../sys/base/winston.log.js';

// Simulate __dirname in ESM
// const __filename = fileURLToPath(import.meta.url);

// const execPromise = util.promisify(exec);

/**
 * This method should work for any module type.
 * The output direcoty is set using the following formula
 * `${MOD_CRAFT_WORKSHOP_DIR}/${this.appType}/output`
 */
export class GenComponentService {
  logger!: Logging;
  b = new BaseService();
  svTemplateLoader = new TemplateLoaderService();
  svGenControllerImplementation = new GenControllerImplementationService();
  svGenServiceImplementation = new GenServiceImplementationService();
  private svDependencyProcessor = new DependencyProcessorService();
  private svNamingFilter = new NamingFilterService();
  private svTemplateSnippet = new TemplateSnippetService();
  private svPreWriteValidator = new PreWriteValidatorService();

  constructor() {
    // no arguments per RFC-0001
  }

  async init(): Promise<CdFxReturn<void>> {
    try {
      this.b.logWithContext(this, 'init-start', {}, 'debug');
      await this.svDependencyProcessor.init?.();
      await this.svNamingFilter.init?.();
      await this.svTemplateSnippet.init?.();
      await this.svPreWriteValidator.init?.();
      this.b.logWithContext(this, 'init-complete', {}, 'debug');
      return { state: true, data: undefined };
    } catch (err) {
      this.b.logWithContext(this, 'init-error', err, 'error');
      return { state: false, data: undefined, message: 'Failed to initialize GenComponentService' };
    }
  }

  /**
   * Orchestration: generate a batch of artifacts (controllers, services, models)
   *  Example:
   * 
   *     action, 
         moduleData, 
         {
         artifactType: 'controllers',
         templatePath: MOD_CRAFT_CONTROLLERS_TEMPLATE,
         dependencyList: abcdControllerDependencies,
         outputPath: getModCraftOutputDir(moduleData.appType || AppType.CdApi),
       }
   */
  // async generateArtifactsFromConfig(
  //   action: DevModeAction,
  //   moduleDescriptor: CdModuleDescriptor,
  //   config: ComponentGenerationConfig,
  // ): Promise<CdFxReturn<null>> {
  //   try {
  //     this.b.logWithContext(
  //       this,
  //       `generateArtifactsFromConfig:moduleDescriptor.controllers[0]:`,
  //       moduleDescriptor.controllers[0],
  //       'debug',
  //     );

  //     const extensionResult = getExtensionByLangProfile(
  //       LanguageName.TypeScript,
  //       languages,
  //       'tsSource',
  //     );
  //     if (!extensionResult.state) {
  //       return {
  //         state: false,
  //         message: `Failed to get extension for TypeScript: ${extensionResult.message}`,
  //         data: null,
  //       };
  //     }

  //     config.language = getLanguageByName(LanguageName.TypeScript, languages);

  //     // Normalize artifact type (remove plural)
  //     const type = config.artifactType.slice(0, -1) as PrimaryComponentType;

  //     // Build only the relevant array depending on type
  //     let targetComponents: ComponentDescriptor[] = [];
  //     switch (type) {
  //       case 'controller':
  //         targetComponents = moduleDescriptor.controllers || [];
  //         break;
  //       case 'service':
  //         targetComponents = moduleDescriptor.services || [];
  //         break;
  //       case 'model':
  //         targetComponents = moduleDescriptor.models || [];
  //         break;
  //     }

  //     this.b.logWithContext(
  //       this,
  //       'generateArtifactsFromConfig:targetComponents',
  //       { type, targetComponents },
  //       'debug',
  //     );

  //     // Allowed types for this run
  //     const allowedTypes: ComponentType[] = (() => {
  //       switch (type) {
  //         case 'controller':
  //           return [ComponentType.Controller, ComponentType.ControllerType];
  //         case 'service':
  //           return [ComponentType.Service, ComponentType.ServiceType];
  //         case 'model':
  //           return [ComponentType.Model, ComponentType.ModelType, ComponentType.ModelView];
  //       }
  //     })();

  //     // --- process only relevant components ---
  //     for (const artifactTypeDescriptor of targetComponents) {
  //       if (allowedTypes.includes(artifactTypeDescriptor.type)) {
  //         config.componentDescriptor = artifactTypeDescriptor as
  //           | CdControllerDescriptor
  //           | CdServiceDescriptor
  //           | CdModelDescriptor;

  //         const result = await this.generateComponent(
  //           artifactTypeDescriptor as CdControllerDescriptor | CdServiceDescriptor,
  //           config,
  //           moduleDescriptor,
  //           action,
  //         );

  //         if (!result.state) {
  //           return {
  //             state: false,
  //             data: null,
  //             message: result.message || `Failed to generate ${config.artifactType}`,
  //           };
  //         }
  //       }
  //     }

  //     return { state: true, data: null };
  //   } catch (e) {
  //     const msg = (e as Error).message || 'Unexpected error in generateArtifactsFromConfig';
  //     this.b.logWithContext(this, 'generateArtifactsFromConfig:error', { e, msg }, 'error');
  //     return { state: false, data: null, message: msg };
  //   }
  // }

  /**
   * Generate a component file (controller, service, model)
   */

  // async generateComponent(
  //   artifactTypeDescriptor: CdControllerDescriptor | CdServiceDescriptor,
  //   config: ComponentGenerationConfig,
  //   moduleDescriptor: CdModuleDescriptor,
  //   action: DevModeAction,
  // ): Promise<CdFxReturn<void>> {
  //   try {
  //     if (
  //       !artifactTypeDescriptor.name ||
  //       !artifactTypeDescriptor.dependencies ||
  //       !artifactTypeDescriptor.fileName
  //     ) {
  //       return {
  //         state: false,
  //         data: undefined,
  //         message: 'Componet data is not valid.',
  //       };
  //     }
  //     config.componentName = artifactTypeDescriptor.name;
  //     // --- 1. Validation ---
  //     if (!artifactTypeDescriptor?.name) {
  //       const msg = 'Descriptor missing name';
  //       this.b.logWithContext(this, 'generateComponent:validation-fail', { msg }, 'error');
  //       return { state: false, data: undefined, message: msg };
  //     }

  //     if (!Array.isArray(config.dependencyList)) {
  //       const msg = 'Invalid dependencyList in config';
  //       return { state: false, data: undefined, message: msg };
  //     }

  //     this.b.logWithContext(
  //       this,
  //       `gnerateComponent:artifactTypeDescriptor.dependencies:`,
  //       artifactTypeDescriptor.dependencies,
  //       'debug',
  //     );

  //     // --- 2. Process Dependencies ---
  //     const depsResult = await this.processDependencies(
  //       artifactTypeDescriptor.dependencies,
  //       moduleDescriptor,
  //     );
  //     if (!depsResult.state) {
  //       return {
  //         state: false,
  //         data: null,
  //         message: depsResult.message || 'Failed to process dependencies',
  //       };
  //     }
  //     const dependencies = depsResult.data;
  //     this.b.logWithContext(this, `generateComponent:dependencies:`, dependencies, 'debug');

  //     // --- 3. Build Import Block ---
  //     const importBlock = this.groupImports(dependencies ?? []);
  //     this.b.logWithContext(this, `generateComponent:importBlock:`, importBlock, 'debug');

  //     const nameMap = this.prepareNameMap(artifactTypeDescriptor.name);
  //     this.b.logWithContext(this, `generateComponent:nameMap:`, nameMap, 'debug');

  //     /**
  //      * --- 3. Build methods ---
  //      */
  //     const methodStubsResult = await this.svTemplateSnippet.buildMethodStubSnippets(
  //       config.artifactType.slice(0, -1) as 'controller' | 'service' | 'model',
  //       artifactTypeDescriptor.methods ?? [],
  //       artifactTypeDescriptor.name,
  //       this, // 👈 pass current instance
  //       artifactTypeDescriptor,
  //     );
  //     this.b.logWithContext(
  //       this,
  //       `generateComponent:methodStubsResult:`,
  //       methodStubsResult,
  //       'debug',
  //     );

  //     if (methodStubsResult.state === CdFxStateLevel.Error) {
  //       return {
  //         state: false,
  //         data: undefined,
  //         message: methodStubsResult.message || 'Failed to build method stubs',
  //       };
  //     }

  //     // --- 4. Assemble class using buildClass() ---
  //     const primaryType = this.derivePrimaryComponentType(artifactTypeDescriptor.fileName);
  //     if (!primaryType) {
  //       return {
  //         state: CdFxStateLevel.LogicalFailure,
  //         message: 'Could not get the file name',
  //       };
  //     }

  //     const classResult = await this.svTemplateSnippet.buildClass(
  //       `${nameMap.Abcd}${toPascalCase(primaryType)}`,
  //       artifactTypeDescriptor.attributes, // attributes (if any in future)
  //       // constructorSnippetResult.data ?? '',
  //       methodStubsResult.data ?? [],
  //     );

  //     if (classResult.state === CdFxStateLevel.Error) {
  //       return {
  //         state: false,
  //         data: undefined,
  //         message: classResult.message || 'Failed to build class',
  //       };
  //     }

  //     const classCode = `${importBlock}\n\n${classResult.data}`;
  //     // this.b.logWithContext(this, `generateComponent:classCode:`, classCode, 'debug');

  //     // --- 5. PreWrite Validation ---
  //     const structureErrorsResult = await this.svPreWriteValidator.validateStructure(classCode);
  //     this.b.logWithContext(
  //       this,
  //       `generateComponent:structureErrorsResult:`,
  //       structureErrorsResult,
  //       'debug',
  //     );

  //     if (!structureErrorsResult?.state) {
  //       return {
  //         state: false,
  //         data: undefined,
  //         message: structureErrorsResult.message || 'Structure validation failed',
  //       };
  //     }

  //     const casingErrorsResult = await this.svPreWriteValidator.validateCasing(classCode);
  //     this.b.logWithContext(
  //       this,
  //       `generateComponent:casingErrorsResult:`,
  //       casingErrorsResult,
  //       'debug',
  //     );

  //     if (!casingErrorsResult?.state) {
  //       return {
  //         state: false,
  //         data: undefined,
  //         message: casingErrorsResult.message || 'Casing validation failed',
  //       };
  //     }

  //     let finalCode = classCode;
  //     const structureErrors = structureErrorsResult.data ?? [];
  //     const casingErrors = casingErrorsResult.data ?? [];
  //     if (structureErrors.length || casingErrors.length) {
  //       if (this.svPreWriteValidator.autoCorrect) {
  //         const autoCorrectResult = this.svPreWriteValidator.autoCorrect(classCode, [
  //           ...structureErrors,
  //           ...casingErrors,
  //         ]);
  //         finalCode =
  //           autoCorrectResult instanceof Promise
  //             ? ((await autoCorrectResult).data ?? classCode)
  //             : (autoCorrectResult ?? classCode);
  //       }
  //     }

  //     /**
  //      * --- 6. Apply the method implementations to the finalCode scaffold. ---
  //      * - substitute default methods with template reference
  //      */
  //     const finalImplementedCode = await this.applyComponentImplementations(
  //       finalCode,
  //       artifactTypeDescriptor,
  //       moduleDescriptor,
  //     );

  //     this.b.logWithContext(
  //       this,
  //       `generateComponent:finalImplementedCode:`,
  //       finalImplementedCode,
  //       'debug',
  //     );

  //     this.b.logWithContext(
  //       this,
  //       `generateComponent:artifactTypeDescriptor.fileName:`,
  //       artifactTypeDescriptor.fileName,
  //       'debug',
  //     );

  //     config.componentDescriptor = artifactTypeDescriptor;

  //     /**
  //      * stop for observation before writing controllers
  //      */
  //     // if(artifactTypeDescriptor) {
  //     //   throw new Error(`Process stoped for observation!`);
  //     // }

  //     /**
  //      * stop for observation before writing controller types
  //      */
  //     // if (artifactTypeDescriptor && artifactTypeDescriptor.type === ComponentType.ControllerType) {
  //     //   throw new Error(`Process stoped for observation!`);
  //     // }

  //     /**
  //      * stop for observation before writing services
  //      */
  //     // if (artifactTypeDescriptor && artifactTypeDescriptor.type === ComponentType.Service) {
  //     //   throw new Error(`Process stoped for observation!`);
  //     // }

  //     /**
  //      * stop for observation before writing service type
  //      */
  //     // if (artifactTypeDescriptor && artifactTypeDescriptor.type === ComponentType.ServiceType) {
  //     //   throw new Error(`Process stoped for observation!`);
  //     // }

  //     // --- 9. File Write ---
  //     const writeResult = await this.writeFile(
  //       config,
  //       moduleDescriptor,
  //       finalImplementedCode,
  //       action,
  //       artifactTypeDescriptor,
  //     );
  //     if (!writeResult.state) return writeResult;

  //     return { state: true, data: undefined };
  //   } catch (e) {
  //     const actualMessage = (e as Error).message || 'Unknown error during generateComponent';
  //     this.b.logWithContext(this, 'generateComponent:error', { e, actualMessage }, 'error');
  //     return { state: false, data: undefined, message: actualMessage };
  //   }
  // }

  // --- internal helpers ---
  private async processDependencies(
    // imports: { path: string; symbols: string[] }[],
    imports: DependencyDescriptor[],
    moduleDescriptor: CdModuleDescriptor,
  ): Promise<CdFxReturn<DependencyDescriptor[]>> {
    try {
      if (!Array.isArray(imports)) {
        return { state: false, data: [], message: 'Imports must be an array' };
      }
      const depPromises = imports.map((imp) =>
        this.svDependencyProcessor.classifyImport(
          imp,
          moduleDescriptor,
          moduleDescriptor.parentAppType || AppType.CdApi,
        ),
      );
      const depResults = await Promise.all(depPromises);
      const failed = depResults.find((r) => !r.state);
      if (failed) {
        return { state: false, data: [], message: failed.message || 'Failed to classify import' };
      }
      const deps = depResults.map((r) => r.data as DependencyDescriptor);
      this.b.logWithContext(this, `processDependencies:deps:`, { deps }, 'debug');
      return { state: true, data: deps };
    } catch (err) {
      this.b.logWithContext(this, 'processDependencies:error', err, 'error');
      return { state: false, data: [], message: 'Error processing dependencies' };
    }
  }

  private groupImports(dependencies: DependencyDescriptor[]): string {
    const groups = {
      npm: [] as string[],
      sysCore: [] as string[],
      sysUtils: [] as string[],
      sysModules: [] as string[],
      appModules: [] as string[],
      thisModule: [] as string[],
    };

    dependencies.forEach((dep) => {
      if (dep.source === 'npm') groups.npm.push(this.formatImport(dep));
      else if (dep.category === 'core') groups.sysCore.push(this.formatImport(dep));
      else if (dep.category === 'utility') groups.sysUtils.push(this.formatImport(dep));
      else if (dep.cdCtx === 'sys') groups.sysModules.push(this.formatImport(dep));
      else if (dep.cdCtx === 'app') groups.appModules.push(this.formatImport(dep));
      else groups.thisModule.push(this.formatImport(dep));
    });

    return [
      ...groups.npm,
      '',
      ...groups.sysCore,
      ...groups.sysUtils,
      ...groups.sysModules,
      ...groups.appModules,
      ...groups.thisModule,
    ]
      .filter(Boolean)
      .join('\n');
  }

  prepareNameMap(baseName: string) {
    const pascal = this.svNamingFilter.toPascalCase(baseName); // MyModule
    const camel = this.svNamingFilter.toCamelCase(baseName); // myModule
    const kebab = this.svNamingFilter.toKebabCase(baseName); // my-module
    const snake = this.svNamingFilter.toSnakeCase(baseName); // my_module

    return {
      // Standard base names
      Abcd: pascal,
      abcd: camel,
      'abcd-kebab': kebab,
      abcd_snake: snake,

      // Prefixed variations
      svAbcd: `sv${pascal}`,
      svabcd: `sv${camel}`,

      // Service-style names
      AbcdService: `${pascal}Service`,
      abcdService: `${camel}Service`,

      // Controller-style names
      AbcdController: `${pascal}Controller`,
      abcdController: `${camel}Controller`,

      // Model-style names
      AbcdModel: `${pascal}Model`,
      abcdModel: `${camel}Model`,
    };
  }

  /**
   * Not used at the moment
   * @param nameMap
   * @param type
   * @returns
   */
  private buildClassHeader(nameMap: any, type: string) {
    return `export class ${nameMap.Abcd}${this.svNamingFilter.toPascalCase(type)} {`;
  }

  private formatImport(dep: DependencyDescriptor) {
    // this.b.logWithContext(this, `formatImport:dep:`, { dep }, 'debug');
    const symbols = [
      ...(dep.usage?.classesUsed || []),
      ...(dep.usage?.functionsUsed || []),
      ...(dep.usage?.modulesUsed || []),
    ];
    return `import { ${symbols.join(', ')} } from '${dep.resolution?.path}';`;
  }

  /**
   * Not used at the moment
   * @param finalCode
   * @param artifactDescriptor
   * @param moduleDescriptor
   * @returns
   */

  private async applyComponentImplementations(
    finalCode: string,
    artifactDescriptor: CdControllerDescriptor | CdServiceDescriptor | CdModelDescriptor,
    moduleDescriptor: CdModuleDescriptor,
  ): Promise<string> {
    // this.b.logWithContext(this, `applyComponentImplementations:finalCode:`, finalCode, 'debug');
    try {
      const templatePath = `${MOD_CRAFT_CD_API_TEMPLATE}/${this.derivePrimaryComponentType(
        artifactDescriptor.fileName ?? '',
      )}s/${this.toTemplateFileName(artifactDescriptor.fileName ?? '')}`;
      this.b.logWithContext(this, `applyComponentImplementations:trace:`, '03', 'debug');
      const templateResult = await this.svTemplateLoader.load(templatePath);
      // this.b.logWithContext(
      //   this,
      //   `applyComponentImplementations:templateResult:`,
      //   templateResult,
      //   'debug',
      // );
      this.b.logWithContext(this, `applyComponentImplementations:trace:`, '04', 'debug');
      if (templateResult.state && templateResult.data) {
        this.b.logWithContext(this, `applyComponentImplementations:trace:`, '05', 'debug');
        this.b.logWithContext(
          this,
          `applyComponentImplementations:artifactDescriptor.type:`,
          { artifactDescriptorType: artifactDescriptor.type },
          'debug',
        );
        switch (artifactDescriptor.type) {
          case 'controller': {
            this.b.logWithContext(
              this,
              `applyComponentImplementations:trace:`,
              '06-case-controller',
              'debug',
            );
            const implementationResult = await this.svGenControllerImplementation.implementMethods(
              artifactDescriptor as CdControllerDescriptor,
              templateResult.data,
              finalCode,
              moduleDescriptor,
              this,
            );
            this.b.logWithContext(
              this,
              `applyComponentImplementations:implementationResult1:`,
              implementationResult,
              'debug',
            ); // ok 5
            this.b.logWithContext(
              this,
              `applyComponentImplementations:trace:`,
              '07-case-controller',
              'debug',
            );
            if (implementationResult.state && implementationResult.data) {
              finalCode = implementationResult.data;
            }
            break;
          }

          case 'controller-type': {
            this.b.logWithContext(
              this,
              `applyComponentImplementations:trace:`,
              '06-case-controller-type',
              'debug',
            );
            const implementationResult = await this.svGenControllerImplementation.implementMethods(
              artifactDescriptor as CdControllerDescriptor,
              templateResult.data,
              finalCode,
              moduleDescriptor,
              this,
            );
            this.b.logWithContext(
              this,
              `applyComponentImplementations:implementationResult1-2:`,
              implementationResult,
              'debug',
            ); // ok 5
            this.b.logWithContext(
              this,
              `applyComponentImplementations:trace:`,
              '07-case-controller-type',
              'debug',
            );
            if (implementationResult.state && implementationResult.data) {
              finalCode = implementationResult.data;
            }
            break;
          }

          case 'service': {
            this.b.logWithContext(
              this,
              `applyComponentImplementations:trace:`,
              '06-case-service',
              'debug',
            );
            const implementationResult = await this.svGenControllerImplementation.implementMethods(
              artifactDescriptor as CdServiceDescriptor,
              templateResult.data,
              finalCode,
              moduleDescriptor,
              this,
            );
            this.b.logWithContext(
              this,
              `applyComponentImplementations:implementationResult3:`,
              implementationResult,
              'debug',
            ); // ok 5
            this.b.logWithContext(
              this,
              `applyComponentImplementations:trace:`,
              '07-case-service',
              'debug',
            );
            if (implementationResult.state && implementationResult.data) {
              finalCode = implementationResult.data;
            }
            return finalCode;
          }

          case 'service-type':
            this.b.logWithContext(
              this,
              `applyComponentImplementations:trace:`,
              '06-case-service-type',
              'debug',
            );
            const implementationResult = await this.svGenControllerImplementation.implementMethods(
              artifactDescriptor as CdServiceDescriptor,
              templateResult.data,
              finalCode,
              moduleDescriptor,
              this,
            );
            // this.b.logWithContext(
            //   this,
            //   `applyComponentImplementations:implementationResult4:`,
            //   implementationResult,
            //   'debug',
            // ); // ok 5
            this.b.logWithContext(
              this,
              `applyComponentImplementations:trace:`,
              '07-case-service-type',
              'debug',
            );
            if (implementationResult.state && implementationResult.data) {
              finalCode = implementationResult.data;
            }
            return finalCode;

          case 'model':
            this.b.logWithContext(this, `applyComponentImplementations:trace:`, '09', 'debug');
            return finalCode;

          default:
            this.b.logWithContext(this, `applyComponentImplementations:trace:`, '10', 'debug');
            return finalCode;
        }
      }
      this.b.logWithContext(this, `applyComponentImplementations:finalCode2:`, finalCode, 'debug'); // ok 6
      this.b.logWithContext(this, `applyComponentImplementations:trace:`, '11', 'debug');
      return finalCode;
    } catch (e) {
      this.b.logWithContext(this, `applyComponentImplementations:trace:`, '12', 'debug');
      this.b.logWithContext(this, 'applyComponentImplementations:error', { e }, 'error');
      return finalCode;
    }
  }

  /**
   * Helper: injects generated methods into scaffolded class.
   */
  private mergeIntoClass(finalCode: string, methods: string): string {
    return finalCode.replace(/}\s*$/, `${methods}\n}`);
  }

  getTemplateImplementation(type: string, methodName: string): string | null {
    this.b.logWithContext(this, `getTemplateImplementation:`, { type, methodName }, 'debug');

    // const templates: Record<string, Record<string, string>> = {
    //   controller: {
    //     findAll: `  async findAll(): Promise<any[]> {\n    // TODO: implement fetch logic\n    return [];\n  }`,
    //     findOne: `  async findOne(id: string): Promise<any> {\n    // TODO: implement fetch logic\n    return {};\n  }`,
    //   },
    //   service: {
    //     create: `  async create(data: any): Promise<any> {\n    // TODO: implement create logic\n    return data;\n  }`,
    //     update:
    //       `  async update(id: string, data: any): Promise<any> {\n    // TODO: implement update logic\n    return data;\n` +
    //       `  }`,
    //   },
    //   model: {
    //     default: `  // Define model fields here\n`,
    //   },
    // };

    const templates: Record<string, Record<string, string>> = {
      controller: {
        findAll:
          `  // <<cd:method:findAll:start>>\n` +
          `  async findAll(): Promise<any[]> {\n` +
          `    // TODO: implement fetch logic\n` +
          `    return [];\n` +
          `  }\n` +
          `  // <<cd:method:findAll:end>>`,

        findOne:
          `  // <<cd:method:findOne:start>>\n` +
          `  async findOne(id: string): Promise<any> {\n` +
          `    // TODO: implement fetch logic\n` +
          `    return {};\n` +
          `  }\n` +
          `  // <<cd:method:findOne:end>>`,
      },

      service: {
        create:
          `  // <<cd:method:create:start>>\n` +
          `  async create(data: any): Promise<any> {\n` +
          `    // TODO: implement create logic\n` +
          `    return data;\n` +
          `  }\n` +
          `  // <<cd:method:create:end>>`,

        update:
          `  // <<cd:method:update:start>>\n` +
          `  async update(id: string, data: any): Promise<any> {\n` +
          `    // TODO: implement update logic\n` +
          `    return data;\n` +
          `  }\n` +
          `  // <<cd:method:update:end>>`,
      },

      model: {
        default:
          `  // <<cd:method:modelFields:start>>\n` +
          `  // Define model fields here\n` +
          `  // <<cd:method:modelFields:end>>`,
      },
    };

    this.b.logWithContext(this, `getTemplateImplementation:templates`, { templates }, 'debug');

    const typeTemplates = templates[type];
    this.b.logWithContext(
      this,
      `getTemplateImplementation:typeTemplates`,
      { typeTemplates },
      'debug',
    );

    if (!typeTemplates) return null;

    // Use a direct existence check to avoid prototype chain lookup
    const templateForMethod = Object.prototype.hasOwnProperty.call(typeTemplates, methodName)
      ? typeTemplates[methodName]
      : typeTemplates['default'];

    const ret = templateForMethod ?? null;
    this.b.logWithContext(this, `getTemplateImplementation:ret`, { ret }, 'debug');
    return ret;
  }

  // public applyNameMap(template: string, nameMap: Record<string, string>): string {
  //   this.b.logWithContext(
  //     this,
  //     `applyNameMap:start`,
  //     { template: inspect(template, { depth: 2 }), nameMap },
  //     'debug',
  //   );
  //   let result = template;
  //   try {
  //     // Get the keys from the map and sort them by length in descending order
  //     // This is important to ensure that 'AbcdController' is replaced before 'Abcd'
  //     const sortedKeys = Object.keys(nameMap).sort((a, b) => b.length - a.length);

  //     // Iterate through each placeholder and its replacement
  //     for (const key of sortedKeys) {
  //       const value = nameMap[key];

  //       // Create a global regular expression for the current key
  //       // The `g` flag ensures all occurrences are replaced.
  //       // The `i` flag handles case-insensitivity if needed, but since
  //       // the map already has different cases, it might not be necessary.
  //       const regex = new RegExp(key, 'g');

  //       result = result.replace(regex, value);
  //     }

  //     return result;
  //   } catch (e) {
  //     this.b.logWithContext(this, `applyNameMap():error`, { error: (e as Error).message }, 'error');
  //     throw new Error(`There was an error trying to apply nameMap: Error:${(e as Error).message}`);
  //   }
  // }
  // public applyNameMap(template: string, nameMap: Record<string, string>): string {
  //   this.b.logWithContext(
  //     this,
  //     `applyNameMap:start`,
  //     { template: inspect(template, { depth: 2 }), nameMap },
  //     'debug',
  //   );

  //   let result = template;
  //   try {
  //     // Sort keys longest first (important for avoiding partial replacements)
  //     const sortedKeys = Object.keys(nameMap).sort((a, b) => b.length - a.length);

  //     for (const key of sortedKeys) {
  //       const value = nameMap[key];

  //       // Regex to find the key globally
  //       const regex = new RegExp(key, 'g');

  //       result = result.replace(regex, (match, offset, str) => {
  //         // Slice what follows immediately after replacement
  //         const following = str.slice(offset + match.length, offset + match.length + 4);

  //         // 🚫 Guard: prevent "Type"
  //         if (
  //           value.endsWith('Type') &&
  //           (following.startsWith('Type') || str.slice(offset, offset + value.length) === value)
  //         ) {
  //           this.b.logWithContext(
  //             this,
  //             `applyNameMap:skip-duplicate`,
  //             { match, replacement: value, following },
  //             'debug',
  //           );
  //           return value; // just return once, don’t add extra "Type"
  //         }
  //         this.b.logWithContext(
  //           this,
  //           `applyNameMap:replace`,
  //           { match, replacement: value, following },
  //           'debug',
  //         );

  //         return value;
  //       });
  //     }

  //     this.b.logWithContext(this, `applyNameMap:result`, { result }, 'debug');

  //     return result;
  //   } catch (e) {
  //     this.b.logWithContext(this, `applyNameMap():error`, { error: (e as Error).message }, 'error');
  //     // ⚠ In cd-api, better to not throw. Could log & return original string instead.
  //     return template;
  //   }
  // }

  // public applyNameMap(template: string, nameMap: Record<string, string>): string {
  //   this.b.logWithContext(
  //     this,
  //     `applyNameMap:start`,
  //     { template: inspect(template, { depth: 2 }), nameMap },
  //     'debug',
  //   );

  //   let result = template;
  //   try {
  //     // Sort keys longest first (avoid partial replacements)
  //     const sortedKeys = Object.keys(nameMap).sort((a, b) => b.length - a.length);

  //     for (const key of sortedKeys) {
  //       const value = nameMap[key];

  //       // Special guard: handle "Type"
  //       if (value.endsWith('Type')) {
  //         const combinedRegex = new RegExp(key + 'Type', 'g');
  //         result = result.replace(combinedRegex, value);
  //       }

  //       // Normal replacement for standalone key
  //       const regex = new RegExp(key, 'g');
  //       result = result.replace(regex, (match, offset, str) => {
  //         const following = str.slice(offset + match.length, offset + match.length + 4);
  //         const alreadyMapped = str.slice(offset, offset + value.length) === value;

  //         if (value.endsWith('Type') && (following.startsWith('Type') || alreadyMapped)) {
  //           this.b.logWithContext(
  //             this,
  //             `applyNameMap:skip-duplicate`,
  //             { match, replacement: value, following },
  //             'debug',
  //           );
  //           return value;
  //         }

  //         this.b.logWithContext(
  //           this,
  //           `applyNameMap:replace`,
  //           { match, replacement: value, following },
  //           'debug',
  //         );
  //         return value;
  //       });
  //     }

  //     this.b.logWithContext(this, `applyNameMap:result`, { result }, 'debug');
  //     return result;
  //   } catch (e) {
  //     this.b.logWithContext(this, `applyNameMap:error`, { error: (e as Error).message }, 'error');
  //     return template; // safe fallback
  //   }
  // }

  public applyNameMap(template: string, nameMap: Record<string, string>): string {
    // this.b.logWithContext(
    //   this,
    //   `applyNameMap:start`,
    //   { template: inspect(template, { depth: 2 }), nameMap },
    //   'debug',
    // );

    // this.b.logWithContext(this, `applyNameMap:start`, {}, 'debug');

    let result = template;

    try {
      // Sort keys longest → shortest so larger placeholders replace before smaller
      const sortedKeys = Object.keys(nameMap).sort((a, b) => b.length - a.length);

      for (const key of sortedKeys) {
        const value = nameMap[key];
        const regex = new RegExp(key, 'g');
        result = result.replace(regex, value);
      }

      // --- 🧹 Final cleanup step ---
      // Collapse duplicate "TypeType" into single "Type"
      result = result.replace(/TypeType/g, 'Type');

      // this.b.logWithContext(this, `applyNameMap:result`, { result }, 'debug');

      return result;
    } catch (e) {
      this.b.logWithContext(this, `applyNameMap():error`, { error: (e as Error).message }, 'error');
      return template; // graceful fallback, avoid fatal error
    }
  }

  // async writeFile(
  //   config: ComponentGenerationConfig,
  //   moduleDescriptor: CdModuleDescriptor,
  //   content: any, // kept loose since generators may return object/array/string
  //   action: DevModeAction,
  //   component?: ComponentDescriptor,
  // ): Promise<CdFxReturn<void>> {
  //   try {
  //     const outputFileName = config.componentDescriptor?.fileName;
  //     this.b.logWithContext(this, 'writeFile:trace', '01', 'debug');
  //     // this.b.logWithContext(
  //     //   this,
  //     //   'writeFile:outputFileName',
  //     //   { outputFileName, config, moduleDescriptor },
  //     //   'debug',
  //     // );

  //     this.b.logWithContext(this, 'writeFile:outputFileName', { outputFileName }, 'debug');
  //     const pathResult = await this.resolveOutputFilePath(
  //       config,
  //       moduleDescriptor,
  //       outputFileName,
  //       component,
  //     );

  //     if (!pathResult || !pathResult.data) {
  //       return { state: false, message: pathResult.message };
  //     }

  //     const fullPath = pathResult.data;

  //     // const fullPath = this.resolveOutputFilePath(config, moduleDescriptor);
  //     const outputDir = config.outputPath;
  //     this.b.logWithContext(this, 'writeFile:outputDir', { fullPath, action, outputDir }, 'debug');

  //     // --- BEFORE TREE ---
  //     try {
  //       this.b.logWithContext(this, 'writeFile:before-tree', { outputDir }, 'debug');
  //       const { stdout: beforeTree } = await execPromise(
  //         `tree -a -I 'node_modules|.git' ${outputDir}`,
  //       );
  //       this.b.logWithContext(
  //         this,
  //         'writeFile:before-tree',
  //         { outputDir, tree: beforeTree },
  //         'debug',
  //       );
  //     } catch (treeErr) {
  //       this.b.logWithContext(this, 'writeFile:before-tree:error', treeErr, 'error');
  //     }

  //     this.b.logWithContext(this, 'writeFile:start', { fullPath, action }, 'debug');

  //     try {
  //       await fs.mkdir(path.dirname(fullPath), { recursive: true });

  //       // 🔽 Normalize content before writing
  //       let normalizedContent: string;
  //       if (!content) {
  //         normalizedContent = '';
  //       } else if (typeof content === 'string') {
  //         normalizedContent = content;
  //       } else if (Array.isArray(content)) {
  //         normalizedContent = content.join('\n');
  //       } else if (typeof content === 'object' && 'data' in content) {
  //         const data = (content as any).data;
  //         if (Array.isArray(data)) {
  //           normalizedContent = data.join('\n');
  //         } else {
  //           normalizedContent = String(data ?? '');
  //         }
  //       } else {
  //         normalizedContent = String(content);
  //       }

  //       this.b.logWithContext(
  //         this,
  //         'writeFile:normalizedContent',
  //         { fullPath, normalizedContent },
  //         'debug',
  //       );

  //       if (action === DevModeAction.CREATE) {
  //         // fs.writeFile(fullPath, normalizedContent, 'utf8');
  //         await writePrettyFile(fullPath, normalizedContent);
  //       } else {
  //         await writePrettyFileSafely(fullPath, normalizedContent);
  //       }

  //       // --- AFTER TREE ---
  //       try {
  //         const { stdout: afterTree } = await execPromise(
  //           `tree -a -I 'node_modules|.git' ${outputDir}`,
  //         );
  //         this.b.logWithContext(
  //           this,
  //           'writeFile:after-tree',
  //           { outputDir, fullPath, tree: afterTree },
  //           'debug',
  //         );
  //       } catch (treeErr) {
  //         this.b.logWithContext(this, 'writeFile:after-tree:error', treeErr, 'error');
  //       }

  //       return { state: true, data: undefined };
  //     } catch (err) {
  //       this.b.logWithContext(this, `writeFile:error:`, { fullPath, content, err }, 'error');
  //       return { state: false, data: undefined, message: `Failed to write file at ${fullPath}` };
  //     }
  //   } catch (e) {
  //     const msg = (e as Error).message || 'Unexpected error in writeFile';
  //     this.b.logWithContext(this, 'writeFile:exception', { e, msg }, 'error');
  //     return { state: false, data: null, message: msg };
  //   }
  // }

  /**
   * Resolve the output file path based on the config and module descriptor
   */
  async resolveOutputFilePath(
    config: ComponentGenerationConfig,
    moduleDescriptor: CdModuleDescriptor,
    fileName?: string,
    component?: ComponentDescriptor,
  ): Promise<CdFxReturn<string>> {
    const fileType = config.artifactType.slice(0, -1) as 'controller' | 'service' | 'model';

    if (component?.fileName) {
      const primaryType = this.derivePrimaryComponentType(component?.fileName);
      this.b.logWithContext(this, `GenComponentService:primaryType:`, primaryType, 'debug');
      this.logger.logDebug(
        `GenComponentService::resolveOutputFilePath()/expected-resolution: ${config.outputPath}/${moduleDescriptor.name}/${primaryType}s/${component?.fileName}`,
      );
      return {
        state: true,
        data: `${config.outputPath}/${moduleDescriptor.name}/${primaryType}s/${component?.fileName}`,
      };
    } else {
      return {
        state: CdFxStateLevel.LogicalFailure,
        data: null,
        message: 'No file name was provided',
      };
    }
  }

  derivePrimaryComponentType(fileName: string): PrimaryComponentType | null {
    if (!fileName) return null;

    // remove .ts extension
    const noExt = fileName.replace(/\.ts$/, '');

    // split by dot
    const parts = noExt.split('.');

    if (parts.length < 2) return null;

    // primary component type is the last part
    const candidate = parts[parts.length - 1].toLowerCase();

    // normalize known types
    const knownTypes: Record<string, PrimaryComponentType> = {
      controller: 'controller',
      service: 'service',
      model: 'model',
    };

    return knownTypes[candidate] ?? candidate;
  }

  // Reuse your enums/types
  // export enum ComponentType { ... }
  // export type PrimaryComponentType = 'controller' | 'service' | 'model';
  // export type DerivedSuffix = 'type' | 'view';

  mapComponentType(ct: ComponentType): { ext: Ext; suffix: Suffix } {
    switch (ct) {
      case ComponentType.Controller:
        return { ext: 'controller', suffix: null };
      case ComponentType.ControllerType:
        return { ext: 'controller', suffix: 'type' };
      case ComponentType.Service:
        return { ext: 'service', suffix: null };
      case ComponentType.ServiceType:
        return { ext: 'service', suffix: 'type' };
      case ComponentType.Model:
        return { ext: 'model', suffix: null };
      case ComponentType.ModelType:
        return { ext: 'model', suffix: 'type' };
      case ComponentType.ModelView:
        return { ext: 'model', suffix: 'view' };
      default:
        // For Utility / Component / Plugin (if you ever support templates for these),
        // you can extend this mapping.
        throw new Error(`Unsupported ComponentType for templating: ${ct}`);
    }
  }

  /**
   * Parse a component filename into: { modulePrefix, derivedSuffix, ext }
   * e.g. "cd-ai-usage-logs-type.service.ts" ->
   *   modulePrefix = "cd-ai-usage-logs", derivedSuffix = "type", ext = "service"
   */
  parseComponentFileName(fileName: string): {
    modulePrefix: string;
    derivedSuffix: Suffix;
    ext: Ext;
  } {
    const parts = fileName.split('.');
    if (parts.length !== 3 || parts[2] !== 'ts') {
      throw new Error(`Invalid component filename: ${fileName}`);
    }

    const base = parts[0]; // e.g. "cd-ai-usage-logs-type"
    const ext = parts[1] as Ext; // "controller" | "service" | "model"

    if (ext !== 'controller' && ext !== 'service' && ext !== 'model') {
      throw new Error(`Unsupported component extension: ${ext} in ${fileName}`);
    }

    let derivedSuffix: Suffix = null;
    let modulePrefix = base;

    if (base.endsWith('-type')) {
      derivedSuffix = 'type';
      modulePrefix = base.slice(0, -'-type'.length);
    } else if (base.endsWith('-view')) {
      derivedSuffix = 'view';
      modulePrefix = base.slice(0, -'-view'.length);
    }

    // Basic kebab-case validation for the module prefix (can be multi-segment)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(modulePrefix)) {
      throw new Error(`Invalid kebab-case module prefix in: ${fileName}`);
    }

    return { modulePrefix, derivedSuffix, ext };
  }

  /**
   * Convert any valid component filename to its template equivalent.
   * If `componentType` is provided, it enforces the expected (suffix, ext) pair.
   *
   * Examples:
   *  toTemplateFileName("cd-ai.service.ts") -> "abcd.service.ts"
   *  toTemplateFileName("cd-ai-type.service.ts") -> "abcd-type.service.ts"
   *  toTemplateFileName("cd-ai-view.model.ts") -> "abcd-view.model.ts"
   *
   *  toTemplateFileName("cd-ai-usage-logs-type.service.ts", ComponentType.ServiceType)
   *    -> "abcd-type.service.ts"
   */
  toTemplateFileName(fileName: string, componentType?: ComponentType): string {
    const { derivedSuffix: parsedSuffix, ext: parsedExt } = this.parseComponentFileName(fileName);

    // Default to what the filename declares
    let suffix: Suffix = parsedSuffix;
    let ext: Ext = parsedExt;

    // If the caller *explicitly* provides a ComponentType, enforce that shape
    if (componentType) {
      const mapped = this.mapComponentType(componentType);
      suffix = mapped.suffix;
      ext = mapped.ext;
    }

    const suffixPart = suffix ? `-${suffix}` : '';
    return `abcd${suffixPart}.${ext}.ts`;
  }
}
