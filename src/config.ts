// <proj-directory>/src/config.ts
import mysql from "mysql2";
import Redis, { Cluster, RedisOptions, ClusterNode } from 'ioredis';
import * as fs from "fs";
import * as dotenv from "dotenv";
import "reflect-metadata";
import { DataSource, DataSourceOptions, DatabaseType } from "typeorm";
import path, { dirname, join } from "path";
import { RunMode } from "./CdRpc/sys/base/i-base";
import { inspect } from "util";
import { ModuleConfig } from "./CdRpc/sys/moduleman/models/module.model";
import { fileURLToPath } from "url";
dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

export const CONFIG_FILE_PATH = join(process.env.HOME || '~/', '.cd-cli/cd-cli.profiles.json');

// 1. Define strict types for your configuration
type RedisMode = 'PUSH_CLUSTER' | 'PUSH_SENTINEL' | 'PUSH_SINGLE';

interface PushConfig {
  mode: RedisMode;
  serverHost: string;
  serverPort: number;
  redisHost: string;
  redisPort: number;
  startupNodes: ClusterNode[];
  sentinalOptions: RedisOptions;
}

/**
 * this section needs to be automated.
 * the automation should be integrated during installation of given module
 * both front end and backend should be considered in installation process of given module.
 */
// const ENTITIES = [
//   __dirname + "/CdRpc/sys/user/models/*.model.ts",
//   __dirname + "/CdRpc/sys/moduleman/models/*.model.ts",
//   __dirname + "/CdRpc/sys/comm/models/*.model.ts",
//   __dirname + "/CdRpc/sys/cd-cli/models/*.model.ts",
//   __dirname + "/CdRpc/sys/scheduler/models/*.model.ts",
//   __dirname + "/CdRpc/sys/cd-dev/models/*.model.ts",
//   __dirname + "/CdRpc/app/cd-accts/models/*.model.ts",
//   __dirname + "/CdRpc/app/coops/models/*.model.ts",
//   __dirname + "/CdRpc/app/cd-geo/models/*.model.ts",
// ];

const entitiesConfigPath = path.join(
  __dirname,
  "configs",
  "module-entities.json"
);

export function loadEntityPaths(): string[] {
  try {
    const modules = JSON.parse(fs.readFileSync(entitiesConfigPath, "utf8"));
    return modules
      .filter((m: ModuleConfig) => m.enabled)
      .map((m: ModuleConfig) =>
        path.join(__dirname, `CdRpc/${m.ctx}/${m.moduleName}/models/*.model.ts`)
      );
  } catch (err) {
    console.error("Failed to load entity modules:", err);
    return [];
  }
}

export function loadSyncableEntities(): string[] {
  try {
    console.log("start loading syncable entities...");
    const modules: ModuleConfig[] = JSON.parse(fs.readFileSync(entitiesConfigPath, "utf8"));
    console.log(
      `config/loadSyncableEntities()/modules:${inspect(modules, { depth: 2 })}`
    );
    return modules
      .filter((m: ModuleConfig) => m.syncable)
      .map((m: ModuleConfig) =>
        path.join(__dirname, `CdRpc/${m.ctx}/${m.moduleName}/models/*.model.ts`)
      );
  } catch (err) {
    console.error("Failed to load entity modules:", err);
    return [];
  }
}

const ENTITIES = loadEntityPaths();

export const AppDataSource = new DataSource({
  name: "conn2",
  type: "mysql",
  port: Number(process.env.DB_MS_PORT),
  host: process.env.DB_MS_HOST,
  username: process.env.DB_MS_USER,
  database: process.env.DB_MS_NAME,
  password: process.env.DB_MS_PWD,
  synchronize: false,
  // entities: [UserModel],
  entities: ENTITIES,
  migrations: [],
  subscribers: [],
  // logging: false,
  logging: [
    "query",
    // 'error',
    // 'schema',
    // 'warn',
    // 'info',
    // 'log'
  ],
});

const mysqlConfig: DataSourceOptions = {
  name: "default",
  type: "mysql",
  port: parseInt(process.env.DB_MS_PORT || "3306", 10), // Ensure port is a number,
  host: process.env.DB_MS_HOST,
  username: process.env.DB_MS_USER,
  database: process.env.DB_MS_NAME,
  password: process.env.DB_MS_PWD,
  entities: ENTITIES,
  /**
   * LOGGING OPTIONS
   * query - logs all queries.
   * error - logs all failed queries and errors.
   * schema - logs the schema build process.
   * warn - logs internal orm warnings.
   * info - logs internal orm informative messages.
   * log - logs internal orm log messages.
   */
  // logging: [
  //     'query',
  //     // 'error',
  //     // 'schema',
  //     // 'warn',
  //     // 'info',
  //     // 'log'
  // ],
  logging: ["query", "error", "warn", "log"],
  // logging: "all"
};
// const mysqlConfig: DataSourceOptions = {
//   name: "default",
//   type: "mysql", // Ensures TypeORM understands it's MySQL and not Aurora MySQL
//   port: parseInt(process.env.DB_MS_PORT || "3306", 10), // Ensure port is a number
//   host: process.env.DB_MS_HOST || "localhost", // Provide defaults if undefined
//   username: process.env.DB_MS_USER || "root",
//   password: process.env.DB_MS_PWD || "",
//   database: process.env.DB_MS_NAME || "test",
//   entities: ENTITIES,
//   logging: ["query", "error", "warn", "log"],
// };

