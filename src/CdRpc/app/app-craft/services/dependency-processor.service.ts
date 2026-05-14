import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/i-base';
import { BaseService } from '../../../sys/base/base.service';
import {
  AppType,
  CdCtx,
  CdModuleDescriptor,
  DependencyDescriptor,
} from '../../../sys/dev-descriptor/index.js';

export class DependencyProcessorService {
  b = new BaseService();

  async init(): Promise<void> {
    this.b.logWithContext(this, 'init-start', {}, 'debug');
    // reserved for any async setup
    this.b.logWithContext(this, 'init-complete', {}, 'debug');
  }

  // async classifyImport(
  //   importPath: string | null | undefined,
  //   importedSymbols: string[] | null | undefined,
  //   moduleDescriptor: CdModuleDescriptor | null | undefined,
  //   appType: AppType,
  // ): Promise<CdFxReturn<DependencyDescriptor>> {
  //   this.b.logWithContext(
  //     this,
  //     'classifyImport:start',
  //     { importPath, importedSymbols, appType },
  //     'debug',
  //   );

  //   // --- Input Validation ---
  //   if (!importPath || typeof importPath !== 'string') {
  //     const msg = 'Invalid importPath provided';
  //     this.b.logWithContext(this, 'classifyImport:error', msg, 'error');
  //     return { state: CdFxStateLevel.Error, data: null, message: msg };
  //   }

  //   if (!Array.isArray(importedSymbols)) {
  //     const msg = 'Invalid importedSymbols provided';
  //     this.b.logWithContext(this, 'classifyImport:error', msg, 'error');
  //     return { state: CdFxStateLevel.Error, data: null, message: msg };
  //   }

  //   let result: DependencyDescriptor;

  //   try {
  //     // --- Classify NPM Library ---
  //     if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
  //       result = {
  //         name: importPath,
  //         category: 'library',
  //         source: 'npm',
  //         scope: 'module',
  //         targetApp: appType,
  //         isCdModule: false,
  //         resolution: { method: 'import', path: importPath },
  //         usage: { modulesUsed: importedSymbols },
  //       };
  //       this.b.logWithContext(this, 'classifyImport:library', result, 'debug');
  //       return { state: CdFxStateLevel.Success, data: result };
  //     }

  //     // --- Classify Core ---
  //     if (importPath.includes('/base/')) {
  //       result = {
  //         name: importPath,
  //         category: 'core',
  //         source: 'local',
  //         scope: 'module',
  //         targetApp: appType,
  //         cdCtx: CdCtx.Sys,
  //         isCdModule: false,
  //         resolution: { method: 'import', path: this.cleanPath(importPath) },
  //         usage: { classesUsed: importedSymbols },
  //       };
  //       this.b.logWithContext(this, 'classifyImport:core', result, 'debug');
  //       return { state: CdFxStateLevel.Success, data: result };
  //     }

  //     // --- Classify Utility ---
  //     if (importPath.includes('/utils/')) {
  //       result = {
  //         name: importPath,
  //         category: 'utility',
  //         source: 'local',
  //         scope: 'module',
  //         targetApp: appType,
  //         cdCtx: CdCtx.Sys,
  //         isCdModule: false,
  //         resolution: { method: 'import', path: this.cleanPath(importPath) },
  //         usage: { classesUsed: importedSymbols },
  //       };
  //       this.b.logWithContext(this, 'classifyImport:utility', result, 'debug');
  //       return { state: CdFxStateLevel.Success, data: result };
  //     }

  //     // --- Classify Custom ---
  //     if (moduleDescriptor) {
  //       result = {
  //         name: moduleDescriptor.name,
  //         category: 'custom',
  //         source: 'local',
  //         scope: 'module',
  //         targetApp: appType,
  //         cdCtx: moduleDescriptor.ctx,
  //         isCdModule: true,
  //         resolution: { method: 'import', path: this.cleanPath(importPath) },
  //         usage: { classesUsed: importedSymbols },
  //       };
  //       this.b.logWithContext(this, 'classifyImport:custom', result, 'debug');
  //       return { state: CdFxStateLevel.Success, data: result };
  //     }

