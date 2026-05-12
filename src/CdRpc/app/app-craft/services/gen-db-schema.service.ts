import { CdFxReturn, CdFxStateLevel } from '../../../sys/base/i-base.js';
import {
  CdModelDescriptor,
  CdModuleDescriptor,
  FieldDescriptor,
  MigrationInstruction,
} from '../../../sys/dev-descriptor/index.js';
import { MOD_CRAFT_SYNC_DATASOURCE } from '../models/default.model.js';
// import { fileExists, HOME } from '../../../sys/utils/fs.util.js';
import { cdFx } from '../../../sys/base/cd-fx-return.util.js';
// import CdLog from '../../../sys/cd-comm/controllers/cd-logger.controller.js';
// import { executeCommand } from '../../../sys/utils/cmd.util.js';
// import config, { AppDataSource, loadEntityPaths, mysqlConfig } from '../../../../config.js';
import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions.js';
import * as dotenv from 'dotenv';
import { BaseService } from '../../../sys/base/base.service.js';
// dotenv.config();
// const entitiesConfigPath = path.join(__dirname, 'configs', 'module-entities.json');

export class GenDbSchemaService {
  b = new BaseService();
  // buildMigration(model: CdModelDescriptor): MigrationInstruction {
  //   return {
  //     type: 'createTable',
  //     tableName: model.tableName!,
  //     columns: model.fields.map((f) => ({
  //       name: f.dbName || f.name,
  //       type: f.type,
  //       primary: f.primary,
  //       autoIncrement: f.autoIncrement,
  //       unique: f.unique,
  //       nullable: !f.required,
  //       defaultValue: f.defaultValue,
  //     })),
  //     relations: model.relationships || [],
  //   };
  // }
  // buildMigration(models: CdModelDescriptor[]): MigrationInstruction[] {
  //   return models.map((model) => ({
  //     type: 'createTable',
  //     tableName: model.tableName!,
  //     columns: model.fields.map((f) => ({
  //       name: f.dbName || f.name,
  //       type: f.type,
  //       primary: (f as any).primary || false,
  //       autoIncrement: (f as any).autoIncrement || false,
  //       unique: f.unique || false,
  //       nullable: !f.required,
  //       defaultValue: f.defaultValue,
  //     })),
  //     relations: model.relationships || [],
  //   }));
  // }

  buildMigration(models: CdModuleDescriptor['models']): CdFxReturn<MigrationInstruction[]> {
    try {
      const migrations: MigrationInstruction[] = models.map((model) => ({
        type: 'createTable',
        tableName: model.tableName!,
        columns: model.fields.map((f: FieldDescriptor) => ({
          ...f,
        })),
        relations: model.relationships || [],
      }));

      return cdFx(CdFxStateLevel.Success, 'Migration instructions built', migrations);
    } catch (e: any) {
      return cdFx(CdFxStateLevel.Error, `Failed to build migration instructions: ${e.message}`);
    }
  }

  /**
   * Build migration instructions for a set of models
   */
  // async syncDbSchema(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
  //   try {
  //     if (!(await fileExists(MOD_CRAFT_SYNC_DATASOURCE))) {
  //       return cdFx(
  //         CdFxStateLevel.Error,
  //         `Database sync script not found at path: ${MOD_CRAFT_SYNC_DATASOURCE}`,
  //       );
  //     }
  //     CdLog.debug(`TestBed::syncDatabaseSchema()/ResolvedScriptPath: ${MOD_CRAFT_SYNC_DATASOURCE}`);
  //     const ret = await executeCommand(`npx ts-node ${MOD_CRAFT_SYNC_DATASOURCE}`);
  //     CdLog.debug(`📡 Schema Sync Output2:\n${ret}`);
  //     return cdFx(CdFxStateLevel.Success, 'Database schema synced successfully.');
  //   } catch (e: any) {
  //     return cdFx(CdFxStateLevel.Error, `Failed to sync schema: ${e.message}`);
  //   }
  // }

  // async migrateDbSchema(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
  //   try {
  //     // 1. Build migration metadata from descriptors
  //     const migrationFx = this.buildMigration(module.models);
  //     if (migrationFx.state === CdFxStateLevel.Error) {
  //       return cdFx(CdFxStateLevel.Error, migrationFx.message ?? '');
  //     }

