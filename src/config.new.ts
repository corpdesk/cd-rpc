// <proj-directory>/src/config.ts

import Redis, {
  Cluster,
  RedisOptions,
  ClusterNode,
} from "ioredis";

import * as fs from "fs";
import * as dotenv from "dotenv";
import "reflect-metadata";

import {
  DataSource,
  DataSourceOptions,
} from "typeorm";

import path from "path";
import { inspect } from "util";

// NOTE:
// Adjust import paths below to reflect cd-rpc structure
// Example:
// import { RunMode } from "./CdRpc/sys/base/i-base";
// import { ModuleConfig } from "./CdRpc/sys/moduleman/models/module.model";

import { RunMode } from "./CdRpc/sys/base/i-base";
import { ModuleConfig } from "./CdRpc/sys/moduleman/models/module.model";

dotenv.config();

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type RedisMode =
  | "PUSH_CLUSTER"
  | "PUSH_SENTINEL"
  | "PUSH_SINGLE";

interface PushConfig {
  mode: RedisMode;
  serverHost: string;
  serverPort: number;
  redisHost: string;
  redisPort: number;
  startupNodes: ClusterNode[];
  sentinalOptions: RedisOptions;
}

// -----------------------------------------------------------------------------
// MODULE ENTITY LOADER
// -----------------------------------------------------------------------------
//
// NOTE:
// cd-rpc is NOT the primary persistence layer.
// Therefore:
// - SQLite support is retained for lightweight local state/caching/testing.
// - MySQL configuration is intentionally removed.
// - Entity loading remains because:
//    * rpc modules may still define local entities
//    * AI orchestration may require lightweight local stores
//    * caching / queue / workflow persistence may be needed later
//
// -----------------------------------------------------------------------------

const entitiesConfigPath = path.join(
  __dirname,
  "configs",
  "module-entities.json",
);

export function loadEntityPaths(): string[] {
  try {
    const modules: ModuleConfig[] = JSON.parse(
      fs.readFileSync(entitiesConfigPath, "utf8"),
    );

    return modules
      .filter((m: ModuleConfig) => m.enabled)
      .map((m: ModuleConfig) =>
        path.join(
          __dirname,
          `CdRpc/${m.ctx}/${m.moduleName}/models/*.model.ts`,
        ),
      );
  } catch (err) {
    console.error(
      "Failed to load entity modules:",
      err,
    );
    return [];
  }
}

export function loadSyncableEntities(): string[] {
  try {
    console.log(
      "config/loadSyncableEntities()/start",
    );

    const modules: ModuleConfig[] = JSON.parse(
      fs.readFileSync(entitiesConfigPath, "utf8"),
    );

    console.log(
      `config/loadSyncableEntities()/modules:${inspect(
        modules,
        { depth: 2 },
      )}`,
    );

    return modules
      .filter((m: ModuleConfig) => m.syncable)
      .map((m: ModuleConfig) =>
        path.join(
          __dirname,
          `CdRpc/${m.ctx}/${m.moduleName}/models/*.model.ts`,
        ),
      );
  } catch (err) {
    console.error(
      "Failed to load syncable entity modules:",
      err,
    );
    return [];
  }
}

const ENTITIES = loadEntityPaths();

// -----------------------------------------------------------------------------
// SQLITE
// -----------------------------------------------------------------------------

const sqliteConfig: DataSourceOptions = {
  name: "default",
  type: "sqlite",
  database: path.join(
    __dirname,
    "database.sqlite",
  ),
  synchronize: false,
  entities: ENTITIES,
  logging: [
    "query",
    "error",
    "warn",
    "log",
  ],
};

export const AppDataSource = new DataSource(
  sqliteConfig,
);

export async function sqliteConfigFx(
  connName: string,
): Promise<DataSourceOptions> {
  return {
    name: connName,
    type: "sqlite",
    database: path.join(
      __dirname,
      "database.sqlite",
    ),
    synchronize: false,
    entities: ENTITIES,
    logging: false,
  };
}

// -----------------------------------------------------------------------------
// CD-API CONNECTION CONFIG
// -----------------------------------------------------------------------------
//
// cd-rpc is a CLIENT of cd-api
//
// Route:
// ai-agent -> cd-rpc -> cd-api
// cli      -> cd-rpc -> cd-api
// http app -> cd-rpc -> cd-api
//
// -----------------------------------------------------------------------------

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

const RPC_HOST_NAME =
  process.env.RPC_HOST_NAME || "localhost";

const RPC_HOST_IP =
  process.env.RPC_HOST_IP || "127.0.0.1";

const RPC_PORT =
  process.env.RPC_PORT || "3010";

const RPC_ROUTE =
  process.env.RPC_ROUTE || "/rpc";

const RPC_URL =
  process.env.RPC_URL || "https://localhost";

const RPC_ENDPOINT = `${RPC_URL}:${RPC_PORT}${RPC_ROUTE}`;

// -----------------------------------------------------------------------------
// HTTP CONFIG
// -----------------------------------------------------------------------------

const HTTP_PORT =
  process.env.HTTP_PORT || "8080";

const HTTP_WEBROOT =
  process.env.HTTP_WEBROOT ||
  "/.well-known/acme-challenge";

