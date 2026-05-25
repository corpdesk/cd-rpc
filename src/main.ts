// src/main.ts

import express from "express";
import cors from "cors";

import fs from "fs";
import http from "http";
import https from "https";

// import { CdInit } from "./CdRpc/init.js";

// import { Logger } from "./CdRpc/sys/logging/logger.js";
import { Logging } from "./CdRpc/sys/base/winston.log";
import config from "./config";
import { CdInit } from "./CdRpc/init";

export class Main {
  private logger = new Logging();

  async run() {
    const app = express();

    app.use(cors(config.Cors.options));
    app.use(express.json());

    // -------------------------------------------------------------
    // HTTP validation webroot
    // -------------------------------------------------------------

    if (config.http.enabled) {
      http.createServer(app).listen(config.http.port, () => {
        this.logger.logInfo(
          `HTTP validation server running on ${config.http.port}`,
        );
      });
    }

    // -------------------------------------------------------------
    // RPC Route
    // -------------------------------------------------------------

    app.post(config.rpc.route, async (req, res) => {
      return await CdInit(req, res);
    });

    // -------------------------------------------------------------
    // HTTPS / HTTP API Server
    // -------------------------------------------------------------

    let server: http.Server | https.Server;

    if (config.secure === "true") {
      this.logger.logInfo("Starting HTTPS server");

      server = https.createServer(
        {
          key: fs.readFileSync(config.keyPath!),
          cert: fs.readFileSync(config.certPath!),
        },
        app,
      );
    } else {
      this.logger.logInfo("Starting HTTP server");

      server = http.createServer(app);
    }

    server.listen(config.rpc.port, () => {
      this.logger.logInfo(`cd-rpc listening on ${config.rpc.port} in ${config.runMode} mode`);
    });
  }
}