  //     const migrations = migrationFx.data!;
  //     const entityPaths = loadEntityPaths();
  //     this.b.logWithContext(this, `migrateDbSchema:entityPaths`, { entityPaths }, 'debug');
  //     // 2. Connect TypeORM DataSource
  //     const mysqlConfig = {
  //       name: 'conn2',
  //       type: 'mysql',
  //       port: Number(process.env.DB_MS_PORT),
  //       host: process.env.DB_MS_HOST,
  //       username: process.env.DB_MS_USER,
  //       database: process.env.DB_MS_NAME,
  //       password: process.env.DB_MS_PWD,
  //       synchronize: false, // ✅ don't use synchronize with manual migrations
  //       entities: entityPaths, // this reads from module-entities.json
  //       migrations: [],
  //       subscribers: [],
  //       logging: ['query', 'error', 'schema', 'warn', 'info', 'log'],
  //     };

  //     const ds = new DataSource(mysqlConfig as MysqlConnectionOptions);
  //     // const ds = config.ds.mysql;
  //     await ds.initialize(); // ✅ required!
  //     CdLog.debug(
  //       'Loaded entities:',
  //       ds.entityMetadatas.map((m) => ({
  //         name: m.name,
  //         tableName: m.tableName,
  //         columns: m.columns.map((c) => ({
  //           propertyName: c.propertyName,
  //           type: c.type,
  //           databaseName: c.databaseName,
  //         })),
  //       })),
  //     );
  //     const queryRunner = ds.createQueryRunner();

  //     try {
  //       await queryRunner.startTransaction();

  //       // 3. Apply migration instructions
  //       for (const instruction of migrations) {
  //         if (instruction.type === 'createTable') {
  //           const sql = this.generateCreateTableSQL(instruction);
  //           await queryRunner.query(sql);
  //         }
  //         // TODO: handle alterTable / dropTable as needed
  //       }

  //       await queryRunner.commitTransaction();
  //     } catch (err) {
  //       await queryRunner.rollbackTransaction();
  //       throw err;
  //     } finally {
  //       await queryRunner.release();
  //       await ds.destroy();
  //     }

  //     return cdFx(CdFxStateLevel.Success, 'Schema migration completed');
  //   } catch (e: any) {
  //     return cdFx(CdFxStateLevel.Error, `Failed to sync schema: ${e.message}`);
  //   }
  // }

  // loadEntityPaths() {
  //   try {
  //     const modules = JSON.parse(fs.readFileSync(entitiesConfigPath, 'utf8'));
  //     const isTs = __filename.endsWith('.ts') || process.env.NODE_ENV === 'development';
  //     const ext = isTs ? '' : 'js';

  //     return modules
  //       .filter((m) => m.enabled)
  //       .map((m) =>
  //         path.join(
  //           HOME,
  //           isTs
  //             ? `/cd-projects/cd-api/src/CdApi/${m.ctx}/${m.moduleName}/models/*.model.${ext}`
  //             : `/cd-projects/cd-api/dist/CdApi/${m.ctx}/${m.moduleName}/models/*.model.${ext}`,
  //         ),
  //       );
  //   } catch (err) {
  //     console.error('Failed to load entity modules:', err);
  //     return [];
  //   }
  // }

  /**
   * Helper to generate CREATE TABLE SQL from migration instruction
   */
  private generateCreateTableSQL(instruction: MigrationInstruction): string {
    const columnDefs = instruction.columns
      .map((col) => {
        const parts: string[] = [`\`${col.dbName || col.name}\` ${col.type}`];

        if (col.primary) parts.push('PRIMARY KEY');
        if (col.autoIncrement) parts.push('AUTO_INCREMENT');
        if (col.unique) parts.push('UNIQUE');
        if (!col.nullable) parts.push('NOT NULL');
        if (col.defaultValue !== undefined) parts.push(`DEFAULT '${col.defaultValue}'`);

        return parts.join(' ');
      })
      .join(', ');

    return `CREATE TABLE IF NOT EXISTS \`${instruction.tableName}\` (${columnDefs});`;
  }
}
