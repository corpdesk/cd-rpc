import { DataSource } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions.js';
import { CdFxReturn } from '../../../sys/base/i-base.js';
import { CdModuleDescriptor } from '../../../sys/dev-descriptor/index.js';
import {
  DataSourceSchema,
  CdDataSource,
  MigrationProfile,
  TableDescriptor,
  FieldDescriptor,
  RelationshipDescriptor,
  IndexDescriptor,
  CdModelDescriptor,
} from '../../../sys/dev-descriptor/models/cd-model-descriptor.model.js';
import { loadEntityPaths } from '../../../../config.js';
import { BaseService } from '../../../sys/base/base.service.js';
import { toKebabCase, toPascalCase, toSnakeCase } from '../../../sys/utils/cd-naming.util.js';
import { inspect } from 'util';
import { resolve } from 'path';
import { CD_API_TEST_BED_DIR, MigrationConfig } from '../models/default.model.js';

const CD_API_APPS_DIR = resolve(CD_API_TEST_BED_DIR, 'dist', 'CdApi', 'app');

interface ColumnDiff {
  type: string;
  target: 'column' | 'index' | 'relation';
  column?: string;
  action: 'add' | 'drop' | 'modify';
  sourceDef?: any;
  destDef?: any;
}

export class DbMigrationService {
  b = new BaseService();
  private db!: DataSource | undefined;
  config!: MigrationConfig;

  constructor() {}

  /**
   * Must be called before using migrateFromModel()
   */
  async init(migConfig?: MigrationConfig): Promise<CdFxReturn<DataSource>> {
    try {
      // merge config (with defaults)
      this.config = { ...this.config, ...migConfig };

      if (this.db && this.db.isInitialized) {
        return {
          state: true,
          data: this.db,
          message: 'Database already initialized',
        };
      }

      const entityPaths = loadEntityPaths();
      this.b.logWithContext(
        this,
        `migrateDbSchema:entityPaths`,
        { entityPaths, config: this.config },
        'debug',
      );

      const mysqlConfig = {
        name: 'conn2',
        type: 'mysql',
        port: Number(process.env.DB_MS_PORT),
        host: process.env.DB_MS_HOST,
        username: process.env.DB_MS_USER,
        database: process.env.DB_MS_NAME,
        password: process.env.DB_MS_PWD,
        synchronize: false,
        entities: entityPaths,
        migrations: [],
        subscribers: [],
        logging: ['query', 'error', 'schema', 'warn', 'info', 'log'],
      };

      this.db = new DataSource(mysqlConfig as MysqlConnectionOptions);
      await this.db.initialize();

      return {
        state: true,
        data: this.db,
        message: 'Database initialized successfully',
      };
    } catch (error: any) {
      return {
        state: false,
        data: null,
        message: `Failed to initialize database: ${error.message ?? error}`,
      };
    }
  }

  async closeConnection(): Promise<CdFxReturn<null>> {
    try {
      if (this.db && this.db.isInitialized) {
        await this.db.destroy();
        this.db = undefined;
        return {
          state: true,
          data: null,
          message: 'Database connection closed successfully',
        };
      }
      return {
        state: true,
        data: null,
        message: 'No active database connection to close',
      };
    } catch (error: any) {
      return {
        state: false,
        data: null,
        message: `Failed to close connection: ${error.message ?? error}`,
      };
    }
  }

  // async getRepositoryForModel(
  //   db: DataSource,
  //   modelDescriptor: CdModelDescriptor,
  //   moduleDir: string,
  // ) {
  //   const modelNamePascal = `${toPascalCase(modelDescriptor.name)}Model`;
  //   // 1. Build the path to the model file
  //   const modelFilePath = path.resolve(
  //     moduleDir,
  //     'models',
  //     `${toKebabCase(modelDescriptor.name)}.model.js`, // cd-ai.model.ts
  //   );

  //   this.b.logWithContext(this, `migrateFromModel()/modelFilePath:`, { modelFilePath }, 'debug');

  //   // 2. Dynamically import the module
  //   const importedModule = await import(modelFilePath);

  //   // 3. Extract the class constructor
  //   // Example: modelDescriptor.className = "CdAiModel"
  //   const entityClass = importedModule[modelNamePascal];
  //   if (!entityClass) {
  //     throw new Error(`Entity class ${modelNamePascal} not found in ${modelFilePath}`);
  //   }

  //   // 4. Get the repository
  //   return db.getRepository(entityClass);
  // }