const mysqlConfig2 = {
  type: "mysql",
  port: process.env.DB_MS_PORT,
  host: process.env.DB_MS_HOST,
  username: process.env.DB_MS_USER,
  database: process.env.DB_MS_NAME,
  password: process.env.DB_MS_PWD,
  synchronize: true,
  entities: ENTITIES,
  migrations: [],
  subscribers: [],
  // logging: false,
  logging: [
    "query",
    // 'error',
    // 'schema',
    // 'warn',
    // 'info',
    // 'log'
  ],
};

// export const sqliteConfig = {
//   name: process.env.DB_SL_NAME,
//   type: "sqlite",
//   database: __dirname + "/database.sqlite",
//   synchronize: false,
//   // keepConnectionAlive: true,
//   logging: false,
//   entities: ENTITIES,
// };
const sqliteConfig: DataSourceOptions = {
  name: "default",
  type: "sqlite", // Ensures TypeORM understands it's MySQL and not Aurora MySQL
  database: __dirname + "/database.sqlite",
  synchronize: false,
  entities: ENTITIES,
  logging: ["query", "error", "warn", "log"],
};

export async function sqliteConfigFx(connName: string): Promise<any> {
  return {
    name: connName,
    type: "sqlite",
    database: __dirname + "/database.sqlite",
    synchronize: false,
    // keepConnectionAlive: true,
    logging: false,
    entities: ENTITIES,
  };
}

const API_HOST_NAME =
  process.env.API_HOST_NAME || "localhost";

const API_HOST_IP =
  process.env.API_HOST_IP || "127.0.0.1";

const API_PORT =
  process.env.API_PORT || "3001";

const API_ROUTE =
  process.env.API_ROUTE || "/api";

const API_URL =
  process.env.API_URL || "https://localhost";

const API_ENDPOINT = `${API_URL}:${API_PORT}${API_ROUTE}`;

// -----------------------------------------------------------------------------
// RPC SERVER CONFIG
// -----------------------------------------------------------------------------



const RPC_URL =
  process.env.RPC_URL || "https://localhost";



const RPC_HOST_NAME = process.env.RPC_HOST_NAME;
const RPC_HOST_IP = process.env.RPC_HOST_IP;
// http port for runnint webroot without SSL. Used by letsencrypt validation and automation
const HTTP_PORT = process.env.HTTP_PORT;
// control the server to serve http or not. Eg cd-api should be able to serve http but sio should not.
const HTTP_WEBROOT = process.env.HTTP_WEBROOT;
const HTTP_ENABLED = process.env.HTTP_ENABLED === "true";
const RPC_PORT = process.env.RPC_PORT;
const RPC_ROUTE = process.env.RPC_ROUTE;
const END_POINT = `${process.env.RPC_URL}:${RPC_PORT}`;

const RPC_ENDPOINT = `${RPC_URL}:${RPC_PORT}${RPC_ROUTE}`;

