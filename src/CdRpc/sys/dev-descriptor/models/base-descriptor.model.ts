// src/CdCli/sys/dev-descriptor/models/base-descriptor.model.ts
import { CdObjModel } from "../../moduleman/index.js";
import { CdFileDescriptor } from "./version-control.model.js";

// Base Descriptor for General Use
export interface BaseDescriptor {
  name?: string; // Unique identifier
  type?: any; // Type of descriptor,
  cdObj?: CdObjModel; // Role in the system, e.g., "service", "environment", "ci-cd", etc.
  cdObjName?: string; // Name of the object, e.g., application, module, etc.
  cdObjTypeName?: string; // Type of the object, e.g., cd-api, cd-ui, etc.
  guid?: string; // Unique identifier for the descriptor, can be used to reference it in other contexts.
  description?: string;
  context?: string[]; // array of context assigned to a descriptor to group set associated descriptors and properties.
  // Could be name of application or profile name
  version?: string;
  fileMeta?: CdFileDescriptor;
  baseId?: string;         // Unique identifier, e.g., "mod-abc:doc"
}

export interface SystemRole {
  systemItem: SystemItemType;
  roleType?: SystemRoleType;
}

export enum SystemItemType {
  WORKSTATION = 'workstation',
  FILE = 'app_file',
  DIRECTORY = 'app_directory',
  CODE = 'code',
}

export enum SystemRoleType {
  CONFIGURATION = 'configuration',
  BOOTSTRAP = 'bootstrap',
  RUNTIME = 'runtime',
  TEST = 'test',
  DOCUMENTATION = 'documentation',
  UTILITY = 'utility',
  CONTROLLER = 'controller',
  MODEL = 'model',
  SERVICE = 'service',
  VERSION_CONTROL = 'version-control',
  CI_CD = 'ci-cd',
  NOISE = 'noise', // For items that is recommended for exclusion in certain contexts, e.g., depricated items, items marked for removal, or items that are not relevant in certain contexts.
}



