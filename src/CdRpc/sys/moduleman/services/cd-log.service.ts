// /**
//  * By G. Oremo
//  * April 2025
//  *
//  * CdLogService is a facility to query winston logs from the files.
//  * CdLogService workflow aim is to facilitate bug detection, system diagnostics.
//  * To Do:
//  * 1. Get ip from session and have ip as part of the winston log queriable fields
//  * 2. Get current session token so that cdToken becomes part of the queriable fields
//  *    - use * for selection of all and filter only by time
//  * 3. Rename to CdLogReaderService class
//  * 4. Integrate winston with database so we have the capacity to read from database
//  * 5. Integrate with cd-cli for automation for but detection and analysis
//  * 6. Integrate cd-cli automaton with AI to allow auto fixing of bug from the logs
//  */
// import * as fs from "fs/promises"; // For async/await stuff like fs.stat, fs.readFile
// import * as fsSync from "fs"; // For fs.existsSync, fs.createReadStream

// import * as path from "path";
// import * as readline from "readline";
// import { IQuery } from "../../base/i-base";
// import { BaseService } from "../../base/base.service";
// import { CdLogger } from "../../utils/cd-logger";

// export interface CdLogEntry {
//   app: string;
//   level: string;
//   message: string;
//   timestamp: string;
//   context?: any;
// }

// export interface CdLogQueryOptions {
//   phrase?: string;
//   since?: Date;
//   until?: Date;
//   limit?: number;
// }

// export class CdLogService {
//   b: any; // instance of BaseService
//   cdToken: string;
//   private logDir: string;
//   logger: any;

//   constructor() {
//     this.b = new BaseService();
//   }

//   async init(logDirectory?: string): Promise<void> {
//     this.logDir = logDirectory ?? path.resolve(process.cwd());

//     try {
//       const stat = await fs.stat(this.logDir);
//       if (!stat.isDirectory()) {
//         throw new Error(`Provided path is not a directory: ${this.logDir}`);
//       }
//     } catch (err: any) {
//       if (err.code === "ENOENT") {
//         // Optionally, create the directory or warn
//         console.warn(`Log directory does not exist: ${this.logDir}`);
//         // await fs.mkdir(this.logDir, { recursive: true });
//       } else {
//         throw err;
//       }
//     }
//   }

//   async getCdLog(req: Request, res: Response, q?: IQuery): Promise<any> {
//     try {
//       if (q === null) {
//         q = this.b.getQuery(req); // Extracts from req.body.dat.f_vals[0].query
//       }
//       CdLogger.debug('CdLogService::getCdLog()/q:', q)
//       const options = this.parseLogQueryOptions(req, q); // req passed in for fallback
//       const result = await this.queryLogs(req, res, q);
//       this.b.successResponse(req, res, result);
//     } catch (e: any) {
//       this.logger?.logInfo?.("CdLogService::getCdLog() error:", e);
//       this.b.err.push(e.toString());
//       const i = {
//         messages: this.b.err,
//         code: "CdLogService:getCdLog",
//         app_msg: "Failed to read logs.",
//       };
//       await this.b.serviceErr(req, res, e, i.code);
//       await this.b.respond(req, res);
//     }
//   }

//   private parseLogQueryOptions(req, q?: IQuery): CdLogQueryOptions {
//     if (q === null) {
//       q = this.b.getQuery(req); // safely extracted from req if not provided
//     }

//     const where = q?.where ?? {};
//     const opts: CdLogQueryOptions = {};

//     if (where.phrase) {
//       opts.phrase = where.phrase;
//     }

//     if (where.since) {
//       const unit = where.since.unit || "min";
//       const value = parseInt(where.since.value, 10) || 0;
//       const now = new Date();
//       const ms = this.unitToMs(unit, value);
//       opts.since = new Date(now.getTime() - ms);
//     }

//     if (where.until) {
//       const unit = where.until.unit || "min";
//       const value = parseInt(where.until.value, 10) || 0;
//       const now = new Date();
//       const ms = this.unitToMs(unit, value);
//       opts.until = new Date(now.getTime() - ms);
//     }

//     if (where.limit) {
//       opts.limit = parseInt(where.limit, 10) || 100;
//     }

//     return opts;
//   }

//   private unitToMs(unit: string, value: number): number {
//     const unitMap: { [key: string]: number } = {
//       sec: 1000,
//       min: 60 * 1000,
//       hr: 60 * 60 * 1000,
//       day: 24 * 60 * 60 * 1000,
//     };
//     return value * (unitMap[unit.toLowerCase()] || 60 * 1000); // default to min
//   }

