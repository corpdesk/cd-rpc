// src/CdCli/app/app-craft/controllers/db-sync.controller.ts

import { DbSyncService } from "../services/db-sync.service";
import { CdFxReturn, CdFxStateLevel } from "../../../sys/base/i-base";
import { cdFx } from "../../../sys/base/cd-fx-return.util.js";

export class DbSyncController {
  /**
   * Synchronizes the database with the given model entities using TypeORM.
   * Designed for use within the automated Corpdesk workflow pipeline.
   *
   * @param modelEntities - Array of model/entity classes to synchronize
   * @param logOptions - Optional logging config: true | string[]
   * @returns Promise resolving to CdFxReturn indicating success or failure
   */
  async SyncDb(
    modelEntities: any[] = [],
    logOptions?: { logging?: boolean | string[] }
  ): Promise<CdFxReturn<null>> {
    if (!Array.isArray(modelEntities) || modelEntities.length === 0) {
      return cdFx(
        CdFxStateLevel.Error,
        "No model entities provided. Cannot proceed with DB sync."
      );
    }

    const svDbSync = new DbSyncService();

    const initResult = svDbSync.init(modelEntities, logOptions);
    if (initResult.state !== CdFxStateLevel.Success) {
      return cdFx(
        CdFxStateLevel.Fatal,
        `DbSyncService initialization failed: ${initResult.message}`
      );
    }

    if (logOptions?.logging) {
      console.log("ℹ️  DB Sync Logging enabled:", logOptions.logging);
    }

    const syncResult = await svDbSync.sync();
    return syncResult;
  }
}