// Username: 	accosca-6@empservices.co.ke
// Password: 	Use the email account’s password.
// Incoming Server: 	mail.empservices.co.ke
// IMAP Port: 993 POP3 Port: 995
// Outgoing Server: 	mail.empservices.co.ke
// SMTP Port: 465
// IMAP, POP3, and SMTP require authentication.
export const empMailConfig = {
  domain: "empservices.co.ke",
  incomingServer: "mail.empservices.co.ke",
  imapPort: 993,
  outgoingServer: "mail.empservices.co.ke",
  smtpPort: 465,
};
export default {
  cdApiLocal: 'cd-api-local',
  runMode: RunMode.UNRESTRICTED_DEVELOPER_MODE,
  ds: {
    sqlite: new DataSource(sqliteConfig),
    mysql: new DataSource(mysqlConfig),
  },
  // ---------------------------------------------------------------------------
  // CD-API CLIENT CONFIG
  // ---------------------------------------------------------------------------

  api: {
    hostName: API_HOST_NAME,
    hostIp: API_HOST_IP,
    port: API_PORT,
    route: API_ROUTE,
    url: API_URL,
    endpoint: API_ENDPOINT,
  },

  // ---------------------------------------------------------------------------
  // RPC SERVER CONFIG
  // ---------------------------------------------------------------------------

  rpc: {
    hostName: RPC_HOST_NAME,
    hostIp: RPC_HOST_IP,
    port: RPC_PORT,
    route: RPC_ROUTE,
    url: RPC_URL,
    endpoint: RPC_ENDPOINT,
  },
  pushService: {
    sio: {
      enabled: true,
    },
    wss: {
      enabled: false,
    },
    pusher: {
      enabled: true,
    },
  },
  wssPort: process.env.WSS_PORT,
  secure: process.env.SECURE,
  // httpPort: HTTP_PORT,
  http: {
    hostName: RPC_HOST_NAME,
    hostIp: RPC_HOST_IP,
    enabled: HTTP_ENABLED,
    port: HTTP_PORT,
    webroot: HTTP_WEBROOT,
  },
  keyPath: process.env.KEY_PATH,
  certPath: process.env.CERT_PATH,
  caPath: process.env.CSR_PATH,
  // apiPort: process.env.RPC_PORT,
  // apiRoute: RPC_ROUTE,
  endPoint: END_POINT,
  cacheTtl: process.env.CACHE_TTL,
  userActivationUrl: process.env.USER_ACTIVATION_URL,
  emailUsers: [
    {
      name: "ASDAP",
      email: process.env.EMAIL_ADDRESS,
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
      config: empMailConfig,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    },
    {
      name: "asdap-admin",
      email: "asdap-admin@empservices.co.ke",
      user: "asdap-admin@empservices.co.ke",
      pass: process.env.EMAIL_ASDAP_PASS,
      config: empMailConfig,
      auth: {
        user: "asdap-admin@empservices.co.ke",
        pass: process.env.EMAIL_ASDAP_PASS,
      },
    },
  ],
  emailApiKeys: {
    zepto: process.env.MAIL_ZEPTO_RPC_KEY,
  },
  emailInterface: [
    {
      name: "zeptomail",
      active: false,
    },
    {
      name: "nodemailer",
      active: true,
    },
  ],
  back4app: {
    url: process.env.B4A_URL,
    appId: process.env.X_Parse_Application_Id,
    apiKey: process.env.X_Parse_REST_RPC_Key,
  },
  Cors: {
    options: {
      // key:fs.readFileSync(path.join(process.env.CERT_PATH)),
      // cert:fs.readFileSync(path.join(process.env.KEY_PATH)),
      // ca:fs.readFileSync(path.join(process.env.CSR_PATH)),
      // requestCert: false,
      // rejectUnauthorized: false,
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Authorization",
        "Accept",
        "X-Access-Token",
      ],
      credentials: true,
      methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
      origin: [
        `https://${RPC_HOST_IP}`,
        `https://localhost:443`,
        `https://127.0.0.1:443`,
        `https://localhost:5173`,
        `http://localhost:5173`,
        `http://localhost:80`,
        `http://127.0.0.1:80`,
        `https://${RPC_HOST_NAME}`,
        `https://www.${RPC_HOST_NAME}`,
        `https://cd-user.${RPC_HOST_NAME}`,
        `https://cd-comm.${RPC_HOST_NAME}`,
        `https://cd-moduleman.${RPC_HOST_NAME}`,
      ],
      preflightContinue: false,
    },
  },
  db: mysqlConfig,
  db2: mysqlConfig2,
  sqlite: sqliteConfig,
  // push: {
  //   mode: process.env.PUSH_MODE,
  //   serverHost: "https://146.190.165.51",
  //   serverPort: process.env.SIO_PORT,
  //   redisHost: process.env.REDIS_HOST,
  //   redisPort: process.env.REDIS_PORT,
  //   /**
  //    * for redis-adapter cluster
  //    */
  //   startupNodes: [
  //     {
  //       port: 6380,
  //       host: process.env.REDIS_HOST,
  //     },
  //     {
  //       port: 6381,
  //       host: "146.190.165.51",
  //     },
  //   ],
  //   /**
  //    * for redis-adapter sentinel
  //    */
  //   sentinalOptions: {
  //     sentinels: [
  //       { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) },
  //       { host: "asdap.africa", port: Number(process.env.REDIS_PORT) },
  //     ],
  //     name: "master01",
  //   },
  // },
  push: {
    // Cast the mode or default to single instance
    mode: (process.env.PUSH_MODE as RedisMode) || 'PUSH_SINGLE',
    serverHost: "https://146.190.165.51",
    serverPort: parseInt(process.env.SIO_PORT || '3000', 10),
    redisHost: process.env.REDIS_HOST || '127.0.0.1',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    
    startupNodes: [
      {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: 6380,
      },
      {
        host: "146.190.165.51",
        port: 6381,
      },
    ],

    sentinalOptions: {
      sentinels: [
        { 
          host: process.env.REDIS_HOST || '127.0.0.1', 
          port: parseInt(process.env.REDIS_PORT || '6379', 10) 
        },
        { 
          host: "asdap.africa", 
          port: parseInt(process.env.REDIS_PORT || '6379', 10) 
        },
      ],
      name: "master01",
    } as RedisOptions,
  } as PushConfig,
  cache: {
    ttl: 600,
  },
  usePush: true,
  usePolling: true,
  useCacheStore: true,
};

export function mailConfig(username: string, password: string) {
  return {
    mailService: "cloudmailin",
    host: "zohomail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: username,
      pass: password,
    },
    logger: true,
  };
}
