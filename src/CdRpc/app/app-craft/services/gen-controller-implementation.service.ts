import { BaseService } from '../../../sys/base/base.service';
import {
  ParsedTemplate,
  TemplateLoaderService,
  TemplateMethod,
} from './template-loader.service';
import {
  CdControllerDescriptor,
  CdModuleDescriptor,
  CdServiceDescriptor,
} from '../../../sys/dev-descriptor/index.js';
import { FunctionDescriptor } from '../../../sys/dev-descriptor/models/function-descriptor.model.js';
import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/i-base';
import { cdFx } from '../../../sys/base/cd-fx-return.util.js';
import { GenComponentService } from './gen-component.service';
import * as recast from 'recast';
import { namedTypes as n } from 'ast-types';
import { toCamelCase } from '../../../sys/utils/cd-naming.util.js';

export class GenControllerImplementationService {
  private readonly templateLoader = new TemplateLoaderService();
  private b = new BaseService();
  templateDir = '';

  constructor() {}

  init(tempDir: string): CdFxReturn<void> {
    this.templateDir = tempDir;
    this.templateLoader.init(tempDir);
    return cdFx(CdFxStateLevel.Success, 'GenControllerImplementationService initialized');
  }

  async implementMethods(
    descriptor: CdControllerDescriptor | CdServiceDescriptor,
    template: ParsedTemplate,
    finalCode: string,
    moduleDescriptor: CdModuleDescriptor,
    svGenComponentService: GenComponentService, // injected dependency
  ): Promise<CdFxReturn<string>> {
    this.b.logWithContext(this, 'implementMethods:start', {}, 'debug');
    // this.b.logWithContext(this, 'implementMethods:finalCode', { finalCode }, 'debug');
    // this.b.logWithContext(this, 'implementMethods:template', { template }, 'debug');

    const methods = descriptor?.methods || [];
    if (!Array.isArray(methods) || methods.length === 0) {
      const msg = 'No valid FunctionDescriptor array provided';
      this.b.logWithContext(this, 'implementMethods:error', msg, 'error');
      return { state: CdFxStateLevel.Error, data: finalCode, message: msg };
    }

    let updatedContent = finalCode;

    // --- Auditing ---
    let foundCount = 0;
    let replacedCount = 0;
    let orphanedCount = 0;
    const missing: string[] = [];

    // Prepare name substitution map (e.g., Abcd → User, abcd → user, etc.)
    const nameMap = svGenComponentService.prepareNameMap(descriptor.name);
    // this.b.logWithContext(this, 'implementMethods:nameMap', { nameMap }, 'debug');

    // --- Process each method ---
    methods.forEach((method) => {
      const methodName = method.name;
      // this.b.logWithContext(this, 'implementMethods:methodName1', { methodName }, 'debug');

      const startMarker = `// <<cd:method:${methodName}:start>>`;
      const endMarker = `// <<cd:method:${methodName}:end>>`;

      const startIdx = updatedContent.indexOf(startMarker);
      const endIdx = updatedContent.indexOf(endMarker);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        foundCount++;

        const before = updatedContent.substring(0, startIdx + startMarker.length);
        const after = updatedContent.substring(endIdx);

        // this.b.logWithContext(this, 'implementMethods:methodName2', { methodName }, 'debug');

        // Look up template method (after applying name map to align template names)
        const templateMethod = template.methods.find((m) => {
          // this.b.logWithContext(this, 'implementMethods:m.name', { mName: m.name }, 'debug');
          const mappedName = svGenComponentService.applyNameMap(m.name, nameMap);
          // this.b.logWithContext(this, 'implementMethods:mappedName', { mName: m.name, mappedName }, 'debug');
          // this.b.logWithContext(this, 'implementMethods:methodName3', { methodName }, 'debug');
          return mappedName === methodName;
        });

        if (templateMethod) {
          // 🔥 Apply substitution to the method code
          let impl = svGenComponentService.applyNameMap(templateMethod.code, nameMap);
          // 🚑 Fix unintended "TypeViewModel" → "ViewModel"
          impl = impl.replace(/TypeViewModel/g, 'ViewModel');
          // this.b.logWithContext(
          //   this,
          //   'implementMethods:descriptor.name',
          //   { name: descriptor.name },
          //   'debug',
          // );
          // this.b.logWithContext(this, 'implementMethods:impl', { impl }, 'debug');

          // 🔥 Replace only the code between markers
          updatedContent = before + '\n' + impl + '\n' + after;
          replacedCount++;
        } else {
          missing.push(methodName);
        }
      } else {
        missing.push(methodName);
      }
    });

