import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/i-base.js';
import { BaseService } from '../../../sys/base/base.service.js';

export class PreWriteValidatorService {
  b = new BaseService();

  async init(): Promise<void> {
    this.b.logWithContext(this, 'init-start', {}, 'debug');
    // reserved for async setup
    this.b.logWithContext(this, 'init-complete', {}, 'debug');
  }

  async validateStructure(code: string | null | undefined): Promise<CdFxReturn<string[]>> {
    this.b.logWithContext(
      this,
      'validateStructure:start',
      { codeSnippet: code?.slice(0, 80) },
      'debug',
    );

    if (!code || typeof code !== 'string') {
      const msg = 'Invalid code input provided to validateStructure';
      this.b.logWithContext(this, 'validateStructure:error', { msg }, 'error');
      return { state: CdFxStateLevel.Error, data: [], message: msg };
    }

    const errors: string[] = [];

    if (!/class\s+\w+/.test(code)) {
      errors.push('Missing class declaration');
      this.b.logWithContext(
        this,
        'validateStructure:error',
        { issue: 'Missing class declaration' },
        'warn',
      );
    }
    if (!/export\s+class/.test(code)) {
      errors.push('Class must be exported');
      this.b.logWithContext(
        this,
        'validateStructure:error',
        { issue: 'Class must be exported' },
        'warn',
      );
    }

    const state = errors.length ? CdFxStateLevel.Warning : CdFxStateLevel.Success;
    this.b.logWithContext(this, 'validateStructure:complete', { errors }, 'debug');
    return { state, data: errors };
  }

  async validateCasing(code: string | null | undefined): Promise<CdFxReturn<string[]>> {
    this.b.logWithContext(
      this,
      'validateCasing:start',
      { codeSnippet: code?.slice(0, 80) },
      'debug',
    );

    if (!code || typeof code !== 'string') {
      const msg = 'Invalid code input provided to validateCasing';
      this.b.logWithContext(this, 'validateCasing:error', { msg }, 'error');
      return { state: CdFxStateLevel.Error, data: [], message: msg };
    }

    const errors: string[] = [];

    if (/class\s+[a-z]/.test(code)) {
      errors.push('Class names must be PascalCase');
      this.b.logWithContext(
        this,
        'validateCasing:error',
        { issue: 'Class names must be PascalCase' },
        'warn',
      );
    }
    if (/function\s+[A-Z]/.test(code)) {
      errors.push('Function names must be camelCase');
      this.b.logWithContext(
        this,
        'validateCasing:error',
        { issue: 'Function names must be camelCase' },
        'warn',
      );
    }

    const state = errors.length ? CdFxStateLevel.Warning : CdFxStateLevel.Success;
    this.b.logWithContext(this, 'validateCasing:complete', { errors }, 'debug');
    return { state, data: errors };
  }

  /**
   * Auto-correct common validation errors based on RFC-0001 rules.
   */
  async autoCorrect(
    code: string | null | undefined,
    errors: string[],
  ): Promise<CdFxReturn<string>> {
    this.b.logWithContext(
      this,
      'autoCorrect:start',
      { errors, codeSnippet: code?.slice(0, 80) },
      'debug',
    );

    if (!code || typeof code !== 'string') {
      const msg = 'Invalid code input provided to autoCorrect';
      this.b.logWithContext(this, 'autoCorrect:error', { msg }, 'error');
      return { state: CdFxStateLevel.Error, data: '', message: msg };
    }

    let fixed = code;
    let correctionsApplied = false;

    for (const error of errors) {
      if (error.includes('Missing class declaration')) {
        fixed += `\n\nexport class Placeholder {}`;
        correctionsApplied = true;
        this.b.logWithContext(
          this,
          'autoCorrect:fix',
          { issue: error, action: 'Added Placeholder class' },
          'warn',
        );
      }
      if (error.includes('Class must be exported')) {
        fixed = fixed.replace(/class\s+(\w+)/, 'export class $1');
        correctionsApplied = true;
        this.b.logWithContext(
          this,
          'autoCorrect:fix',
          { issue: error, action: 'Ensured class is exported' },
          'warn',
        );
      }
      if (error.includes('Class names must be PascalCase')) {
        fixed = fixed.replace(/class\s+([a-z]\w*)/g, (_, name) => {
          const corrected = this.toPascalCase(name);
          correctionsApplied = true;
          this.b.logWithContext(
            this,
            'autoCorrect:fix',
            { issue: error, original: name, corrected },
            'warn',
          );
          return `class ${corrected}`;
        });
      }
      if (error.includes('Function names must be camelCase')) {
        fixed = fixed.replace(/function\s+([A-Z]\w*)/g, (_, name) => {
          const corrected = this.toCamelCase(name);
          correctionsApplied = true;
          this.b.logWithContext(
            this,
            'autoCorrect:fix',
            { issue: error, original: name, corrected },
            'warn',
          );
          return `function ${corrected}`;
        });
      }
    }

    this.b.logWithContext(
      this,
      'autoCorrect:complete',
      { fixedSnippet: fixed.slice(0, 120) },
      'debug',
    );

    return {
      state: correctionsApplied ? CdFxStateLevel.PartialSuccess : CdFxStateLevel.Success,
      data: fixed,
      message: correctionsApplied
        ? 'Code corrected based on validation errors'
        : 'No corrections needed',
    };
  }

  // --- helpers ---
  private toPascalCase(str: string): string {
    const result = str.charAt(0).toUpperCase() + str.slice(1);
    this.b.logWithContext(this, 'toPascalCase', { input: str, output: result }, 'debug');
    return result;
  }

  private toCamelCase(str: string): string {
    const result = str.charAt(0).toLowerCase() + str.slice(1);
    this.b.logWithContext(this, 'toCamelCase', { input: str, output: result }, 'debug');
    return result;
  }
}