//   private getLogFileName(date: Date): string {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     return `corpdesk-${year}-${month}-${day}.log`;
//   }

//   async queryLogs(req: Request, res: Response, q: IQuery): Promise<CdLogEntry[]> {
//     CdLogger.debug('CdLogService::queryLogs()/q:', q)
//     const now = new Date();
//     const where = q?.where ?? {};
//     CdLogger.debug('CdLogService::queryLogs()/where:', where)
//     const since = this.getDateFromWhere(where?.since, now, -20); // default: 20 mins ago
//     CdLogger.debug('CdLogService::queryLogs()/since:', since)
//     const until = this.getDateFromWhere(where?.until, now);
//     CdLogger.debug('CdLogService::queryLogs()/until:', until)

//     const fileName = this.getLogFileName(since);
//     CdLogger.debug('CdLogService::queryLogs()/fileName:', fileName)
//     const filePath = path.join(this.logDir, fileName);
//     CdLogger.debug('CdLogService::queryLogs()/filePath:', filePath)

//     if (!fsSync.existsSync(filePath)) {
//       throw new Error(`Log file does not exist: ${filePath}`);
//     }

//     const fileStream = fsSync.createReadStream(filePath);
//     const rl = readline.createInterface({
//       input: fileStream,
//       crlfDelay: Infinity,
//     });

//     const results: CdLogEntry[] = [];
//     const phrase = where?.phrase?.toLowerCase();

//     for await (const line of rl) {
//       try {
//         const log: CdLogEntry = JSON.parse(line);
//         const logTime = new Date(log.timestamp);

//         if (logTime >= since && logTime <= until) {
//           if (!phrase || log.message?.toLowerCase().includes(phrase)) {
//             results.push(log);
//             if (q.take && results.length >= q.take) break;
//           }
//         }
//       } catch (err) {
//         console.warn("Skipped invalid log line:", line);
//       }
//     }

//     const select = q.select ?? where.select; // 👈 Extract from q or where
//     // ✳️ Apply `select` filtering if present
//     if (Array.isArray(select) && select.length > 0) {
//       CdLogger.debug('CdLogService::queryLogs()/applying select')
//       const selectedFields = new Set(select);
//       CdLogger.debug('CdLogService::queryLogs()/selectedFields:', selectedFields)
//       CdLogger.debug('CdLogService::queryLogs()/results1:', results)
//       return results.map((log) =>
//         Object.fromEntries(
//           Object.entries(log).filter(([key]) => selectedFields.has(key))
//         )
//       ) as CdLogEntry[];
//     }
//     CdLogger.debug('CdLogService::queryLogs()/results2:', results)
//     return results;
//   }

//   private getDateFromWhere(
//     timeObj: { unit: string; value: string } | undefined,
//     referenceDate: Date,
//     defaultMinutesOffset: number = 0
//   ): Date {
//     if (!timeObj) {
//       return new Date(referenceDate.getTime() + defaultMinutesOffset * 60 * 1000);
//     }
//     const unit = timeObj.unit || "min";
//     const value = parseInt(timeObj.value, 10) || 0;
//     const ms = this.unitToMs(unit, value);
//     return new Date(referenceDate.getTime() - ms);
//   }

// }

/**
 * By G. Oremo
 * April 2025
 *
 * CdLogService is a utility to query and filter Winston log entries from log files.
 * Its core objective is to support:
 *   - System diagnostics
 *   - Bug detection
 *   - Analysis of recent activity via programmatic log scanning
 *
 * ---------------------
 * 📌 Roadmap / To-Do:
 * ---------------------
 * 1. Integrate corpdesk acl to that the facility has query privileges levels
 * 2. Implement paginated results
 * 3. Extract `ip` from current session and make it a queryable log field
 * 4. Capture `cdToken` for inclusion in logs as a searchable field
 * 5. Rename class to `CdLogReaderService` for clarity
 * 7. Extend logging to support database-backed storage (hybrid read modes)
 * 8. Integrate with `cd-cli` for automated diagnosis and log inspection
 * 9. Empower `cd-cli` with AI to support automatic bug detection and resolution
 * 10.
 */

// import * as fs from "fs/promises"; // async file ops
// import * as fsSync from "fs"; // sync file ops (streaming support)
// import * as path from "path";
// import * as readline from "readline";

// import { IQuery } from "../../base/i-base";
// import { BaseService } from "../../base/base.service";
// import { CdLogger } from "../../utils/cd-logger";

// // Structure of a single log line
// export interface CdLogEntry {
//   app: string;
//   level: string;
//   message: string;
//   timestamp: string;
//   context?: any;
// }

