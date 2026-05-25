import { promises as fs } from 'fs';
import * as path from 'path';
import { BaseService } from '../../../sys/base/base.service';
import {
  AppType,
  CdCtx,
  DependencyDescriptor,
  ResolutionDescriptor,
} from '../../../sys/dev-descriptor/index';
import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/i-base';
import { MOD_CRAFT_WORKSHOP_DIR } from '../models/app-craft.model';
import { CD_API_APPS_DIR } from '../models/default.model';

export class AppCraftService {
  // Composition: BaseService instance
  private b = new BaseService();

  /**
   * Cleans up an application's output directory before a create process.
   * This is optional and can be used in workflows where a clean start is preferred.
   *
   * @param appType - The type of application (AppType enum)
   * @param cdObjName - The target application's object name
   * @returns {Promise<CdFxReturn<boolean>>}
   */
  //   async preCreateCleanup(
  //     appType: AppType,
  //     cdObjName: string,
  //     oEnv: string,
  //   ): Promise<CdFxReturn<boolean>> {
  //     let targetDir: string = '';
  //     if (oEnv === 'workshop') {
  //       targetDir = path.join(MOD_CRAFT_WORKSHOP_DIR || '', appType, 'output', cdObjName);
  //     } else if (oEnv === 'test-bed') {
  //       targetDir = path.join(CD_API_APPS_DIR, cdObjName);
  //     }

  //     // Validate path
  //     if (!targetDir || targetDir.trim() === '') {
  //       await this.b.logWithContext(
  //         this,
  //         'Invalid target path computed',
  //         { appType, cdObjName },
  //         'warn',
  //       );
  //       return {
  //         data: false,
  //         state: CdFxStateLevel.LogicalFailure,
  //         message: 'Invalid target directory path',
  //       };
  //     }

  //     try {
  //       // Check if directory exists
  //       await fs.access(targetDir);
  //       const contents = await fs.readdir(targetDir);

  //       await this.b.logWithContext(
  //         this,
  //         'Target directory exists before cleanup',
  //         {
  //           targetDir,
  //           contents,
  //         },
  //         'info',
  //       );

  //       // Delete directory recursively
  //       await fs.rm(targetDir, { recursive: true, force: true });

  //       // Confirm deletion
  //       try {
  //         await fs.access(targetDir);
  //         await this.b.logWithContext(
  //           this,
  //           'Directory deletion attempted but still exists',
  //           { targetDir },
  //           'warn',
  //         );
  //         return {
  //           data: false,
  //           state: CdFxStateLevel.Warning,
  //           message: 'Directory deletion attempted but still exists',
  //         };
  //       } catch {
  //         await this.b.logWithContext(
  //           this,
  //           'Directory successfully deleted during preCreateCleanup',
  //           { targetDir },
  //           'info',
  //         );
  //         return {
  //           data: true,
  //           state: CdFxStateLevel.Success,
  //           message: 'Directory successfully deleted',
  //         };
  //       }
  //     } catch {
  //       // Directory does not exist
  //       await this.b.logWithContext(this, 'No existing directory to clean up', { targetDir }, 'info');
  //       return {
  //         data: false,
  //         state: CdFxStateLevel.NotFound,
  //         message: 'No existing directory found to clean up',
  //       };
  //     }
  //   }
  async preCreateCleanup(
    appType: AppType,
    cdObjName: string,
    oEnv: string,
  ): Promise<CdFxReturn<boolean>> {
    let targetDir = '';
    this.b.logWithContext(this, 'appType', appType, 'debug');
    this.b.logWithContext(this, 'cdObjName', cdObjName, 'debug');
    this.b.logWithContext(this, 'oEnv', oEnv, 'debug');
    if (oEnv === 'workshop') {
      targetDir = path.join(MOD_CRAFT_WORKSHOP_DIR || '', appType, 'output', cdObjName);
    } else if (oEnv === 'test-bed') {
      targetDir = path.join(CD_API_APPS_DIR, cdObjName);
    } else {
      await this.b.logWithContext(this, `Environment not yet ${oEnv} configured`, { oEnv }, 'warn');
      return {
        data: null,
        state: false,
        message: `Environment not yet ${oEnv} configured`,
      };
    }

    this.b.logWithContext(this, 'targetDir', targetDir, 'debug');

    // Validate path
    if (!targetDir || targetDir.trim() === '') {
      await this.b.logWithContext(
        this,
        'Invalid target path computed',
        { appType, cdObjName },
        'warn',
      );
      return {
        data: false,
        state: CdFxStateLevel.LogicalFailure,
        message: 'Invalid target directory path',
      };
    }

    try {
      // Check if directory exists
      await fs.access(targetDir);
      const contents = await fs.readdir(targetDir);

      await this.b.logWithContext(
        this,
        'Target directory exists before cleanup',
        { targetDir, contents },
        'info',
      );

      if (oEnv === 'workshop') {
        // Delete everything inside EXCEPT `.git` and `.gitignore`
        for (const item of contents) {
          if (item === '.git' || item === '.gitignore') {
            continue; // skip git metadata
          }
          const fullPath = path.join(targetDir, item);
          await fs.rm(fullPath, { recursive: true, force: true });
        }
      } else {
        // remove the target directory itself
        await fs.rm(targetDir, { recursive: true, force: true });
      }

      await this.b.logWithContext(
        this,
        'Directory cleaned but .git preserved',
        { targetDir },
        'info',
      );

      return {
        data: true,
        state: CdFxStateLevel.Success,
        message: 'Directory cleaned (git metadata preserved)',
      };
    } catch {
      // Directory does not exist
      await this.b.logWithContext(this, 'No existing directory to clean up', { targetDir }, 'info');
      return {
        data: false,
        state: CdFxStateLevel.NotFound,
        message: 'No existing directory found to clean up',
      };
    }
  }
}
