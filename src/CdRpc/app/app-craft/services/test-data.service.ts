import { BaseService } from '../../../sys/base/base.service';
import { CdControllerDescriptor, CdModelDescriptor } from '../../../sys/dev-descriptor/index';
import { toCamelCase, toPascalCase } from '../../../sys/utils/cd-naming.util';

export class TestDataService {
  b = new BaseService();
  constructor(private moduleName: string) {}

  // generateValue(controllerName: string, field: any, variant: 'create' | 'update' = 'create'): any {
  //   switch (field.type) {
  //     case 'string':
  //       return `Test_${this.moduleName}_${controllerName}_${toPascalCase(field.name)}${variant === 'update' ? '_Updated' : ''}`;
  //     case 'boolean':
  //       return variant === 'update' ? false : true;
  //     case 'number':
  //       return variant === 'update' ? 2 : 1;
  //     case 'guid':
  //       return `00000000-0000-0000-0000-${this.moduleName.substring(0, 12)}`;
  //     case 'date':
  //       return variant === 'update' ? '2025-12-31T23:59:59Z' : '2025-01-01T00:00:00Z';
  //     default:
  //       return null;
  //   }
  // }

  generateValue(
    controllerName: string,
    field: any,
    variant: 'create' | 'update' = 'create',
    randomize: boolean = false,
  ): any {
    switch (field.type) {
      case 'string': {
        let baseVal = `Test_${this.moduleName}_${controllerName}_${toPascalCase(field.name)}${
          variant === 'update' ? '_Updated' : ''
        }`;

        if (randomize) {
          const rand = Math.random().toString(36).substring(2, 7); // 5-char random string
          baseVal += `_${rand}`;
        }

        return baseVal;
      }
      case 'boolean':
        return variant === 'update' ? false : true;
      case 'number':
        return variant === 'update' ? 2 : 1;
      case 'guid':
        return `00000000-0000-0000-0000-${this.moduleName.substring(0, 12)}`;
      case 'date':
        return variant === 'update' ? '2025-12-31T23:59:59Z' : '2025-01-01T00:00:00Z';
      default:
        return null;
    }
  }

  buildCreateData(c: CdControllerDescriptor, model: CdModelDescriptor): Record<string, any> {
    this.b.logWithContext(
      this,
      'buildCreateData:start',
      { controller: c.name, model: model.name },
      'debug',
    );
    const data: Record<string, any> = {};
    model.fields.forEach((f) => {
      if (f.primary || f.autoIncrement) return;
      data[f.name] = this.generateValue(c.name, f, 'create',true);
    });
    return data;
  }

  buildUpdateData(
    c: CdControllerDescriptor,
    model: CdModelDescriptor,
  ): { update: any; where: any } {
    const updatable = model.fields.find((f) => f.type === 'string'); // heuristic
    const idField = model.fields.find((f) => f.primary || f.name.toLowerCase().endsWith('id'));
    return {
      update: {
        [updatable?.name ?? model.fields[0].name]: this.generateValue(
          c.name,
          updatable ?? model.fields[0],
          'update',
        ),
      },
      where: {
        [idField?.name ?? `${toCamelCase(c.name)}Id`]: 1, // predictable id
      },
    };
  }

  buildDeleteWhere(c: CdControllerDescriptor, model: CdModelDescriptor): Record<string, any> {
    const idField = model.fields.find((f) => f.primary || f.name.toLowerCase().endsWith('id'));
    return {
      [idField?.name ?? `${toCamelCase(c.name)}Id`]: 1,
    };
  }
}