// // Optional query parameters when analyzing logs
// export interface CdLogQueryOptions {
//   phrase?: string;
//   since?: Date;
//   until?: Date;
//   limit?: number;
// }

// export class CdLogService {
//   b: any; // BaseService instance
//   cdToken: string; // Potentially assigned for future filtering
//   private logDir: string; // Log storage directory
//   logger: any; // Optional custom logger

//   constructor() {
//     this.b = new BaseService();
//   }

//   /**
//    * Initializes the log service with a target directory.
//    * If no path is provided, uses the process root.
//    */
//   async init(logDirectory?: string): Promise<void> {
//     this.logDir = logDirectory ?? path.resolve(process.cwd());

//     try {
//       const stat = await fs.stat(this.logDir);
//       if (!stat.isDirectory()) {
//         throw new Error(`Provided path is not a directory: ${this.logDir}`);
//       }
//     } catch (err: any) {
//       if (err.code === "ENOENT") {
//         console.warn(`Log directory does not exist: ${this.logDir}`);
//         // Optional: create it automatically
//         // await fs.mkdir(this.logDir, { recursive: true });
//       } else {
//         throw err;
//       }
//     }
//   }

//   /**
//    * Top-level request handler to return logs in response to a client request.
//    * - Extracts the query
//    * - Processes the logs
//    * - Responds via BaseService
//    */
//   async getCdLog(req: Request, res: Response, q?: IQuery): Promise<any> {
//     try {
//       if (!q) {
//         q = this.b.getQuery(req);
//       }

//       CdLogger.debug("CdLogService::getCdLog()/q:", q);
//       const options = this.parseLogQueryOptions(req, q);
//       const result = await this.queryLogs(req, res, q);
//       this.b.successResponse(req, res, result);
//     } catch (e: any) {
//       this.logger?.logInfo?.("CdLogService::getCdLog() error:", e);
//       this.b.err.push(e.toString());

//       const i = {
//         messages: this.b.err,
//         code: "CdLogService:getCdLog",
//         app_msg: "Failed to read logs.",
//       };

//       await this.b.serviceErr(req, res, e, i.code);
//       await this.b.respond(req, res);
//     }
//   }

//   /**
//    * Parses an IQuery into a structured log search filter.
//    * Supports flexible input for:
//    * - Time filtering (since/until)
//    * - Phrase matching
//    * - Result limits
//    */
//   private parseLogQueryOptions(req, q?: IQuery): CdLogQueryOptions {
//     if (!q) {
//       q = this.b.getQuery(req);
//     }

//     const where = q?.where ?? {};
//     const opts: CdLogQueryOptions = {};

//     if (where.phrase) opts.phrase = where.phrase;

//     if (where.since) {
//       const unit = where.since.unit || "min";
//       const value = parseInt(where.since.value, 10) || 0;
//       opts.since = new Date(Date.now() - this.unitToMs(unit, value));
//     }

//     if (where.until) {
//       const unit = where.until.unit || "min";
//       const value = parseInt(where.until.value, 10) || 0;
//       opts.until = new Date(Date.now() - this.unitToMs(unit, value));
//     }

//     if (where.limit) {
//       opts.limit = parseInt(where.limit, 10) || 100;
//     }

//     return opts;
//   }

//   /**
//    * Converts time units (min, sec, hr, etc.) into milliseconds.
//    */
//   private unitToMs(unit: string, value: number): number {
//     const unitMap: { [key: string]: number } = {
//       sec: 1000,
//       min: 60 * 1000,
//       hr: 60 * 60 * 1000,
//       day: 24 * 60 * 60 * 1000,
//     };
//     return value * (unitMap[unit.toLowerCase()] || 60 * 1000); // default: minutes
//   }

//   /**
//    * Generates the Winston log filename based on date.
//    * Example: corpdesk-2025-04-11.log
//    */
//   private getLogFileName(date: Date): string {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     return `corpdesk-${year}-${month}-${day}.log`;
//   }

//   /**
//    * Reads a Winston log file line-by-line and applies filters:
//    * - Time range: since/until
//    * - Phrase: keyword matching
//    * - Take: max results
//    * - Select: fields to include in the output
//    */
//   async queryLogs(req: Request, res: Response, q: IQuery): Promise<CdLogEntry[]> {
//     CdLogger.debug("CdLogService::queryLogs()/q:", q);
//     const now = new Date();
//     const where = q?.where ?? {};

//     const since = this.getDateFromWhere(where?.since, now, -20); // default: 20 mins ago
//     const until = this.getDateFromWhere(where?.until, now);