  //     // --- Unknown Case ---
  //     result = {
  //       name: importPath,
  //       category: 'unknown',
  //       source: 'local',
  //       scope: 'unknown',
  //       targetApp: appType,
  //       isCdModule: false,
  //       resolution: { method: 'import', path: this.cleanPath(importPath) },
  //       usage: { modulesUsed: importedSymbols },
  //     };
  //     this.b.logWithContext(this, 'classifyImport:unknown', result, 'warn');
  //     return { state: CdFxStateLevel.Warning, data: result, message: 'Classified as unknown' };
  //   } catch (err: any) {
  //     const msg = `Exception in classifyImport: ${err.message || err}`;
  //     this.b.logWithContext(this, 'classifyImport:exception', msg, 'error');
  //     return { state: CdFxStateLevel.SystemError, data: null, message: msg };
  //   }
  // }
  async classifyImport(
    dependencyDescriptor: DependencyDescriptor | null | undefined,
    moduleDescriptor: CdModuleDescriptor | null | undefined,
    appType: AppType,
  ): Promise<CdFxReturn<DependencyDescriptor>> {
    // this.b.logWithContext(this, 'classifyImport:start', { dependencyDescriptor, appType }, 'debug');

    // --- Input Validation ---
    if (!dependencyDescriptor) {
      const msg = 'No dependency descriptor provided';
      this.b.logWithContext(this, 'classifyImport:error', msg, 'error');
      return { state: CdFxStateLevel.Error, data: null, message: msg };
    }

    const importPath = dependencyDescriptor.resolution?.path;
    const importedSymbols =
      dependencyDescriptor.usage?.modulesUsed ?? dependencyDescriptor.usage?.classesUsed ?? [];

    if (!importPath || typeof importPath !== 'string') {
      const msg = 'Invalid or missing resolution.path in dependencyDescriptor';
      this.b.logWithContext(this, 'classifyImport:error', msg, 'error');
      return { state: CdFxStateLevel.Error, data: null, message: msg };
    }

    if (!Array.isArray(importedSymbols)) {
      const msg = 'Invalid or missing usage symbols in dependencyDescriptor';
      this.b.logWithContext(this, 'classifyImport:error', msg, 'error');
      return { state: CdFxStateLevel.Error, data: null, message: msg };
    }

    let result: DependencyDescriptor;

    try {
      // --- Classify NPM Library ---
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        result = {
          ...dependencyDescriptor,
          name: importPath,
          category: 'library',
          source: 'npm',
          scope: 'module',
          targetApp: appType,
          isCdModule: false,
          resolution: { method: 'import', path: importPath },
          usage: { modulesUsed: importedSymbols },
        };
        // this.b.logWithContext(this, 'classifyImport:library', result, 'debug');
        return { state: CdFxStateLevel.Success, data: result };
      }

      // --- Classify Core ---
      if (importPath.includes('/base/')) {
        result = {
          ...dependencyDescriptor,
          category: 'core',
          source: 'local',
          scope: 'module',
          targetApp: appType,
          cdCtx: CdCtx.Sys,
          isCdModule: false,
          resolution: { method: 'import', path: this.cleanPath(importPath) },
          usage: { classesUsed: importedSymbols },
        };
        // this.b.logWithContext(this, 'classifyImport:core', result, 'debug');
        return { state: CdFxStateLevel.Success, data: result };
      }

      // --- Classify Utility ---
      if (importPath.includes('/utils/')) {
        result = {
          ...dependencyDescriptor,
          category: 'utility',
          source: 'local',
          scope: 'module',
          targetApp: appType,
          cdCtx: CdCtx.Sys,
          isCdModule: false,
          resolution: { method: 'import', path: this.cleanPath(importPath) },
          usage: { classesUsed: importedSymbols },
        };
        this.b.logWithContext(this, 'classifyImport:utility', result, 'debug');
        return { state: CdFxStateLevel.Success, data: result };
      }

      // --- Classify Custom ---
      if (moduleDescriptor) {
        result = {
          ...dependencyDescriptor,
          name: moduleDescriptor.name,
          category: 'custom',
          source: 'local',
          scope: 'module',
          targetApp: appType,
          cdCtx: moduleDescriptor.ctx,
          isCdModule: true,
          resolution: { method: 'import', path: this.cleanPath(importPath) },
          usage: { classesUsed: importedSymbols },
        };
        // this.b.logWithContext(this, 'classifyImport:custom', result, 'debug');
        return { state: CdFxStateLevel.Success, data: result };
      }

      // --- Unknown Case ---
      result = {
        ...dependencyDescriptor,
        category: 'unknown',
        source: 'local',
        scope: 'unknown',
        targetApp: appType,
        isCdModule: false,
        resolution: { method: 'import', path: this.cleanPath(importPath) },
        usage: { modulesUsed: importedSymbols },
      };
      this.b.logWithContext(this, 'classifyImport:unknown', result, 'warn');
      return {
        state: CdFxStateLevel.Warning,
        data: result,
        message: 'Classified as unknown',
      };
    } catch (err: any) {
      const msg = `Exception in classifyImport: ${err.message || err}`;
      this.b.logWithContext(this, 'classifyImport:exception', msg, 'error');
      return { state: CdFxStateLevel.SystemError, data: null, message: msg };
    }
  }

  private cleanPath(p: string): string {
    const cleaned = p.replace(/(\.ts|\.js)$/, '');
    // this.b.logWithContext(this, 'cleanPath', { input: p, output: cleaned }, 'debug');
    return cleaned;
  }
}
