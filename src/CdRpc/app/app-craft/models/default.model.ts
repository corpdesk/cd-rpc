import { dirname, resolve } from 'path';
import { HOME } from '../../../sys/utils/fs.util.js';
import { fileURLToPath } from 'url';
import config from '../../../../config.js';
import { DevModeAction } from '../../../sys/dev-mode/index.js';
import { DependencyDescriptor } from '../../../sys/dev-descriptor/models/dependancy-descriptor.model.js';
import { CdCtx } from '../../../sys/dev-descriptor/models/cd-module-descriptor.model.js';
import { AppType } from '../../../sys/dev-descriptor/models/cd-app.model.js';
import {
  CdControllerDescriptor,
  CdModelDescriptor,
  CdModuleDescriptor,
  CdServiceDescriptor,
  LanguageDescriptor,
} from '../../../sys/dev-descriptor/index.js';
import { CdFxReturn } from '../../../sys/base/i-base.js';

// Simulate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const MOD_CRAFT_OUTPUT_APP_DIR = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-app/output',
);

export const MOD_CRAFT_OUTPUT_API_DIR = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-api/output',
);

export const MOD_CRAFT_OUTPUT_MODULE_DIR = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-module/output',
);

export const MOD_CRAFT_OUTPUT_SANDBOX_DIR = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/SA/output',
);

// export const MOD_CRAFT_WORKFLOW_DIR = join(
//   __dirname,
//   "src/CdCli/app/app-craft/workshop/cd-api/workflow"
// );

export const MOD_CRAFT_WORKFLOW_API_DIR = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-api/workflow',
);

export const MOD_CRAFT_WORKFLOW_APP_DIR = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-app/workflow',
);

export const MOD_CRAFT_WORKFLOW_MODULE_DIR = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-module/workflow',
);

export const MOD_CRAFT_WORKFLOW_SANDBOX_DIR = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/sandbox/workflow',
);

export const MOD_CRAFT_WORKSHOP_DIR = resolve(HOME, 'cd-cli', 'dist/CdCli/app/app-craft/workshop');

// Controller Template Path
// /home/emp-12/cd-cli/src/CdCli/app/app-craft/workshop/cd-module/template/abcd/controllers/abcd.controller.ts

// export const MOD_CRAFT_CD_API_TEMPLATE = resolve(
//   HOME,
//   'cd-cli',
//   'dist/CdCli/app/app-craft/workshop/cd-module/template/abcd/controllers/abcd.controller.js',
// );

export const MOD_CRAFT_CONTROLLERS_TEMPLATE = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-module/template/abcd/controllers/abcd.controller.js',
);

export const MOD_CRAFT_MODEL_TEMPLATE = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-module/template/abcd/models/abcd.model.js',
);

export const MOD_CRAFT_SERVICES_TEMPLATE = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-module/template/abcd/services/abcd.service.js',
);

export const CD_API_TEST_BED_DIR = resolve(HOME, 'cd-projects', 'cd-api');

export const CD_API_APPS_DIR = resolve(CD_API_TEST_BED_DIR, 'src', 'CdApi', 'app');

export interface CdFieldDescriptor {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'Date' | 'any'; // extend as needed
}

export interface CdControllerModel {
  name: string;
  customFields: CdFieldDescriptor[];
}

// export const MOD_CRAFT_CD_API_TEMPLATE = 'src/CdCli/app/app-craft/workshop/cd-api/template/abcd';
export const MOD_CRAFT_CD_API_TEMPLATE = resolve(
  HOME,
  'cd-cli',
  'dist/CdCli/app/app-craft/workshop/cd-module/template/abcd',
);

export const MOD_CRAFT_SYNC_DATASOURCE = config.modules?.app?.['AppCraft']?.databaseSyncScript;

