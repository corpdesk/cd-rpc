import { FunctionDescriptor } from '../../../sys/dev-descriptor/models/function-descriptor.model.js';
import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/i-base';
import { BaseService } from '../../../sys/base/base.service';
import { toPascalCase } from '../../../sys/utils/cd-naming.util.js';
import { GenComponentService } from './gen-component.service';
import { ComponentAttributes } from '../../../sys/dev-descriptor/models/component-descriptor.model.js';
import { MOD_CRAFT_CD_API_TEMPLATE } from '../models/default.model.js';
import { CdControllerDescriptor, CdServiceDescriptor } from '../../../sys/dev-descriptor/index.js';
import { TemplateLoaderService } from './template-loader.service';

export class TemplateSnippetService {
  b = new BaseService();

  async init(): Promise<void> {
    this.b.logWithContext(this, 'init-start', {}, 'debug');
    // reserved for async setup
    this.b.logWithContext(this, 'init-complete', {}, 'debug');
  }

  async buildImportBlock(imports: string[] | null | undefined): Promise<CdFxReturn<string>> {
    this.b.logWithContext(this, 'buildImportBlock:start', { imports }, 'debug');

    if (!Array.isArray(imports)) {
      const msg = 'Invalid imports array provided';
      this.b.logWithContext(this, 'buildImportBlock:error', msg, 'error');
      return { state: CdFxStateLevel.Error, data: '', message: msg };
    }

    const block = imports.join('\n');
    this.b.logWithContext(this, 'buildImportBlock:complete', { block }, 'debug');
    return { state: CdFxStateLevel.Success, data: block };
  }

  async buildConstructorSnippet(
    type: 'controller' | 'service' | 'model',
  ): Promise<CdFxReturn<string>> {
    this.b.logWithContext(this, 'buildConstructorSnippet:start', { type }, 'debug');

    let constructorCode: string;
    let state: CdFxStateLevel = CdFxStateLevel.Success;

    switch (type) {
      case 'controller':
        constructorCode = `  constructor() {\n    // TODO: initialize controller\n  }`;
        break;
      case 'service':
        constructorCode = `  constructor() {\n    // TODO: initialize service\n  }`;
        break;
      case 'model':
        constructorCode = `  constructor(initData?: Partial<this>) {\n    Object.assign(this, initData);\n  }`;
        break;
      default:
        constructorCode = `  constructor() {}`;
        state = CdFxStateLevel.Warning;
        this.b.logWithContext(this, 'buildConstructorSnippet:warn', { type }, 'warn');
    }

    this.b.logWithContext(
      this,
      'buildConstructorSnippet:complete',
      { type, constructorCode },
      'debug',
    );
    return {
      state,
      data: constructorCode,
      message: state === CdFxStateLevel.Warning ? 'Unknown type fallback' : null,
    };
  }

  async buildMethodStubSnippets(
    type: 'controller' | 'service' | 'model',
    methods: FunctionDescriptor[],
    baseName: string,
    svGenComponentService: GenComponentService,
    artifactDescriptor: CdControllerDescriptor | CdServiceDescriptor,
  ): Promise<CdFxReturn<string[]>> {
    this.b.logWithContext(this, 'buildMethodStubSnippets:start', { type, methods }, 'debug');

    if (!Array.isArray(methods) || methods.length === 0) {
      const msg = 'No valid FunctionDescriptor array provided';
      this.b.logWithContext(this, 'buildMethodStubSnippets:error', msg, 'error');
      return { state: CdFxStateLevel.Error, data: [], message: msg };
    }

    const nameMap = svGenComponentService.prepareNameMap(baseName);

    const stubs = methods.map((method) => {
      this.b.logWithContext(this, 'buildMethodStubSnippets:method', { method }, 'debug');
      if (!method?.name) {
        this.b.logWithContext(this, 'buildMethodStubSnippets:skip-invalid', { method }, 'warn');
        return '';
      }

      // --- Fallback: generate generic stub ---
      const visibility = method.scope?.visibility || 'public';
      const isAsync = method.behavior?.isAsync || false;
      const returnsPromise = method.behavior?.returnsPromise || false;

      let visibilityPrefix = '';
      if (visibility === 'private' || visibility === 'protected') {
        visibilityPrefix = `${visibility} `;
      }

      // ✅ Fix Promise<Promise<...>> issue
      let returnType: string;
      if (returnsPromise) {
        if (method.output?.returnType?.startsWith('Promise')) {
          returnType = method.output.returnType;
        } else {
          returnType = `Promise<${method.output?.returnType || 'void'}>`;
        }
      } else {
        returnType = method.output?.returnType || 'void';
      }

      const asyncPrefix = isAsync ? 'async ' : '';

      // Handle parameters
      const params = method.parameters
        ? method.parameters.map((p) => `${p.name}: ${p.type}`).join(', ')
        : '';

      // ✅ Normalize method names to camelCase
      // const methodName = this.toCamelCase(method.name);

      let methodName = '';

      if (method.name !== 'constructor') {
        if (type === 'controller') {
          methodName = this.toPascalCase(method.name);
        }

        if (type === 'service') {
          methodName = this.toCamelCase(method.name);
        }
      }

      if (method.name === 'constructor') {
        methodName = method.name;
      }

      if (methodName === 'constructor') {
        // Constructor special case
        return (
          `  // <<cd:method:constructor:start>>\n` +
          `  constructor(${params}) {\n    // TODO: implement\n  }\n` +
          `  // <<cd:method:constructor:end>>`
        );
      } else {
        return (
          `  // <<cd:method:${methodName}:start>>\n` +
          `  ${visibilityPrefix}${asyncPrefix}${methodName}(${params}): ${returnType} {\n    // TODO: implement\n  }\n` +
          `  // <<cd:method:${methodName}:end>>`
        );
      }
    });

    this.b.logWithContext(this, 'buildMethodStubSnippets:stubs', { stubs }, 'debug');
    return { state: CdFxStateLevel.Success, data: stubs };
  }

