// // src/CdRpc/sys/utils/request.ts
// import { Request, Response } from "express";
// import { Logging } from "../base/winston.log";

// export class CdRequest {
//   logger: Logging;
//   constructor() {
//     this.logger = new Logging();
//   }

//   async processPost(req: Request, resp: Response, callback: () => void) {
//     this.logger.logInfo("CdRequest::processPost()/01");
//     let contentType;
//     if (req.method === "POST") {
//       this.logger.logInfo("CdRequest::processPost()/02");
//       contentType = req.headers["content-type"];
//       (req as any).post = req.body;
//       const inp = await (req as any).post;
//       callback();
//     } else {
//       this.logger.logInfo("CdRequest::processPost()/04");
//       return {};
//     }
//   }
// }

// // function getCircularReplacer() {
// //     const seen = new WeakSet();
// //     return (key, value) => {
// //         if (typeof value === "object" && value !== null) {
// //             if (seen.has(value)) {
// //                 return;
// //             }
// //             seen.add(value);
// //         }
// //         return value;
// //     };
// // }

import { Request, Response } from "express";
import { randomUUID } from "crypto";

import { Logging } from "../base/winston.log";

// import { RuntimeContextService } from "../../sys/dev-descriptor/services/runtime-context.service";

import { ICdExecutionContext } from "../../sys/dev-descriptor/models/runtime-descriptor.model";
import { RuntimeContextService } from "../base/runtime-context.service";

export class CdRequest {
  logger: Logging;

  constructor() {
    this.logger = new Logging();
  }

  async processPost(
    req: Request,
    res: Response,
    callback: () => Promise<void>,
  ) {
    this.logger.logInfo("CdRequest::processPost()/01");

    if (req.method !== "POST") {
      this.logger.logInfo("CdRequest::processPost()/invalid-method");

      return {};
    }

    this.logger.logInfo("CdRequest::processPost()/02");

    // ---------------------------------------------------
    // Normalize payload
    // ---------------------------------------------------

    const payload = req.body;

    (req as any).post = payload;

    // ---------------------------------------------------
    // Build execution context
    // ---------------------------------------------------

    const cdCtx: ICdExecutionContext = {
      requestId: randomUUID(),

      transport: "http",

      request: payload,

      runtime: {
        cache: new Map<string, any>(),
        startedAt: Date.now(),
      },

      meta: {
        controller: payload?.c,
        action: payload?.a,
        module: payload?.m,
      },
    };

    // ---------------------------------------------------
    // Enter runtime boundary
    // ---------------------------------------------------

    return RuntimeContextService.run(
      cdCtx,
      async () => {
        try {
          this.logger.logInfo(
            `CdRequest::processPost()/runtime-start requestId:${cdCtx.requestId}`,
          );

          await callback();

          this.logger.logInfo(
            `CdRequest::processPost()/runtime-end requestId:${cdCtx.requestId}`,
          );
        } catch (e: any) {
          this.logger.logError(
            `CdRequest::processPost()/runtime-error:${e.message}`,
          );

          throw e;
        }
      },
    );
  }
}
