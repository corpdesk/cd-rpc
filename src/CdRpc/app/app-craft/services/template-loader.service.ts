import * as ts from 'typescript';
import * as fs from 'fs';
import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/i-base';
import { cdFx } from '../../../sys/base/cd-fx-return.util';

// export interface ParsedTemplate {
//   className: string;
//   methods: TemplateMethod[];
// }

// export interface TemplateMethod {
//   name: string;
//   code: string;
// }

// export class TemplateLoaderService {
//   templateDir: string = '';

//   constructor() {}

//   init(tempDir: string): CdFxReturn<void> {
//     this.templateDir = tempDir;
//     return cdFx(CdFxStateLevel.Success, 'Template directory initialized');
//   }

//   async load(filePath: string): Promise<CdFxReturn<ParsedTemplate|null>> {
//     try {
//       // const filePath = `${this.templateDir}/${templateName}.ts`;
//       const code = await fs.readFileSync(filePath, 'utf-8');

//       const sourceFile = await ts.createSourceFile(filePath, code, ts.ScriptTarget.ESNext, true);

//       const methods: TemplateMethod[] = [];
//       let className = '';

//       ts.forEachChild(sourceFile, (node) => {
//         if (ts.isClassDeclaration(node) && node.name) {
//           className = node.name.text;

//           node.members.forEach((member) => {
//             if (ts.isMethodDeclaration(member) && member.name) {
//               const methodName = member.name.getText(sourceFile);
//               const methodCode = code.substring(member.pos, member.end).trim();

//               methods.push({ name: methodName, code: methodCode });
//             }
//           });
//         }
//       });

//       return cdFx(CdFxStateLevel.Success, 'Template loaded successfully', {
//         className,
//         methods,
//       });
//     } catch (err: any) {
//       return cdFx(CdFxStateLevel.SystemError, `Failed to load template: ${err.message}`, null);
//     }
//   }
// }

export interface ParsedTemplate {
  className: string;
  methods: TemplateMethod[];
}

export interface TemplateMethod {
  name: string;
  code: string;
}

export class TemplateLoaderService {
  templateDir: string = '';

  constructor() {}

  init(tempDir: string): CdFxReturn<void> {
    this.templateDir = tempDir;
    return cdFx(CdFxStateLevel.Success, 'Template directory initialized');
  }

  async load(filePath: string): Promise<CdFxReturn<ParsedTemplate | null>> {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');

      const sourceFile = ts.createSourceFile(
        filePath,
        code,
        ts.ScriptTarget.ESNext,
        true
      );

      const methods: TemplateMethod[] = [];
      let className = '';

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name) {
          className = node.name.text;

          node.members.forEach((member) => {
            // Handle constructor
            if (ts.isConstructorDeclaration(member)) {
              const ctorCode = code.substring(member.pos, member.end).trim();
              methods.push({ name: 'constructor', code: ctorCode });
            }

            // Handle regular/async methods
            if (ts.isMethodDeclaration(member) && member.name) {
              const methodName = member.name.getText(sourceFile);
              const methodCode = code.substring(member.pos, member.end).trim();
              methods.push({ name: methodName, code: methodCode });
            }
          });
        }
      });

      return cdFx(CdFxStateLevel.Success, 'Template loaded successfully', {
        className,
        methods,
      });
    } catch (err: any) {
      return cdFx(
        CdFxStateLevel.SystemError,
        `Failed to load template: ${err.message}`,
        null
      );
    }
  }
}