const HTTP_ENABLED =
  process.env.HTTP_ENABLED === "true";

// -----------------------------------------------------------------------------
// SSL CONFIG
// -----------------------------------------------------------------------------

const SECURE =
  process.env.SECURE || "false";

const KEY_PATH =
  process.env.KEY_PATH || "";

const CERT_PATH =
  process.env.CERT_PATH || "";

const CSR_PATH =
  process.env.CSR_PATH || "";

// -----------------------------------------------------------------------------
// MAIL CONFIG
// -----------------------------------------------------------------------------

export const empMailConfig = {
  domain: "empservices.co.ke",
  incomingServer: "mail.empservices.co.ke",
  imapPort: 993,
  outgoingServer: "mail.empservices.co.ke",
  smtpPort: 465,
};

// -----------------------------------------------------------------------------
// EXPORT CONFIG
// -----------------------------------------------------------------------------

export default {
  // ---------------------------------------------------------------------------
  // RUN MODE
  // ---------------------------------------------------------------------------

  runMode:
    RunMode.UNRESTRICTED_DEVELOPER_MODE,

  // ---------------------------------------------------------------------------
  // DATABASES
  // ---------------------------------------------------------------------------

  ds: {
    sqlite: new DataSource(sqliteConfig),
  },

  sqlite: sqliteConfig,

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

  // ---------------------------------------------------------------------------
  // SECURITY
  // ---------------------------------------------------------------------------

  secure: SECURE,

  keyPath: KEY_PATH,

  certPath: CERT_PATH,

  caPath: CSR_PATH,

  // ---------------------------------------------------------------------------
  // HTTP
  // ---------------------------------------------------------------------------

  http: {
    enabled: HTTP_ENABLED,
    port: HTTP_PORT,
    webroot: HTTP_WEBROOT,
  },

  // ---------------------------------------------------------------------------
  // PUSH SERVICES
  // ---------------------------------------------------------------------------

  pushService: {
    sio: {
      enabled: true,
    },

    wss: {
      enabled: false,
    },

    pusher: {
      enabled: false,
    },
  },

  // ---------------------------------------------------------------------------
  // REDIS PUSH CONFIG
  // ---------------------------------------------------------------------------

  push: {
    mode:
      (process.env.PUSH_MODE as RedisMode) ||
      "PUSH_SINGLE",

    serverHost:
      process.env.SIO_HOST ||
      "127.0.0.1",

    serverPort: parseInt(
      process.env.SIO_PORT || "3000",
      10,
    ),

    redisHost:
      process.env.DB_REDIS_HOST ||
      "127.0.0.1",

    redisPort: parseInt(
      process.env.DB_REDIS_PORT || "6379",
      10,
    ),

    startupNodes: [
      {
        host:
          process.env.DB_REDIS_HOST ||
          "127.0.0.1",
        port: 6380,
      },
      {
        host: "127.0.0.1",
        port: 6381,
      },
    ],

    sentinalOptions: {
      sentinels: [
        {
          host:
            process.env.DB_REDIS_HOST ||
            "127.0.0.1",

          port: parseInt(
            process.env.DB_REDIS_PORT ||
              "6379",
            10,
          ),
        },
      ],

      name: "master01",
    } as RedisOptions,
  } as PushConfig,

  // ---------------------------------------------------------------------------
  // CACHE
  // ---------------------------------------------------------------------------

  cache: {
    ttl: parseInt(
      process.env.CACHE_TTL || "600",
      10,
    ),
  },

  usePush: true,
  usePolling: true,
  useCacheStore: true,

  // ---------------------------------------------------------------------------
  // EMAIL
  // ---------------------------------------------------------------------------

  emailUsers: [
    {
      name: "ASDAP",

      email:
        process.env.EMAIL_ADDRESS,

      user:
        process.env.EMAIL_USERNAME,

      pass:
        process.env.EMAIL_PASSWORD,

      config: empMailConfig,

      auth: {
        user:
          process.env.EMAIL_USERNAME,

        pass:
          process.env.EMAIL_PASSWORD,
      },
    },
  ],

  emailApiKeys: {
    zepto:
      process.env.MAIL_ZEPTO_API_KEY,
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

  // ---------------------------------------------------------------------------
  // BACK4APP
  // ---------------------------------------------------------------------------

  back4app: {
    url: process.env.B4A_URL,

    appId:
      process.env.X_Parse_Application_Id,

    apiKey:
      process.env.X_Parse_REST_API_Key,
  },

  // ---------------------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------------------

  Cors: {
    options: {
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Authorization",
        "Accept",
        "X-Access-Token",
      ],

      credentials: true,

      methods:
        "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",

      origin: [
        `https://${RPC_HOST_IP}`,
        `https://${RPC_HOST_NAME}`,

        `https://${API_HOST_IP}`,
        `https://${API_HOST_NAME}`,

        "https://localhost:443",
        "https://127.0.0.1:443",

        "http://localhost:5173",
        "https://localhost:5173",

        "http://localhost:80",
        "http://127.0.0.1:80",
      ],

      preflightContinue: false,
    },
  },
};

// -----------------------------------------------------------------------------
// MAIL CONFIG HELPER
// -----------------------------------------------------------------------------

export function mailConfig(
  username: string,
  password: string,
) {
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