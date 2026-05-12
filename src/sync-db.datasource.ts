/**
 * Run this command in the terminal at the root directory
 * npx ts-node src/sync-db.datasource.ts
 */
import { DataSource } from "typeorm";
import { loadSyncableEntities } from "./config";
// import { loadEntityPaths } from "./config";

const AppDataSource = new DataSource({
  name: "conn2",
  type: "mysql",
  port: Number(process.env.DB_MS_PORT),
  host: process.env.DB_MS_HOST,
  username: process.env.DB_MS_USER,
  database: process.env.DB_MS_NAME,
  password: process.env.DB_MS_PWD,
  synchronize: true,
  // entities: [UserModel],
  entities: loadSyncableEntities(), // this reads from module-entities.json,
  migrations: [],
  subscribers: [],
  // logging: false,
  logging: [
    "query",
    'error',
    'schema',
    'warn',
    'info',
    'log'
  ],
});

AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database schema synced.");
  })
  .catch((err: any) => {
    console.error("❌ Failed to sync database:", err);
  });
