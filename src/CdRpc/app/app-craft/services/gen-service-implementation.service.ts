import { CdServiceDescriptor } from '../../../sys/dev-descriptor/index.js';
import { ParsedTemplate, TemplateMethod } from './template-loader.service.js';
import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/i-base.js';
import { cdFx } from '../../../sys/base/cd-fx-return.util.js';
import { FunctionDescriptor } from '../../../sys/dev-descriptor/models/function-descriptor.model.js';
import { BaseService } from '../../../sys/base/base.service.js';

export class GenServiceImplementationService {
  b = new BaseService();
  constructor() {}

  /**
   * Injects method implementations for a Service component
   */
  implementMethods(
    descriptor: CdServiceDescriptor,
    template: ParsedTemplate,
  ): CdFxReturn<string[]> {
    // this.b.logWithContext(
    //   this,
    //   'service/implementMethods:start',
    //   { descriptor, template },
    //   'debug',
    // );
    // this.b.logWithContext(this, 'service/implementMethods:trail', '01', 'debug');
    if (!descriptor.methods) {
      // this.b.logWithContext(this, 'service/implementMethods:trail', '02', 'error');
      return cdFx(CdFxStateLevel.Warning, 'No methods in descriptor', []);
    }

    const methods = descriptor.methods.map((method) => {
      // this.b.logWithContext(this, 'service/implementMethods:trail', '03', 'debug');
      const tmplMethod = this.findTemplateMatch(method, template);

      if (tmplMethod) {
        // this.b.logWithContext(this, 'service/implementMethods:trail', '04', 'debug');
        return this.adaptTemplateMethod(tmplMethod, descriptor, method);
      } else {
        // this.b.logWithContext(this, 'service/implementMethods:trail', '05', 'debug');
        return this.generateFallbackMethod(method);
      }
    });
    // this.b.logWithContext(this, 'service/implementMethods:trail', '06', 'debug');
    return cdFx(CdFxStateLevel.Success, 'Service methods implemented successfully', methods);
  }

  /**
   * Try to find a matching template method by normalized name
   */
  private findTemplateMatch(
    method: FunctionDescriptor,
    template: ParsedTemplate,
  ): TemplateMethod | undefined {
    this.b.logWithContext(this, 'service/findTemplateMatch:trail', '01', 'debug');
    // this.b.logWithContext(this, 'service/method', method, 'debug');
    // this.b.logWithContext(this, 'service/template.methods', template.methods, 'debug');
    const targetName = this.normalizeName(method.name ?? '');
    return template.methods.find((m) => this.normalizeName(m.name) === targetName);
  }

  /**
   * Normalize names for matching
   */
  private normalizeName(name: string): string {
    return name.toLowerCase().replace(/_/g, '');
  }

  /**
   * Adapt a template method into the service’s context
   */
  private adaptTemplateMethod(
    tmplMethod: TemplateMethod,
    descriptor: CdServiceDescriptor,
    method: FunctionDescriptor,
  ): string {
    let code = tmplMethod.code;

    // Replace generic entity name (Abcd) with real service name
    code = code.replace(/Abcd/g, descriptor.name.replace(/^Cd/, 'CdAi'));

    // Replace DTOs or Models in parameters
    method.parameters?.forEach((p) => {
      if (p.type) {
        code = code.replace(/AbcdModel/g, p.type); // model references
        code = code.replace(/CreateAbcdDto/g, p.type); // in case DTO-like
      }
    });

    return code;
  }

  /**
   * Generate a fallback stub when no template match is found
   */
  private generateFallbackMethod(method: FunctionDescriptor): string {
    const asyncPrefix = method.behavior?.isAsync ? 'async ' : '';
    const params =
      method.parameters
        ?.map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type || 'any'}`)
        .join(', ') || '';
    const returnType = method.output?.returnType || 'void';

    return `
      ${asyncPrefix}${method.name}(${params}): ${returnType} {
        // TODO: implement service logic for ${method.name}
      }
    `;
  }
}
