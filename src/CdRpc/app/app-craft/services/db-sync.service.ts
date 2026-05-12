import { DataSource, DataSourceOptions } from "typeorm";
import { cdFx } from "../../../sys/base/cd-fx-return.util.js";
import { CdFxReturn, CdFxStateLevel } from "../../../sys/base/i-base.js";
// import config, {
//   enableModelSyncing,
//   disableModelSyncing,
// } from "../../../../config.js";

export class DbSyncService {
  private dataSource!: DataSource;
  initialized = false;

  constructor() {}

  // init(
  //   modelEntities: any[] = [],
  //   logOptions?: { logging?: boolean | string[] } // logOptions: ['query', 'error', 'warn', 'log'],
  // ): CdFxReturn<null> {
  //   try {
  //     const dbConfig = config.ds.mysql.options as DataSourceOptions;
  //     if (!modelEntities.length) {
  //       return cdFx(
  //         CdFxStateLevel.Error,
  //         "No entities provided for synchronization."
  //       );
  //     }

  //     enableModelSyncing();

  //     const mergedConfig: DataSourceOptions = {
  //       ...dbConfig,
  //       entities: modelEntities,
  //       synchronize: false, // set to false to avoid auto-syncing
  //       logging:
  //         (logOptions?.logging as
  //           | boolean
  //           | (
  //               | "query"
  //               | "schema"
  //               | "error"
  //               | "warn"
  //               | "info"
  //               | "log"
  //               | "migration"
  //             )[]) ?? false, // default: no logging
  //     };

  //     this.dataSource = new DataSource(mergedConfig);
  //     this.initialized = true;

  //     return cdFx(CdFxStateLevel.Success, "DbSyncService initialized.");
  //   } catch (err: any) {
  //     return cdFx(
  //       CdFxStateLevel.Fatal,
  //       `Initialization failed: ${err.message}`
  //     );
  //   }
  // }

  // async sync(): Promise<CdFxReturn<null>> {
  //   if (!this.initialized) {
  //     return cdFx(CdFxStateLevel.Fatal, "DbSyncService not initialized.");
  //   }

  //   try {
  //     await this.dataSource.initialize();
  //     console.log("✅ Sync complete");
  //     return cdFx(CdFxStateLevel.Success, "Database schema synchronized.");
  //   } catch (err: any) {
  //     return cdFx(CdFxStateLevel.Fatal, `❌ Sync error: ${err.message}`);
  //   } finally {
  //     await this.dataSource.destroy();
  //     disableModelSyncing();
  //   }
  // }

  
}