export interface ProcessTemplateOptions {
  action: DevModeAction;
  baseTemplate: string;
  name: string;
  variant: { pascalSuffix: string; camelSuffix: string; kebabSuffix: string };
  targetDir: string;
  fileSuffix: string; // e.g. ".controller.ts" or ".service.ts"
  dependencies?: DependencyDescriptor[]; // optional import definitions
  targetCtx?: CdCtx; // sys or app
}

// export interface ComponentGenerationConfig {
//   artifactType: 'controllers' | 'services' | 'models';
//   templatePath: string;
//   dependencyList: DependencyDescriptor[];
//   outputPath: string;
// }

export interface ComponentGenerationConfig {
  componentName?: string; // e.g. "AbcdController"
  componentDescriptor?: CdControllerDescriptor | CdServiceDescriptor | CdModelDescriptor; // e.g. { name: "AbcdController", methods: [...] }
  artifactType: 'controllers' | 'services' | 'models';
  templatePath: string;
  dependencyList: DependencyDescriptor[];
  outputPath: string; // Base directory for output
  fileType?: 'controller' | 'service' | 'model'; // e.g. "controller", "service", "model"
  extension?: string; // e.g. ".ts", ".js", ".cpp"
  language?: LanguageDescriptor; // Optional: full language model
}

// export interface ValidationPolicy {
//   name: string;
//   applyValidationPolicy(
//     base: CdModuleDescriptor,
//     custom: CdModuleDescriptor
//   ): CdFxReturn<CdModuleDescriptor>;
// }
export interface ValidationPolicy {
  name: string;
  applyValidationPolicy(
    base: CdModuleDescriptor,
    // custom: CdModuleDescriptor
  ): Promise<CdFxReturn<CdModuleDescriptor>>;
}

// export interface MigrationConfig {
//   enableTableBackup?: boolean;   // default: true
//   backupTableNamePrefix?: string; // optional, e.g., "bk_"
//   logLevel?: 'debug' | 'info' | 'warn' | 'error'; // allows tuning verbosity
//   dryRun?: boolean;              // if true, only log SQL, don’t execute
// }
export interface MigrationConfig {
  purgeMode?: boolean; // true = do not normalize names, skip backups
  migrationMode?: boolean; // true = normal migrations (default)
  enableTableBackup?: boolean; // kept for fine-grained overrides, but purgeMode can override it
  // 🚀 future extension points:
  dryRun?: boolean; // log SQL but don’t execute
  preserveViews?: boolean; // skip dropping views
  loggingLevel?: 'debug' | 'info' | 'warn' | 'error';
  backupTableNamePrefix?: string; // optional, e.g., "bk_"
}

export interface CrudTestConfig {
  requestTimeoutMs: number; // per request
  maxRetries: number; // retry attempts
  retryDelayMs: number; // initial delay for retries
  delayBetweenTestsMs: number; // pacing between tests
  stopOnFailure: boolean; // fail-fast mode
}

export interface CrudTestResult {
  controller: string;
  action: string;
  result: CdFxReturn<null>;
}

// export interface CdModuleDescriptor {
//   module: string;
//   type: "cd-api" | "cd-pwa" | "cd-cli"; // specify the type of module
//   controllers: CdControllerModel[];
// }

// array of controller dependencies for the Abcd template
export const abcdControllerDependencies: DependencyDescriptor[] = [
  /**
   * base utils and services
   */
  {
    name: 'BaseService',
    category: 'core',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    cdCtx: CdCtx.Sys,
    resolution: {
      method: 'import',
      path: '../../../sys/base/base.service',
    },
    usage: { classesUsed: ['BaseService'] },
  },

  /**
   * this module services
   */
  {
    name: 'AbcdTypeService',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.App,
    resolution: {
      method: 'import',
      path: '../services/abcd-type.service',
    },
    usage: { classesUsed: ['AbcdTypeService'] },
  },
  {
    name: 'AbcdService',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.App,
    resolution: {
      method: 'import',
      path: '../services/abcd.service',
    },
    usage: { classesUsed: ['AbcdService'] },
  },
];