    // --- Detect orphaned stubs ---
    const orphanRegex = /\/\/ <<cd:method:([a-zA-Z0-9_]+):start>>/g;
    const allMatches = [...updatedContent.matchAll(orphanRegex)].map((m) => m[1]);
    orphanedCount = allMatches.filter((m) => !methods.some((desc) => desc.name === m)).length;

    // --- Log audit ---
    const auditSummary = {
      totalDeclared: methods.length,
      foundCount,
      replacedCount,
      orphanedCount,
      missing,
    };
    this.b.logWithContext(
      this,
      'implementMethods:audit',
      { descriptorName: descriptor.name, auditSummary },
      'info',
    );

    return { state: CdFxStateLevel.Success, data: updatedContent };
  }

  private normalizeTemplateName(name: string): string {
    // Use a case-insensitive global regex to replace placeholders.
    // This preserves the casing of the original method name (e.g., 'Create').
    this.b.logWithContext(this, 'normalizeTemplateName:name', name, 'debug');
    const ret = name.replace(/usage|log|abcd/gi, '');
    this.b.logWithContext(this, 'normalizeTemplateName:ret', ret, 'debug');
    return ret;
  }

  // /**
  //  * Helper: Prepares a map of all possible normalized versions of a method name,
  //  * including different casing conventions.
  //  */
  private prepareNormalizedNameMap(baseName: string | undefined): Set<string> {
    const svGenComponentService = new GenComponentService();
    const names = new Set<string>();
    if (!baseName) return names;

    // Use prepareNameMap to get all casing variants.
    const nameMap = svGenComponentService.prepareNameMap(baseName);

    // Normalize each variant and add it to a Set for quick lookups.
    Object.values(nameMap).forEach((name) => {
      // Strips 'usage' and 'log' and converts to lowercase.
      names.add(this.normalizeTemplateName(name));
    });
    this.b.logWithContext(this, 'prepareNormalizedNameMap:names', { names }, 'debug');
    return names;
  }

  private adaptTemplateMethod(
    tmplMethod: TemplateMethod,
    descriptor: CdControllerDescriptor,
    method: FunctionDescriptor,
  ): string {
    this.b.logWithContext(this, 'adaptTemplateMethod:trail', '01', 'debug');
    let code = tmplMethod.code;

    // Replace entity names (Abcd → target controller name, e.g. CdAi)
    code = code.replace(/Abcd/g, descriptor.name.replace('Cd', 'CdAi'));

    // Replace parameter names and DTO types
    method.parameters?.forEach((p) => {
      code = code.replace(/CreateAbcdDto/g, p.type);
      code = code.replace(new RegExp(`\\b${p.name}\\b`, 'g'), p.name);
    });

    // Apply annotations/decorators if defined
    if (method.annotations?.length) {
      const decorators = method.annotations.join('\n');
      code = `${decorators}\n${code}`;
    }
    this.b.logWithContext(this, 'adaptTemplateMethod:code', code, 'debug');
    return code;
  }

  private generateFallbackMethod(method: FunctionDescriptor): string {
    this.b.logWithContext(this, 'generateFallbackMethod:trail', '01', 'debug');
    const asyncPrefix = method.behavior?.isAsync ? 'async ' : '';
    const params =
      method.parameters?.map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ') ||
      '';
    const returnType = method.output?.returnType || 'void';

    // Use API metadata if available
    const route = method.apiInfo?.route
      ? `@${method.apiInfo.method || 'Post'}('${method.apiInfo.route}')`
      : '@Post()';

    return `
      ${route}
      ${asyncPrefix}${method.name}(${params}): ${returnType} {
        // TODO: implement - ${method.output?.description || 'no description'}
      }
    `;
  }
}