//     const fileName = this.getLogFileName(since);
//     const filePath = path.join(this.logDir, fileName);

//     if (!fsSync.existsSync(filePath)) {
//       throw new Error(`Log file does not exist: ${filePath}`);
//     }

//     const fileStream = fsSync.createReadStream(filePath);
//     const rl = readline.createInterface({
//       input: fileStream,
//       crlfDelay: Infinity,
//     });

//     const results: CdLogEntry[] = [];
//     const phrase = where?.phrase?.toLowerCase();

//     for await (const line of rl) {
//       try {
//         const log: CdLogEntry = JSON.parse(line);
//         const logTime = new Date(log.timestamp);

//         if (logTime >= since && logTime <= until) {
//           if (!phrase || log.message?.toLowerCase().includes(phrase)) {
//             results.push(log);
//             if (q.take && results.length >= q.take) break;
//           }
//         }
//       } catch (err) {
//         console.warn("Skipped invalid log line:", line);
//       }
//     }

//     // Check for 'select' field filtering — from q or where
//     const select = q.select ?? where.select;
//     if (Array.isArray(select) && select.length > 0) {
//       const selectedFields = new Set(select);
//       return results.map((log) =>
//         Object.fromEntries(
//           Object.entries(log).filter(([key]) => selectedFields.has(key))
//         )
//       ) as CdLogEntry[];
//     }

//     return results;
//   }

//   /**
//    * Parses a `since` or `until` object from query format to JS Date.
//    * If value is missing, applies fallback offset from now.
//    */
//   private getDateFromWhere(input: any, fallback: Date, offsetMins = -20): Date {
//     if (!input) {
//       return new Date(fallback.getTime() + offsetMins * 60 * 1000);
//     }

//     const unit = input.unit || "min";
//     const value = parseInt(input.value, 10) || 0;
//     const ms = this.unitToMs(unit, value);
//     return new Date(fallback.getTime() - ms);
//   }
// }

/**
 * By G. Oremo
 * April 2025
 *
 * CdLogService is a facility to query winston logs from the files.
 * CdLogService workflow aim is to facilitate bug detection, system diagnostics.
 * To Do:
 * 1. Get ip from session and have ip as part of the winston log queriable fields
 * 2. Get current session token so that cdToken becomes part of the queriable fields
 * 3. Rename to CdLogReaderService class
 * 4. Integrate winston with database so we have the capacity to read from database
 * 5. Integrate with cd-cli for automation for but detection and analysis
 * 6. Integrate cd-cli automaton with AI to allow auto fixing of bug from the logs
 */
import { Request, Response } from "express";
import * as fs from "fs/promises"; // For async/await stuff like fs.stat, fs.readFile
import * as fsSync from "fs"; // For fs.existsSync, fs.createReadStream

import * as path from "path";
import * as readline from "readline";
import { IQuery } from "../../base/i-base";
import { BaseService } from "../../base/base.service";
import { CdLogger } from "../../utils/cd-logger";
import { CdCacheModel } from "../models/cd-cache.model";
import { CdLogModel } from "../models/cd-log.model";
import { GenericService } from "../../base/generic-service";

export interface CdLogEntry {
  app: string;
  level: string;
  message: string;
  timestamp: string;
  context?: any;
}

export interface CdLogQueryOptions {
  phrase?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}

// export class CdLogService {
export class CdLogService extends GenericService<CdLogModel> {
  b: any; // instance of BaseService
  cdToken!: string;
  serviceModel = CdLogModel;
  docName: string = "CdLog";
  private logDir!: string;
  logger: any;

  constructor() {
    super(CdLogModel);
  }