// array of model dependencies for the Abcd template
export const abcdModelDependencies: DependencyDescriptor[] = [
  /**
   * external libraries
   */
  {
    name: 'typeorm',
    category: 'library',
    source: 'npm',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    cdCtx: undefined,
    resolution: {
      method: 'import',
      path: 'typeorm',
    },
    usage: {
      usageContext: 'model',
      classesUsed: ['Entity', 'PrimaryGeneratedColumn', 'Column'],
    },
  },
  {
    name: 'uuid',
    category: 'library',
    source: 'npm',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    cdCtx: undefined,
    resolution: {
      method: 'import',
      path: 'uuid',
    },
    usage: {
      usageContext: 'model',
      functionsUsed: ['v4'],
    },
  },

  /**
   * this module models
   */
  {
    name: 'AbcdModel',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.App,
    resolution: {
      method: 'import',
      path: '../models/abcd.model',
    },
    usage: {
      usageContext: 'model',
      classesUsed: ['AbcdModel'],
    },
  },
];

// array of service dependencies for the Abcd template
export const abcdServiceDependencies: DependencyDescriptor[] = [
  /**
   * npm modules
   */
  {
    name: 'typeorm',
    category: 'library',
    source: 'npm',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    resolution: { method: 'import', path: 'typeorm' },
    usage: { functionsUsed: ['Like'] },
  },

  /**
   * base interfaces
   */
  {
    name: 'i-base',
    category: 'core',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/base/i-base' },
    usage: {
      modulesUsed: ['CreateIParams', 'IQuery', 'IServiceInput', 'IUser', 'ISessionDataExt'],
    },
  },

  /**
   * base utils and services
   */
  {
    name: 'BaseService',
    category: 'core',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/base/base.service' },
    usage: { classesUsed: ['BaseService'] },
  },
  {
    name: 'CdService',
    category: 'core',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/base/cd.service' },
    usage: { classesUsed: ['CdService'] },
  },
  {
    name: 'Logging',
    category: 'utility',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/base/winston.log' },
    usage: { classesUsed: ['Logging'] },
  },
  {
    name: 'ValidationRulesBuilder',
    category: 'utility',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/base/validation-rules-builder' },
    usage: { classesUsed: ['ValidationRulesBuilder'] },
  },

  /**
   * utils and services
   */
  {
    name: 'QueryTransformer',
    category: 'utility',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: false,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/utils/query-transformer' },
    usage: { classesUsed: ['QueryTransformer'] },
  },

  /**
   * sys modules
   */
  {
    name: 'SessionService',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/user/services/session.service' },
    usage: { classesUsed: ['SessionService'] },
  },
  {
    name: 'UserService',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/user/services/user.service' },
    usage: { classesUsed: ['UserService'] },
  },
  {
    name: 'CompanyService',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/moduleman/services/company.service' },
    usage: { classesUsed: ['CompanyService'] },
  },
  {
    name: 'CompanyModel',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.Sys,
    resolution: { method: 'import', path: '../../../sys/moduleman/models/company.model' },
    usage: { classesUsed: ['CompanyModel'] },
  },

  /**
   * this module
   */
  {
    name: 'AbcdModel',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.App,
    resolution: { method: 'import', path: '../models/abcd.model' },
    usage: { classesUsed: ['AbcdModel'] },
  },
  {
    name: 'AbcdTypeModel',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.App,
    resolution: { method: 'import', path: '../models/abcd-type.model' },
    usage: { classesUsed: ['AbcdTypeModel'] },
  },
  {
    name: 'AbcdViewModel',
    category: 'custom',
    source: 'local',
    scope: 'module',
    targetApp: AppType.CdApi,
    isCdModule: true,
    cdCtx: CdCtx.App,
    resolution: { method: 'import', path: '../models/abcd-view.model' },
    usage: { classesUsed: ['AbcdViewModel'] },
  },
];
