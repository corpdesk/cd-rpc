// src/CdCli/app/app-craft/models/cd-app.model.ts

import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({
  name: "cd_model",
  synchronize: false,
})
// @CdModel
export class CdModelModel {

  @PrimaryGeneratedColumn({
    name: "cd_model_id",
  })
  cd_modelId?: number;

  @Column({
    name: "cd_model_guid",
    length: 36,
    default: uuidv4(),
  })
  CdModelGuid?: string;

  @Column("varchar", {
    name: "cd_model_name",
    length: 50,
    nullable: true,
  })
  CdModelName?: string;

  @Column({
    name: "doc_id",
    default: null,
  })
  // @IsInt()
  docId?: number;

  @Column({
    name: "cd_model_type_id",
    default: null,
  })
  cd_modelTypeId?: number;
}

/**
 * Root SeedConfig for a specific Corpdesk subsystem
 */
export interface SeedConfig {
  /** Subsystem name (e.g., cd-cli, cd-api, cd-shell) */
  subsystemName: string;

  /** Optional description for documentation */
  description?: string;

  /** Root path for scanning (relative or absolute) */
  rootPath: string;

  /** Expected file/directory roles and types mapping */
  roles: SeedRoleConfig[];

  /** Optional global variables or conventions for this subsystem */
  globals?: Record<string, any>;

  /** Optional patterns for ignoring files/folders during scanning */
  ignorePatterns?: string[];

  /** Optional template references to scaffold new artifacts */
  templates?: TemplateReference[];

  /** Optional metadata to guide mathematical expression engine */
  expressionMetadata?: ExpressionMetadata;

  /** Versioning to track evolution of seed */
  version?: string;

  includeExtensions?: string[]; // e.g., [".ts", ".js", ".json"]
}

/**
 * Role-specific configuration
 * Maps cd_obj_role to expected types, naming patterns, and scanning rules
 */
export interface SeedRoleConfig {
  /** Role name (e.g., bootstrap, controller, service) */
  roleName: string;

  /** Role GUID (if applicable) */
  roleGuid?: string;

  /** Expected object types for this role */
  allowedTypes?: CdObjType[];

  /** Naming conventions (regex, prefix/suffix, kebab/camel case rules) */
  namingPattern?: string;

  /** Optional sub-role hierarchy (nested roles) */
  children?: SeedRoleConfig[];

  /** Optional weight/priority for scanning or analysis */
  weight?: number;

  /** Optional template reference to scaffold new instances of this role */
  templateRef?: string;

  /** Optional expression for advanced role classification; for CR calculation */
  required?: boolean;
}

/**
 * Template reference for scaffolding
 */
export interface TemplateReference {
  /** Name/label of the template */
  name: string;

  /** Path to template file or stub */
  path: string;

  /** Optional roles this template applies to */
  roles?: string[];

  /** Optional metadata for template processing */
  metadata?: Record<string, any>;
}

/**
 * Metadata to guide mathematical expressions and grammar
 */
export interface ExpressionMetadata {
  /** Optional grammar rules for transcriber */
  grammarRules?: string[];

  /** Optional weights for purity/pollution scoring */
  scoringWeights?: Record<string, number>;

  /** Optional flags for LLM prompt generation */
  promptFlags?: Record<string, any>;
}

/**
 * cd_obj_type enumeration
 */
export type CdObjType =
  | 'app_file'
  | 'app_directory'
  | 'module'
  | 'controller'
  | 'model'
  | 'service'
  | 'utility'
  | 'plugin'
  | 'code'
  | 'unknown';

/**
 * Example usage: SeedConfig for cd-cli
 */
const cdCliSeed: SeedConfig = {
  subsystemName: 'cd-cli',
  rootPath: './cd-cli',
  roles: [
    {
      roleName: 'bootstrap',
      allowedTypes: ['app_file'],
      namingPattern: '^main\\.ts$',
      weight: 100,
    },
    {
      roleName: 'controller',
      allowedTypes: ['controller'],
      namingPattern: '.*Controller\\.ts$',
    },
    {
      roleName: 'service',
      allowedTypes: ['service'],
      namingPattern: '.*Service\\.ts$',
    },
    {
      roleName: 'module',
      allowedTypes: ['app_directory', 'module'],
      children: [
        {
          roleName: 'controller',
          allowedTypes: ['controller'],
        },
        {
          roleName: 'service',
          allowedTypes: ['service'],
        },
      ],
    },
  ],
  ignorePatterns: ['node_modules', '*.spec.ts'],
  templates: [
    {
      name: 'default-controller',
      path: './templates/controller.template.ts',
      roles: ['controller'],
    },
  ],
  expressionMetadata: {
    grammarRules: ['role -> type', 'children recursion allowed'],
    scoringWeights: { purity: 0.7, pollution: 0.3 },
    promptFlags: { generateLLMPrompt: true },
  },
  version: '1.0.0',
};

export interface SeedRoleConfig {
  /** Role name (e.g., bootstrap, controller, service) */
  roleName: string;

  /** Role GUID (if applicable) */
  roleGuid?: string;

  /** Expected object types for this role */
  allowedTypes?: CdObjType[];

  /** Naming conventions (regex, prefix/suffix, kebab/camel case rules) */
  namingPattern?: string;

  /**
   * DNA Expression instead of regex
   * Example:
   * "file.name CONTAINS '.controller.'"
   */
  // expression?: string;
  expression?: CdExpression;

  /** Optional sub-role hierarchy (nested roles) */
  children?: SeedRoleConfig[];

  /** Optional weight/priority for scanning or analysis */
  weight?: number;

  /** Optional template reference to scaffold new instances of this role */
  templateRef?: string;

  // 🔥 NEW — partition definition (replaces hardcoded S/A/U)
  partitions?: string[];

  // 🔥 NEW — omega policy
  omegaPolicy?: {
    allowUnknown?: boolean;
    classifyExtensions?: boolean;
  };
}

export interface ExpressionContext {
  filePath: string;
  fileName: string;
  extension: string;
  moduleHint?: string;
  depth?: number;
  isFile?: boolean;
  parentPath?: string;
}

// export type CdExpression =
//   | { op: 'contains'; field: keyof ExpressionContext; value: string }
//   | { op: 'equals'; field: keyof ExpressionContext; value: string }
//   | { op: 'regex'; field: keyof ExpressionContext; value: string }
//   | { op: 'and'; expressions: CdExpression[] }
//   | { op: 'or'; expressions: CdExpression[] };

export type CdExpression =
  | {
      op: 'contains' | 'startsWith' | 'endsWith' | 'equals';
      field: keyof ExpressionContext;
      value: string;
    }
  | {
      op: 'and' | 'or';
      conditions: CdExpression[];
    };

export interface CdAuditResult {
  CR: number;
  I: number;

  totalNodes: number;
  expectedNodes: number;
  omegaNodes: number;

  omega: {
    nodeGuid: string;
    classification: 'omega-valid' | 'omega-invalid';
    reason: string;
  }[];
}