  // --- helpers ---

  private toPascalCase(str: string): string {
    this.b.logWithContext(this, 'toPascalCase:start', { input: str }, 'debug');
    if (typeof str !== 'string' || str.length === 0) {
      this.b.logWithContext(this, 'toPascalCase:error', { input: str }, 'error');
      return '';
    }
    const result = str.charAt(0).toUpperCase() + str.slice(1);
    this.b.logWithContext(this, 'toPascalCase', { input: str, output: result }, 'debug');
    return result;
  }

  async buildClass(
    className: string | null | undefined,
    attributes: ComponentAttributes[] | null | undefined,
    // constructorCode: string,
    methods: string[] | null | undefined,
  ): Promise<CdFxReturn<string>> {
    this.b.logWithContext(this, 'buildClass:start', { className, attributes, methods }, 'debug');

    if (!className || typeof className !== 'string') {
      const msg = 'Invalid className provided';
      this.b.logWithContext(this, 'buildClass:error', msg, 'error');
      return { state: CdFxStateLevel.Error, data: '', message: msg };
    }
    const safeAttributes = Array.isArray(attributes) ? this.formatAttributes(attributes) : [];

    this.b.logWithContext(this, `TemplateSnippetService::buildClass()/safeAttributes:`, {safeAttributes}, 'debug')

    // Filter out any constructor entries from the methods array
    const safeMethods = Array.isArray(methods)
      ? methods.filter((method) => !method.trim().startsWith('constructor('))
      : [];
    this.b.logWithContext(this, 'buildClass:safeMethods', { safeMethods }, 'debug');
    const lines: string[] = [];
    lines.push(`export class ${className} {`);

    if (safeAttributes.length > 0) {
      lines.push(safeAttributes.join('\n'));
      lines.push('');
    }

    // if (constructorCode) {
    //   lines.push(constructorCode);
    //   lines.push('');
    // }

    if (safeMethods.length > 0) {
      lines.push(safeMethods.join('\n\n'));
    }

    lines.push('}');
    const code = lines.join('\n');
    this.b.logWithContext(this, 'buildClass:complete', { className, code }, 'debug');
    return { state: CdFxStateLevel.Success, data: code };
  }

  
  private formatAttributes(attributes: ComponentAttributes[]): string[] {
    return attributes.map((attr) => {
      this.b.logWithContext(this, 'formatAttributes:attr', { attr }, 'debug');

      let attrString = '';

      if (attr.visibility) {
        attrString += `${attr.visibility} `;
      }

      attrString += `${attr.name}`;

      // rules special-case (cRules, uRules, dRules …)
      const isRule =
        typeof attr.name === 'string' &&
        (attr.name.endsWith('Rules') || ['cRules', 'uRules', 'dRules'].includes(attr.name));

      if (attr.type) {
        attrString += `: ${isRule ? 'any' : attr.type}`;
      }

      // assign values
      if (attr.value !== undefined) {
        attrString += ` = ${JSON.stringify(attr.value)}`;
      } else if (attr.defaultValue !== undefined) {
        if (isRule && typeof attr.defaultValue === 'object') {
          // pretty-print the rules object
          const formattedObj = JSON.stringify(attr.defaultValue, null, 2)
            .replace(/"([^"]+)":/g, '$1:') // remove quotes from keys
            .replace(/"/g, `'`); // convert " → '
          attrString += ` = ${formattedObj}`;
        } else {
          attrString += ` = ${JSON.stringify(attr.defaultValue)}`;
        }
      }

      attrString += ';';

      if (attr.isDependency) {
        attrString = `\n  ${attrString}`;
      }

      return `  ${attrString}`;
    });
  }

  private buildClassHeader(nameMap: any, type: string) {
    return `export class ${nameMap.Abcd}${toPascalCase(type)} {`;
  }

  private toCamelCase(str: string): string {
    this.b.logWithContext(this, 'toCamelCase:start', { input: str }, 'debug');
    if (typeof str !== 'string' || str.length === 0) {
      this.b.logWithContext(this, 'toCamelCase:error', { input: str }, 'error');
      return '';
    }
    // Convert first character to lowercase and keep the rest as is
    const result = str.charAt(0).toLowerCase() + str.slice(1);
    this.b.logWithContext(this, 'toCamelCase', { input: str, output: result }, 'debug');
    return result;
  }
}