  async migrateFromModel(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      this.b.logWithContext(this, `migrateFromModel()...start`, {}, 'debug');
      if (!this.db || !this.db.isInitialized) {
        return {
          state: false,
          data: null,
          message: 'DbMigrationService not initialized. Call init() first.',
        };
      }

      // 1. Build schema from model
      const sourceSchema = this.buildSchemaFromModel(module);
      this.b.logWithContext(
        this,
        `migrateFromModel()/sourceSchema:`,
        { sourceSchema: JSON.stringify(sourceSchema.tables) },
        'debug',
      );
      // 2. Load schema from database
      const destSchemaResult = await this.loadSchemaFromDatabase(module);
      this.b.logWithContext(
        this,
        `migrateFromModel()/destSchemaResult:`,
        { destSchemaResult: destSchemaResult.data?.tables },
        'debug',
      );

      if (!destSchemaResult.state || !destSchemaResult.data) {
        return {
          state: false,
          message: destSchemaResult.message,
          data: null
        };
      }
      const destSchema = destSchemaResult.data;

      // 3. Compare schemas → MigrationProfiles
      const migrationsResult = await this.compareSchemas(sourceSchema, destSchema);

      if (!migrationsResult.state || !migrationsResult.data) {
        return {
          state: false,
          message: migrationsResult.message,
          data: null
        };
      }

      const migrations = migrationsResult.data;
      this.b.logWithContext(
        this,
        `migrateFromModel()/migrations:`,
        { migrations: inspect(migrations, { depth: 2 }) },
        'debug',
      );

      // 4. Execute migrations
      for (const migration of migrations) {
        const migResult = await this.applyMigration(migration);
        if (!migResult.state) {
          return {
            state: false,
            message: migResult.message,
            data: null
          };
        }
      }

      // if (migrations) {
      //   throw new Error(`Process stoped for observation!`);
      // }

      // 5. Insert dummy data
      const dummyDataResult = await this.insertDummyData(module);
      if (!dummyDataResult.state) {
        this.b.logWithContext(
          this,
          `migrateFromModel:dummyDataError`,
          { message: dummyDataResult.message },
          'error',
        );
        // Decide if you want to return an error or continue
        // return { state: false, message: dummyDataResult.message };
      } else {
        this.b.logWithContext(this, `migrateFromModel:dummyDataSuccess`, {}, 'info');
      }

      await this.closeConnection();
      return {
        state: true,
        data: null,
        message: `Migration and dummy data insertion completed successfully for module: ${module.name}`,
      };
    } catch (error: any) {
      return {
        state: false,
        data: null,
        message: `Migration failed: ${error.message ?? error}`,
      };
    }
  }

  private buildSchemaFromModel(module: CdModuleDescriptor): DataSourceSchema {
    const tables: TableDescriptor[] = [];
    const views: TableDescriptor[] = [];

    this.b.logWithContext(
      this,
      `buildSchemaFromModel()/module.models:`,
      { models: module.models },
      'debug',
    );

    for (const m of module.models) {
      const isViewModel = m.name.endsWith('-view');

      if (isViewModel) {
        // 🔹 Directly register it as a view
        this.b.logWithContext(
          this,
          `buildSchemaFromModel():detected view model`,
          { model: m.name },
          'debug',
        );
        views.push({
          name: m.name,
          tableName: m.tableName ?? undefined,
          kind: 'view',
          fields: m.fields,
          indexes: [],
          relations: m.relationships ?? [],
        });
      } else {
        // 🔹 Normal table
        this.b.logWithContext(
          this,
          `buildSchemaFromModel():detected table model`,
          { model: m.name },
          'debug',
        );
        tables.push({
          name: m.name,
          tableName: m.tableName ?? undefined,
          kind: 'table',
          fields: m.fields,
          indexes: [],
          relations: m.relationships ?? [],
        });

        // 🔹 Generate companion views from relationships (if applicable)
        for (const rel of m.relationships ?? []) {
          const viewName = `${m.tableName}_view`;
          this.b.logWithContext(
            this,
            `buildSchemaFromModel():generated view from relation`,
            { table: m.tableName, view: viewName },
            'debug',
          );
          views.push({
            name: viewName,
            tableName: m.tableName ?? undefined,
            kind: 'view',
            relations: m.relationships ?? [],
            definitionSQL: this.generateViewSQL(m, rel),
          });
        }
      }
    }

    return { name: module.name, tables: [...tables, ...views] };
  }

  private async loadSchemaFromDatabase(
    module: CdModuleDescriptor,
  ): Promise<CdFxReturn<{ tables: TableDescriptor[] }>> {
    if (!this.db) {
      return { state: false, data: { tables: [] }, message: 'DB not initialized' };
    }

    try {
      const stmt = `
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name LIKE '${toSnakeCase(module.name)}%'
    `;
      this.b.logWithContext(this, `loadSchemaFromDatabase()/stmt:`, { stmt }, 'debug');
      const tables: any[] = await this.db.query(stmt);

      if (!Array.isArray(tables)) {
        throw new Error('tables result is not a valid array');
      }

      const tableDescriptors: TableDescriptor[] = [];

      for (const row of tables) {
        const tableName = row.TABLE_NAME;
        const tableType = row.TABLE_TYPE; // 👈 BASE TABLE or VIEW
        const kind: 'table' | 'view' = tableType === 'VIEW' ? 'view' : 'table';

        // 🔹 Fields (only if table)
        let fields: FieldDescriptor[] = [];
        if (kind === 'table') {
          const queryResult: any[] = await this.db.query(
            `SELECT column_name, column_type, is_nullable, column_default, extra
           FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = ?`,
            [tableName],
          );

          const columns = queryResult;
          if (!Array.isArray(columns)) {
            throw new Error('columns result is not a valid array');
          }

          fields = columns.map((c: any) => ({
            name: c.COLUMN_NAME,
            type: c.COLUMN_TYPE,
            nullable: c.IS_NULLABLE === 'YES',
            default: c.COLUMN_DEFAULT,
            autoIncrement: c.EXTRA.includes('auto_increment'),
          }));
        }

        // 🔹 Indexes (skip for views)
        let idxDescriptors: IndexDescriptor[] = [];
        if (kind === 'table') {
          const indexes: any[] = await this.db.query(`SHOW INDEX FROM \`${tableName}\``);
          const idxMap: Record<string, IndexDescriptor> = {};

          for (const idx of indexes) {
            const keyName = idx.Key_name;
            if (!idxMap[keyName]) {
              idxMap[keyName] = {
                name: keyName,
                unique: idx.Non_unique === 0,
                columns: [],
              };
            }
            idxMap[keyName].columns.push(idx.Column_name);
          }

          idxDescriptors = Object.values(idxMap);
        }

        // 🔹 Relations (FKs — skip for views)
        let relDescriptors: RelationshipDescriptor[] = [];
        if (kind === 'table') {
          const relations: any[] = await this.db.query(
            `SELECT
             rc.CONSTRAINT_NAME,
             kcu.TABLE_NAME,
             kcu.COLUMN_NAME,
             kcu.REFERENCED_TABLE_NAME,
             kcu.REFERENCED_COLUMN_NAME,
             rc.UPDATE_RULE,
             rc.DELETE_RULE
           FROM information_schema.referential_constraints rc
           JOIN information_schema.key_column_usage kcu
             ON rc.constraint_name = kcu.constraint_name
            AND rc.constraint_schema = kcu.constraint_schema
           WHERE rc.constraint_schema = DATABASE()
             AND kcu.table_name = ?`,
            [tableName],
          );

          const relMap: Record<string, RelationshipDescriptor> = {};
          for (const rel of relations) {
            if (!relMap[rel.CONSTRAINT_NAME]) {
              relMap[rel.CONSTRAINT_NAME] = {
                name: rel.CONSTRAINT_NAME,
                type: 'foreign-key',
                sourceTable: rel.TABLE_NAME,
                sourceColumns: [],
                targetTable: rel.REFERENCED_TABLE_NAME,
                targetColumns: [],
                onDelete: rel.DELETE_RULE,
                onUpdate: rel.UPDATE_RULE,
              };
            }
            relMap[rel.CONSTRAINT_NAME].sourceColumns.push(rel.COLUMN_NAME);
            relMap[rel.CONSTRAINT_NAME].targetColumns.push(rel.REFERENCED_COLUMN_NAME);
          }

          relDescriptors = Object.values(relMap);
        }

        // 🔹 Push descriptor (tables vs views)
        tableDescriptors.push({
          name: tableName,
          kind, // 'table' | 'view'
          fields,
          indexes: idxDescriptors,
          relations: relDescriptors,
        });
      }

      return {
        state: true,
        data: { tables: tableDescriptors },
        message: 'Loaded database schema successfully',
      };
    } catch (err: any) {
      return {
        state: false,
        data: { tables: [] },
        message: `Failed to load schema: ${err.message}`,
      };
    }
  }

  private async compareSchemas(
    source: DataSourceSchema,
    dest: DataSourceSchema,
  ): Promise<CdFxReturn<MigrationProfile[]>> {
    try {
      this.b.logWithContext(this, `compareSchemas:start`, {}, 'debug');
      const migrations: MigrationProfile[] = [];

      for (const table of source.tables ?? []) {
        const dbTable = (dest.tables ?? []).find((t) => t.name === table.name);

        // 🎯 Prevent duplicate migrations for same descriptor
        const existingMigration = migrations.find(
          (m) =>
            m.transformation.target === table.kind &&
            m.transformation.descriptor?.name === table.name,
        );
        if (existingMigration) continue;

        if (!dbTable) {
          this.b.logWithContext(
            this,
            `compareSchemas:create`,
            { name: table.name, kind: table.kind },
            'info',
          );
          migrations.push({
            id: `create-${table.name}`,
            source: { type: 'model', dsConfig: {}, dsSchema: { tables: [table] } },
            destination: { type: 'database', dsConfig: {}, dsSchema: dest },
            transformation: { type: 'create', target: table.kind, descriptor: table }, // 👈 keep kind
            description: `Create ${table.kind} ${table.name}`,
          });
        } else if (table.kind === 'table') {
          // Only compare columns/indexes/relations for tables
          const columnDiffs = this.compareColumnsAndConstraints(table, dbTable);

          if (columnDiffs.length > 0) {
            this.b.logWithContext(
              this,
              `compareSchemas:alter`,
              { table: table.name, diffs: columnDiffs },
              'warn',
            );
            migrations.push({
              id: `alter-${table.name}`,
              source: { type: 'model', dsConfig: {}, dsSchema: { tables: [table] } },
              destination: { type: 'database', dsConfig: {}, dsSchema: dest },
              transformation: { type: 'alter', target: 'table', descriptor: columnDiffs },
              description: `Alter table ${table.name}`,
            });
          } else {
            this.b.logWithContext(this, `compareSchemas:sync`, { table: table.name }, 'debug');
            migrations.push({
              id: `sync-${table.name}`,
              source: { type: 'model', dsConfig: {}, dsSchema: { tables: [table] } },
              destination: { type: 'database', dsConfig: {}, dsSchema: dest },
              transformation: { type: 'sync', target: 'table', descriptor: table },
              description: `Table ${table.name} already in sync`,
            });
          }
        } else if (table.kind === 'view') {
          // Views: always recreate, no diffing needed
          this.b.logWithContext(this, `compareSchemas:sync-view`, { view: table.name }, 'info');
          migrations.push({
            id: `sync-${table.name}`,
            source: { type: 'model', dsConfig: {}, dsSchema: { tables: [table] } },
            destination: { type: 'database', dsConfig: {}, dsSchema: dest },
            transformation: { type: 'create', target: 'view', descriptor: table },
            description: `Ensure view ${table.name} exists/updated`,
            relations: table.relations,
          });
        }
      }

      return {
        state: true,
        data: migrations,
        message: `Schema comparison completed (${migrations.length} migration(s) found).`,
      };
    } catch (err: any) {
      return { state: false, data: [], message: `compareSchemas failed: ${err.message ?? err}` };
    }
  }

  
  private async applyMigration(migration: MigrationProfile): Promise<CdFxReturn<null>> {
    try {
      this.b.logWithContext(
        this,
        `applyMigration:start`,
        {
          id: migration.id,
          type: migration.transformation.type,
          target: migration.transformation.target,
          config: this.config,
        },
        'debug',
      );

      const sourceTable = migration.source.dsSchema?.tables?.[0];
      if (!sourceTable) {
        return {
          state: false,
          data: null,
          message: `Cannot determine descriptor for migration ${migration.id}`,
        };
      }

      const objectName = this.normalizeTableName(sourceTable.name);
      let sql: string | undefined;

      // 🔹 CASE 1: TABLE
      if (migration.transformation.target === 'table') {
        const tableExistsResult: any[] = await this.db!.query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
          [objectName],
        );
        const tableExists = tableExistsResult.length > 0;

        if (tableExists && !(this.config?.purgeMode)) {
          const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
          const prefix = this.config.backupTableNamePrefix ?? objectName;
          const backupTableName = `${prefix}_backup_${timestamp}`;

          this.b.logWithContext(
            this,
            `applyMigration:backup:start`,
            { table: objectName, backup: backupTableName },
            'warn',
          );

          if (!this.config.dryRun) {
            await this.db!.query(
              `CREATE TABLE \`${backupTableName}\` AS SELECT * FROM \`${objectName}\``,
            );
          }

          await this.db!.query(`DROP TABLE \`${objectName}\``);
          this.b.logWithContext(this, `applyMigration:backup:done`, { table: objectName }, 'warn');
        } else if (tableExists && !this.config.enableTableBackup) {
          this.b.logWithContext(
            this,
            `applyMigration:dropWithoutBackup`,
            { table: objectName },
            'warn',
          );
          await this.db!.query(`DROP TABLE \`${objectName}\``);
        }

        if (
          migration.transformation.type === 'create' ||
          migration.transformation.type === 'alter'
        ) {
          sql = this.generateCreateTableSQL(sourceTable);
        } else if (migration.transformation.type === 'drop') {
          sql = `DROP TABLE IF EXISTS \`${objectName}\``;
        }
      }

      // 🔹 CASE 2: VIEW
      else if (migration.transformation.target === 'view') {
        await this.db!.query(`DROP VIEW IF EXISTS \`${objectName}\``);

        if (
          migration.transformation.type === 'create' ||
          migration.transformation.type === 'alter'
        ) {
          sql = this.generateCreateViewSQL(sourceTable);
        } else if (migration.transformation.type === 'drop') {
          sql = `DROP VIEW IF EXISTS \`${objectName}\``;
        }
      }

      // 🔹 Unsupported
      if (!sql) {
        return {
          state: false,
          data: null,
          message: `Unsupported migration type: ${migration.transformation.type} for ${migration.transformation.target}`,
        };
      }

      this.b.logWithContext(this, `applyMigration:executeSQL`, { sql }, 'debug');
      if (!this.config.dryRun) {
        await this.db!.query(sql);
      }

      return {
        state: true,
        data: null,
        message: `Migration ${migration.id} applied successfully.`,
      };
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `Failed to apply migration ${migration.id}: ${err.message ?? err}`,
      };
    }
  }

  private sanitizeObjectName(name: string): string {
    return toSnakeCase(name); // table names and field names use snake_case
  }

  /**
   * Normalize a table name from model to SQL-safe snake_case.
   * Applies Corpdesk RFC-0001 casing policy.
   */
  // private normalizeTableName(name: string): string {
  //   return toSnakeCase(name); // kebab → snake
  // }

  private normalizeTableName(name: string): string {
    if (this.config?.purgeMode) {
      return name; // ✅ use exact name
    }
    return toSnakeCase(name); // kebab → snake
  }

  /**
   * Normalize a column name from model to SQL-safe snake_case.
   */
  private normalizeColumnName(name: string): string {
    return toSnakeCase(name);
  }

  private compareColumnsAndConstraints(
    source: TableDescriptor,
    dest: TableDescriptor,
  ): Array<{
    target: 'column' | 'index' | 'relation';
    column?: string;
    action: 'add' | 'drop' | 'modify';
    sourceDef?: any;
    destDef?: any;
  }> {
    const diffs: Array<{
      target: 'column' | 'index' | 'relation';
      column?: string;
      action: 'add' | 'drop' | 'modify';
      sourceDef?: any;
      destDef?: any;
    }> = [];

    // 🔹 Normalize table names for comparison
    const normalizedSourceTableName = this.normalizeTableName(source.name);
    const normalizedDestTableName = dest.name; // Assumed to be already normalized (snake_case)

    // 🔹 Get fields
    const srcCols = source.fields ?? [];
    const dstCols = dest.fields ?? [];

    // 🔹 Normalize field names for comparison
    const normalizedSrcFields = srcCols.map((col) => ({
      ...col,
      normalizedName: this.normalizeColumnName(col.name),
    }));
    const normalizedDstFields = dstCols.map((col) => ({
      ...col,
      normalizedName: col.name.toLowerCase(), // Assumed to be already normalized
    }));

    // 🔹 1. Column diffs
    for (const srcField of normalizedSrcFields) {
      const match = normalizedDstFields.find((d) => d.normalizedName === srcField.normalizedName);
      if (!match) {
        diffs.push({
          target: 'column',
          column: srcField.normalizedName,
          action: 'add',
          sourceDef: srcField,
        });
      } else if (!this.isColumnEqual(srcField, match)) {
        diffs.push({
          target: 'column',
          column: srcField.normalizedName,
          action: 'modify',
          sourceDef: srcField,
          destDef: match,
        });
      }
    }

    for (const dstField of normalizedDstFields) {
      if (!normalizedSrcFields.find((s) => s.normalizedName === dstField.normalizedName)) {
        diffs.push({
          target: 'column',
          column: dstField.normalizedName,
          action: 'drop',
          destDef: dstField,
        });
      }
    }

    // 🔹 2. Index diffs
    const srcIdx = source.indexes ?? [];
    const dstIdx = dest.indexes ?? [];
    for (const idx of srcIdx) {
      const match = dstIdx.find((d) => d.name === idx.name);
      if (!match) {
        diffs.push({ target: 'index', action: 'add', sourceDef: idx });
      } else if (!this.isIndexEqual(idx, match)) {
        diffs.push({
          target: 'index',
          action: 'modify',
          sourceDef: idx,
          destDef: match,
        });
      }
    }
    for (const idx of dstIdx) {
      if (!srcIdx.find((s) => s.name === idx.name)) {
        diffs.push({ target: 'index', action: 'drop', destDef: idx });
      }
    }

    // 🔹 3. Relation diffs
    const srcRel = source.relations ?? [];
    const dstRel = dest.relations ?? [];
    for (const rel of srcRel) {
      const normalizedSourceTable = this.normalizeTableName(rel.sourceTable ?? '');
      const normalizedTargetTable = this.normalizeTableName(rel.targetTable ?? '');
      const normalizedSourceColumns = rel.sourceColumns.map((c) =>
        this.normalizeColumnName(c.name),
      );
      const normalizedTargetColumns = rel.targetColumns.map((c) =>
        this.normalizeColumnName(c.name),
      );

      const match = dstRel.find((d) => d.name === rel.name);
      if (!match) {
        diffs.push({ target: 'relation', action: 'add', sourceDef: rel });
      } else if (!this.isRelationEqual(rel, match)) {
        diffs.push({
          target: 'relation',
          action: 'modify',
          sourceDef: rel,
          destDef: match,
        });
      }
    }
    for (const rel of dstRel) {
      if (!srcRel.find((s) => s.name === rel.name)) {
        diffs.push({ target: 'relation', action: 'drop', destDef: rel });
      }
    }

    return diffs;
  }

  private isColumnEqual(a: FieldDescriptor, b: FieldDescriptor): boolean {
    return (
      a.type === b.type &&
      a.nullable === b.nullable &&
      (a.default ?? null) === (b.default ?? null) &&
      (a.autoIncrement ?? false) === (b.autoIncrement ?? false)
    );
  }

  private isIndexEqual(a: IndexDescriptor, b: IndexDescriptor): boolean {
    return (
      a.unique === b.unique &&
      JSON.stringify([...a.columns].sort()) === JSON.stringify([...b.columns].sort())
    );
  }

  private isRelationEqual(a: RelationshipDescriptor, b: RelationshipDescriptor): boolean {
    return (
      a.type === b.type &&
      a.relatedModel === b.relatedModel &&
      (a.foreignKey ?? null) === (b.foreignKey ?? null) &&
      // Optional future properties
      (a.onDelete ?? 'NO ACTION') === (b.onDelete ?? 'NO ACTION') &&
      (a.onUpdate ?? 'NO ACTION') === (b.onUpdate ?? 'NO ACTION') &&
      JSON.stringify((a.sourceColumns ?? []).sort()) ===
        JSON.stringify((b.sourceColumns ?? []).sort()) &&
      JSON.stringify((a.targetColumns ?? []).sort()) ===
        JSON.stringify((b.targetColumns ?? []).sort())
    );
  }

  private mapToMysqlType(type: string): string {
    switch (type.toLowerCase()) {
      case 'number':
      case 'int':
        return 'INT';
      case 'bigint':
        return 'BIGINT';
      case 'string':
      case 'varchar':
        return 'VARCHAR(255)';
      case 'text':
        return 'TEXT';
      case 'boolean':
      case 'bool':
        return 'TINYINT(1)';
      case 'date':
        return 'DATE';
      case 'datetime':
        return 'DATETIME';
      default:
        return 'VARCHAR(255)'; // safe fallback
    }
  }

  /**
   * Generate SQL for creating a table or a view.
   */
  private generateCreateTableSQL(descriptor: TableDescriptor): string {
    if (descriptor.kind === 'table') {
      return this.generateTableSQL(descriptor);
    }
    if (descriptor.kind === 'view') {
      if (!descriptor.definitionSQL) {
        throw new Error(`View ${descriptor.name} is missing definitionSQL`);
      }
      return descriptor.definitionSQL;
    }
    throw new Error(`Unknown descriptor kind: ${descriptor.kind}`);
  }

  /**
   * Generate CREATE TABLE SQL for a table descriptor.
   */
  private generateTableSQL(descriptor: TableDescriptor): string {
    const columnsSQL = (descriptor.fields ?? [])
      .map((f) => {
        const colName = `\`${this.normalizeColumnName(f.name)}\``;
        const colType = this.mapToMysqlType(f.type);
        const nullable = f.nullable ? 'NULL' : 'NOT NULL';
        const autoInc = f.autoIncrement ? 'AUTO_INCREMENT' : '';
        const defaultVal =
          f.default !== undefined && f.default !== null ? `DEFAULT '${f.default}'` : '';
        return `${colName} ${colType} ${nullable} ${defaultVal} ${autoInc}`.trim();
      })
      .join(', ');

    // Primary key detection
    const pkCols = (descriptor.fields ?? [])
      .filter((f) => f.primary)
      .map((f) => `\`${this.normalizeColumnName(f.name)}\``);

    const pkSQL = pkCols.length > 0 ? `, PRIMARY KEY (${pkCols.join(', ')})` : '';

    return `CREATE TABLE \`${this.normalizeTableName(descriptor.name)}\` (${columnsSQL}${pkSQL})`;
  }

  private generateCreateViewSQL(view: TableDescriptor): string {
    this.b.logWithContext(this, `[generateCreateViewSQL] Start`, { view });
    const selectColumns: string[] = [];
    const seen = new Set<string>();

    // 🔹 Base table alias (MUST use tableName, not view.name)
    const baseAlias = this.sanitizeObjectName(view.tableName ?? view.name);
    this.b.logWithContext(this, `[generateCreateViewSQL] Base alias resolved`, {
      baseAlias,
      tableName: view.tableName,
      viewName: view.name,
    });

    // 🔹 Relationship-derived aliases (target tables)
    const relationAliases: Record<string, string> = {};
    this.b.logWithContext(this, `[generateCreateViewSQL] view.relations1`, {
      viewRelations: view.relations,
    });
    for (const rel of view.relations ?? []) {
      const targetAlias = this.sanitizeObjectName(rel.targetTable ?? rel.relatedModel ?? '');
      if (rel.targetTable) {
        relationAliases[rel.targetTable] = targetAlias;
      }
      this.b.logWithContext(this, `[generateCreateViewSQL] Relation alias resolved`, {
        relation: rel.name,
        targetTable: rel.targetTable,
        targetAlias,
      });
    }

    // 🔹 Process fields from base table
    this.b.logWithContext(this, `[generateCreateViewSQL] view.fields`, {
      viewRelations: view.fields,
    });
    for (const col of view.fields ?? []) {
      const colName = this.sanitizeObjectName(String(col.dbName ?? col.name));
      let alias = colName;

      if (seen.has(colName)) {
        alias = `${baseAlias}_${colName}`;
      }

      seen.add(alias);
      selectColumns.push(`\`${baseAlias}\`.\`${colName}\` AS \`${alias}\``);

      this.b.logWithContext(this, `[generateCreateViewSQL] Base column added`, {
        table: baseAlias,
        column: colName,
        alias,
      });
    }

    // 🔹 Process fields from related tables
    this.b.logWithContext(this, `[generateCreateViewSQL] view.relations2`, {
      viewRelations: view.relations,
    });
    for (const rel of view.relations ?? []) {
      const alias = rel.targetTable ? relationAliases[rel.targetTable] : undefined;

      this.b.logWithContext(this, `[generateCreateViewSQL] relColumns`, {
        relColumns: rel.targetColumns,
      });
      for (const targetCol of rel.targetColumns ?? []) {
        const colName = this.sanitizeObjectName(String(targetCol.dbName ?? targetCol.name));
        this.b.logWithContext(this, `[generateCreateViewSQL] colName`, { colName });
        let finalAlias = colName;

        if (seen.has(colName)) {
          finalAlias = `${alias}_${colName}`;
        }

        seen.add(finalAlias);
        selectColumns.push(`\`${alias}\`.\`${colName}\` AS \`${finalAlias}\``);

        this.b.logWithContext(this, `[generateCreateViewSQL] Related column added`, {
          relation: rel.name,
          table: alias,
          column: colName,
          alias: finalAlias,
        });
      }
    }

    // 🔹 Build FROM + JOINs
    this.b.logWithContext(this, `[generateCreateViewSQL] view.relations3`, {
      viewRelations: view.relations,
    });
    let fromClause = `FROM \`${view.tableName ?? view.name}\` AS \`${baseAlias}\``;
    for (const rel of view.relations ?? []) {
      const alias = rel.targetTable ? relationAliases[rel.targetTable] : undefined;
      const sourceCol = this.sanitizeObjectName(
        String(rel.sourceColumns?.[0]?.dbName ?? rel.sourceColumns?.[0]?.name),
      );
      const targetCol = this.sanitizeObjectName(
        String(rel.targetColumns?.[0]?.dbName ?? rel.targetColumns?.[0]?.name),
      );

      fromClause += ` JOIN \`${rel.targetTable}\` AS \`${alias}\` ON \`${baseAlias}\`.\`${sourceCol}\` = \`${alias}\`.\`${targetCol}\``;

      this.b.logWithContext(this, `[generateCreateViewSQL] Join added`, {
        relation: rel.name,
        baseAlias,
        sourceCol,
        targetTable: rel.targetTable,
        targetAlias: alias,
        targetCol,
      });
    }

    this.b.logWithContext(this, `[generateCreateViewSQL] selectColumns`, { selectColumns });
    // 🔹 Final SQL
    const sql = `CREATE OR REPLACE VIEW \`${this.sanitizeObjectName(view.name)}\` AS
    SELECT ${selectColumns.join(', ')}
    ${fromClause}`;

    this.b.logWithContext(this, `[generateCreateViewSQL] Final SQL generated`, { sql });

    return sql;
  }

  private generateViewSQL(model: CdModelDescriptor, rel: RelationshipDescriptor): string {
    this.b.logWithContext(this, `[generateViewSQL] Start`, {
      model: model.name,
      relation: rel.name,
    });
    const sourceTable = this.normalizeTableName(model.tableName ?? model.name);
    const targetTable = this.normalizeTableName(rel.targetTable ?? '');

    const sourceCols = (model.fields ?? [])
      .map((f) => `s.\`${this.normalizeColumnName(String(f.dbName ?? f.name))}\``)
      .join(', ');

    const targetCols = (rel.targetColumns ?? [])
      .map((c) => `t.\`${this.normalizeColumnName(c.name)}\``)
      .join(', ');

    const joinCondition = rel.sourceColumns
      .map(
        (sc, i) =>
          `s.\`${this.normalizeColumnName(String(sc.dbName ?? sc.name))}\` = t.\`${this.normalizeColumnName(String(rel.targetColumns[i].name))}\``,
      )
      .join(' AND ');

    return `CREATE OR REPLACE VIEW \`${sourceTable}_with_${targetTable}\` AS 
          SELECT ${sourceCols}, ${targetCols}
          FROM \`${sourceTable}\` s
          JOIN \`${targetTable}\` t
          ON ${joinCondition}`;
  }

  /**
   * Inserts dummy data into module tables for testing purposes.
   * This version uses parameterized queries for security and reliability.
   * @param module The CdModuleDescriptor containing the models.
   * @returns A Promise resolving to CdFxReturn<null> indicating success or failure.
   */
  async insertDummyData(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      for (const model of module.models) {
        this.b.logWithContext(this, `insertDummyData:startModel`, { model: model.name });

        const dummyData = this.generateDummyDataForModel(model);
        if (!dummyData || dummyData.length === 0) {
          continue;
        }

        const tableName = toSnakeCase(model.name);

        for (const record of dummyData) {
          const columns: string[] = [];
          const values: any[] = [];
          const placeholders: string[] = [];

          for (const [field, value] of Object.entries(record)) {
            const colName = toSnakeCase(field);

            // Skip primary key auto-increment fields
            if (colName.endsWith('_id') || colName.endsWith('_primary_key')) {
              continue;
            }

            columns.push(`\`${colName}\``);
            values.push(value);
            placeholders.push('?');

            this.b.logWithContext(this, `insertDummyData:fieldCheck`, {
              field,
              jsType: typeof value,
              value,
            });
          }

          const sql = `INSERT INTO \`${tableName}\` (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;

          this.b.logWithContext(this, `insertDummyData:sql`, { sql, values });

          // Use parameterized query to prevent SQL injection
          await this.db?.query(sql, values);
        }

        this.b.logWithContext(
          this,
          `insertDummyData:inserted`,
          { model: model.name, count: dummyData.length },
          'info',
        );
      }

      return { state: true, data: null, message: 'Dummy data inserted successfully' };
    } catch (err: any) {
      return { state: false, data: null, message: `Insert failed: ${err.message ?? err}` };
    }
  }

  /**
   * Generates dummy data for a given model.
   * This method should be customized to provide meaningful test data.
   * @param model The FieldDescriptor defining the model's structure.
   * @returns An array of objects representing dummy data rows.
   */
  private generateDummyDataForModel(model: CdModelDescriptor): any[] {
    this.b.logWithContext(
      this,
      `generateDummyDataForModel:start`,
      { modelName: model.name },
      'debug',
    );
    const dummyRecords: any[] = [];

    // Example: Generating 5 dummy records
    for (let i = 0; i < 5; i++) {
      const record: any = {};
      let hasPrimary = false;

      for (const field of model.fields) {
        let value: any;
        const normalizedFieldName = this.normalizeColumnName(field.name); // Use normalized name

        // Determine dummy data based on field type and name
        if (field.primary) {
          // For primary keys, we can use a sequential number or a UUID
          // For simplicity, let's use a combination of module/model name and index
          value = `${toSnakeCase(model.name)}_${normalizedFieldName}_${i + 1}`;
          hasPrimary = true;
        } else if (
          field.name.toLowerCase().includes('id') ||
          field.name.toLowerCase().includes('guid')
        ) {
          // Generate a unique identifier for fields like id or guid
          value = `dummy_${normalizedFieldName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        } else if (field.name.toLowerCase().includes('name')) {
          value = `${toPascalCase(model.name)} ${normalizedFieldName} ${i + 1}`;
        } else if (field.name.toLowerCase().includes('description')) {
          value = `This is a dummy description for ${normalizedFieldName} record ${i + 1}.`;
        } else if (field.name.toLowerCase().includes('enabled')) {
          value = i % 2 === 0; // Alternate true/false
        } else {
          // Fallback for other field types
          switch (field.type.toLowerCase()) {
            case 'int':
            case 'bigint':
              value = i + 1;
              break;
            case 'string':
            case 'varchar':
              value = `${normalizedFieldName}_value_${i + 1}`;
              break;
            case 'boolean':
            case 'bool':
              value = i % 2 === 0;
              break;
            case 'date':
              value = new Date(Date.now() + i * 1000 * 60 * 60 * 24).toISOString().split('T')[0]; // Add days
              break;
            case 'datetime':
              value = new Date(Date.now() + i * 1000 * 60 * 60).toISOString(); // Add hours
              break;
            default:
              value = `${normalizedFieldName}_default_${i + 1}`;
          }
        }

        // Ensure value is not null if the field is not nullable, unless it's a default value that can be null
        if (!field.nullable && value === null && field.default === undefined) {
          // If the field is required and has no default, try to assign a placeholder or re-generate
          // For simplicity here, we'll assign a placeholder. More complex logic might be needed.
          value = `required_${normalizedFieldName}`;
        }

        record[field.name] = value; // Use original field name for the record object
      }

      // Ensure a primary key is set if the model has one defined, even if not explicitly in fields loop
      if (model.primaryKey && model.primaryKey.length > 0) {
        const pkFieldName = model.primaryKey[0]; // Assuming single primary key for simplicity
        const pkField = model.fields.find((f) => f.name === pkFieldName);
        if (pkField && !record[pkFieldName]) {
          record[pkFieldName] =
            `${toSnakeCase(model.name)}_${this.normalizeColumnName(pkFieldName)}_${i + 1}`;
        }
      }

      // Basic check to ensure the record is not empty, though ideally all fields should be populated
      if (Object.keys(record).length > 0) {
        dummyRecords.push(record);
      }
    }

    this.b.logWithContext(
      this,
      `generateDummyDataForModel:generated`,
      { count: dummyRecords.length, firstRecord: dummyRecords[0] },
      'debug',
    );
    return dummyRecords;
  }

  /////////////////////////////////////////////////////////////
  // PURGE MODULE DATA
  /////////////////////////////////////////////////////////////
  /**
   * Purges all data from the tables associated with the given module.
   * @param module The CdModuleDescriptor containing the models whose tables should be purged.
   * @returns A Promise resolving to CdFxReturn<null> indicating success or failure.
   */
  async purgeModuleFromDatabase(module: CdModuleDescriptor): Promise<CdFxReturn<null>> {
    try {
      this.b.logWithContext(
        this,
        `purgeModuleFromDatabase:start`,
        { module: module.name },
        'debug',
      );

      const initResult = await this.init({ purgeMode: true });
      if (!initResult.state) {
        return {
          state: false,
          data: null,
          message: `DbMigrationService could not be initialized: Error: ${initResult.message}`,
        };
      }

      if (!this.db || !this.db.isInitialized) {
        return {
          state: false,
          data: null,
          message: 'DbMigrationService not initialized. Call init() first.',
        };
      }

      // 1. Load current schema (tables + views)
      const destSchemaResult = await this.loadSchemaFromDatabase(module);
      if (!destSchemaResult.state || !destSchemaResult.data) {
        return { state: false, data: null, message: destSchemaResult.message };
      }
      const destSchema = destSchemaResult.data;

      this.b.logWithContext(this, `purgeModuleFromDatabase:start`, { destSchema }, 'debug');

      // 2. Collect purge targets (views, tables, backups)
      const dropMigrations: MigrationProfile[] = [];

      // 🔹 Views first
      for (const t of destSchema.tables.filter((t) => t.kind === 'view')) {
        dropMigrations.push({
          id: `drop-${t.name}`,
          source: { type: 'database', dsConfig: {}, dsSchema: { tables: [t] } },
          destination: { type: 'database', dsConfig: {}, dsSchema: destSchema },
          transformation: { type: 'drop', target: 'view', descriptor: t },
          description: `Drop view ${t.name}`,
        });
      }

      // 🔹 Backup tables
      const backupQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
        AND table_name LIKE '${toSnakeCase(module.name)}%_backup_%'
    `;
      const backupTables: any[] = await this.db.query(backupQuery);
      for (const row of backupTables) {
        const t = {
          name: row.TABLE_NAME,
          kind: 'table' as const,
          fields: [],
          indexes: [],
          relations: [],
        };
        dropMigrations.push({
          id: `drop-${t.name}`,
          source: { type: 'database', dsConfig: {}, dsSchema: { tables: [t] } },
          destination: { type: 'database', dsConfig: {}, dsSchema: destSchema },
          transformation: { type: 'drop', target: 'table', descriptor: t },
          description: `Drop backup table ${t.name}`,
        });
      }

      // 🔹 Normal tables last
      for (const t of destSchema.tables.filter((t) => t.kind === 'table')) {
        dropMigrations.push({
          id: `drop-${t.name}`,
          source: { type: 'database', dsConfig: {}, dsSchema: { tables: [t] } },
          destination: { type: 'database', dsConfig: {}, dsSchema: destSchema },
          transformation: { type: 'drop', target: 'table', descriptor: t },
          description: `Drop table ${t.name}`,
        });
      }

      this.b.logWithContext(
        this,
        `purgeModuleFromDatabase:migrations`,
        { count: dropMigrations.length },
        'warn',
      );

      // 3. Execute purge migrations
      for (const migration of dropMigrations) {
        const result = await this.applyMigration(migration);
        if (!result.state) {
          return { state: false, data: null, message: result.message };
        }
      }

      await this.closeConnection();
      return {
        state: true,
        data: null,
        message: `Purged module ${module.name} successfully (dropped ${dropMigrations.length} objects).`,
      };
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `Failed to purge module ${module.name}: ${err.message ?? err}`,
      };
    }
  }
}