  async init(logDirectory?: string): Promise<void> {
    this.logDir = logDirectory ?? path.resolve(process.cwd());

    try {
      const stat = await fs.stat(this.logDir);
      if (!stat.isDirectory()) {
        throw new Error(`Provided path is not a directory: ${this.logDir}`);
      }
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // Optionally, create the directory or warn
        console.warn(`Log directory does not exist: ${this.logDir}`);
        // await fs.mkdir(this.logDir, { recursive: true });
      } else {
        throw err;
      }
    }
  }

  async getCdLog(req: Request, res: Response, q?: IQuery): Promise<any> {
    try {
      if (q === null) {
        q = this.b.getQuery(req); // Extracts from req.body.dat.f_vals[0].query
      }
      CdLogger.debug("CdLogService::getCdLog()/q:", q);
      const options = this.parseLogQueryOptions(req, q); // req passed in for fallback
      if(!q){
        CdLogger.error("CdLogService::getCdLog() - No query provided");
        return [];
      }
      const result = await this.queryLogs(req, res, q);
      this.b.successResponse(req, res, result);
    } catch (e: any) {
      this.logger?.logInfo?.("CdLogService::getCdLog() error:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdLogService:getCdLog",
        app_msg: "Failed to read logs.",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  private parseLogQueryOptions(req: Request, q?: IQuery): CdLogQueryOptions {
    if (q === null) {
      q = this.b.getQuery(req); // safely extracted from req if not provided
    }

    const where = q?.where ?? {};
    const opts: CdLogQueryOptions = {};

    if (where.phrase) {
      opts.phrase = where.phrase;
    }

    if (where.since) {
      const unit = where.since.unit || "min";
      const value = parseInt(where.since.value, 10) || 0;
      const now = new Date();
      const ms = this.unitToMs(unit, value);
      opts.since = new Date(now.getTime() - ms);
    }

    if (where.until) {
      const unit = where.until.unit || "min";
      const value = parseInt(where.until.value, 10) || 0;
      const now = new Date();
      const ms = this.unitToMs(unit, value);
      opts.until = new Date(now.getTime() - ms);
    }

    if (where.limit) {
      opts.limit = parseInt(where.limit, 10) || 100;
    }

    return opts;
  }

  private unitToMs(unit: string, value: number): number {
    const unitMap: { [key: string]: number } = {
      sec: 1000,
      min: 60 * 1000,
      hr: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
    };
    return value * (unitMap[unit.toLowerCase()] || 60 * 1000); // default to min
  }

  private getLogFileName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `corpdesk-${year}-${month}-${day}.log`;
  }

  async queryLogs(
    req: Request,
    res: Response,
    q: IQuery,
  ): Promise<CdLogEntry[]> {
    CdLogger.debug("CdLogService::queryLogs()/q:", q);
    const now = new Date();
    const where = q?.where ?? {};
    CdLogger.debug("CdLogService::queryLogs()/where:", where);
    const since = this.getDateFromWhere(where?.since, now, -20); // default: 20 mins ago
    CdLogger.debug("CdLogService::queryLogs()/since:", since);
    const until = this.getDateFromWhere(where?.until, now);
    CdLogger.debug("CdLogService::queryLogs()/until:", until);

    const fileName = this.getLogFileName(since);
    CdLogger.debug("CdLogService::queryLogs()/fileName:", fileName);
    const filePath = path.join(this.logDir, fileName);
    CdLogger.debug("CdLogService::queryLogs()/filePath:", filePath);

    if (!fsSync.existsSync(filePath)) {
      throw new Error(`Log file does not exist: ${filePath}`);
    }

    const fileStream = fsSync.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const results: CdLogEntry[] = [];
    const phrase = where?.phrase?.toLowerCase();

    for await (const line of rl) {
      try {
        const log: CdLogEntry = JSON.parse(line);
        const logTime = new Date(log.timestamp);

        if (logTime >= since && logTime <= until) {
          if (!phrase || log.message?.toLowerCase().includes(phrase)) {
            results.push(log);
            if (q.take && results.length >= q.take) break;
          }
        }
      } catch (err) {
        console.warn("Skipped invalid log line:", line);
      }
    }

    const select = q.select ?? where.select; // 👈 Extract from q or where
    // ✳️ Apply `select` filtering if present
    if (Array.isArray(select) && select.length > 0) {
      CdLogger.debug("CdLogService::queryLogs()/applying select");
      const selectedFields = new Set(select);
      CdLogger.debug(
        "CdLogService::queryLogs()/selectedFields:",
        selectedFields,
      );
      CdLogger.debug("CdLogService::queryLogs()/results1:", results);
      return results.map((log) =>
        Object.fromEntries(
          Object.entries(log).filter(([key]) => selectedFields.has(key)),
        ),
      ) as CdLogEntry[];
    }
    CdLogger.debug("CdLogService::queryLogs()/results2:", results);
    return results;
  }

  private getDateFromWhere(
    timeObj: { unit: string; value: string } | undefined,
    referenceDate: Date,
    defaultMinutesOffset: number = 0,
  ): Date {
    if (!timeObj) {
      return new Date(
        referenceDate.getTime() + defaultMinutesOffset * 60 * 1000,
      );
    }
    const unit = timeObj.unit || "min";
    const value = parseInt(timeObj.value, 10) || 0;
    const ms = this.unitToMs(unit, value);
    return new Date(referenceDate.getTime() - ms);
  }
}
