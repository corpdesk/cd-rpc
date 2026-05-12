import { Request, Response } from "express";
// import { BaseService } from "../../base/base.service";
// import { GenericService } from "../../base/generic-service";
import {
  CdBioEngineDnaModel,
  ICdBioEngineDnaUpdatePayload,
  ISemanticMutationResult,
} from "../models/cd-bio-engine-dna.model";
import { GenericService } from "../../../sys/base/generic-service";
import { BaseService } from "../../../sys/base/base.service";
import {
  JSDPInstruction,
  IQuery,
  IServiceInput,
  ISessionDataExt,
} from "../../../sys/base/i-base";
import { CdBioEngineDnaViewModel } from "../models/cd-bio-engine-dna-view.model";
import { SessionService } from "../../../sys/user/services/session.service";
import { Logging } from "../../../sys/base/winston.log";
import { inspect } from "util";
// import { IServiceInput, IQuery } from "../../base/i-base";

export class CdBioEngineDnaService extends GenericService<CdBioEngineDnaModel> {
  logger!: Logging;
  b: BaseService<CdBioEngineDnaModel>;
  serviceModel = CdBioEngineDnaModel;
  docName!: string;
  cdToken!: string;

  constructor() {
    super(CdBioEngineDnaModel);
    this.b = new BaseService();
  }

  // ─────────────────────────────
  // CREATE / UPDATE DNA
  // ─────────────────────────────

  async update(req: Request, res: Response): Promise<void> {
    let q = this.b.getQuery(req);

    q = this.beforeUpdate(q);

    const serviceInput: IServiceInput<CdBioEngineDnaModel> = {
      serviceModel: CdBioEngineDnaModel,
      docName: "CdBioEngineDnaService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };

    this.b.update$(req, res, serviceInput).subscribe((ret: any) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  beforeUpdate(q: any) {
    // 🔥 Normalize DNA field if needed
    if (q.update?.cdBioEngineEnabled === "") {
      q.update.cdBioEngineEnabled = null;
    }

    return q;
  }

  // async updateCdBioEngineDna(req: Request, res: Response) {
  //   this.logger.logDebug("[CdBioEngineDnaService][updateCdBioEngineDna] 01");
  //   try {
  //     // Validate request data
  //     if (await this.validateUpdateData(req, res)) {
  //       /**
  //        * 1. Get the requested row to update
  //        */
  //       const requestQuery: IQuery = (req as any).post.dat.f_vals[0].query;
  //       const jsonUpdate: JSDPInstruction[] = (req as any).post.dat.f_vals[0]
  //         .jsonUpdate;

  //       console.log(
  //         `CdBioEngineDnaService::updateCdBioEngineDna()/requestQuery:${inspect(requestQuery, {depth: 3})}`
  //       );
  //       console.log(
  //         "CdBioEngineDnaService::updateCdBioEngineDna()/jsonUpdate:",
  //         jsonUpdate,
  //       );

  //       // Validate jsonUpdate format
  //       if (
  //         !jsonUpdate ||
  //         !Array.isArray(jsonUpdate) ||
  //         jsonUpdate.length === 0
  //       ) {
  //         const e = "Invalid or empty jsonUpdate provided.";
  //         this.b.err.push(e);
  //         const i = {
  //           messages: this.b.err,
  //           code: "CdBioEngineDnaService:updateCdBioEngineDna",
  //           app_msg: "",
  //         };
  //         await this.b.serviceErr(req, res, e, i.code);
  //         // return await this.b.respond(req, res);
  //       }

  //       /**
  //        * 2. Get the profile data to update
  //        */
  //       console.log(
  //         "CdBioEngineDnaService::updateCdBioEngineDna()/requestQuery:",
  //         requestQuery,
  //       );
  //       const dnaData: CdBioEngineDnaModel[] =
  //         await this.getCdBioEngineDnaI(req, res, requestQuery);
  //       console.log(
  //         "CdBioEngineDnaService::updateCdBioEngineDna()/dnaData:",
  //         dnaData,
  //       );
  //       console.log(
  //         "CdBioEngineDnaService::updateCdBioEngineDna()/dnaData[0].cdBioEngineDnaData1:",
  //         dnaData[0].cdBioEngineDnaData,
  //       );

  //       if (!dnaData) {
  //         const e = "No profile data found for the given query.";
  //         this.b.err.push(e);
  //         const i = {
  //           messages: this.b.err,
  //           code: "CdBioEngineDnaService:updateCdBioEngineDna",
  //           app_msg: "",
  //         };
  //         await this.b.serviceErr(req, res, e, i.code);
  //         // return await this.b.respond(req, res);
  //       }

  //       /**
  //        * 3. Use jsonUpdate derived above to update the dnaData
  //        */
  //       // let updatedProfileData = dnaData[0].cdBioEngineDnaData
  //       let modifiedProfile;
  //       for (const update of jsonUpdate) {
  //         console.log(
  //           "CdBioEngineDnaService::updateCdBioEngineDna()/update:",
  //           update,
  //         );
  //         console.log(
  //           "CdBioEngineDnaService::updateCdBioEngineDna()/dnaData[0].cdBioEngineDnaData2:",
  //           dnaData[0].cdBioEngineDnaData,
  //         );

  //         modifiedProfile = await this.b.updateJsonData(
  //           update,
  //           dnaData[0].cdBioEngineDnaData,
  //         );

  //         console.log(
  //           "CdBioEngineDnaService::updateCdBioEngineDna()/modifiedProfile1:",
  //           modifiedProfile,
  //         );

  //         if (!modifiedProfile) {
  //           const e = `Failed to update profile data for path: ${update.path.join(
  //             ".",
  //           )}`;
  //           this.b.err.push(e);
  //           const i = {
  //             messages: this.b.err,
  //             code: "CdBioEngineDnaService:updateCdBioEngineDna",
  //             app_msg: "",
  //           };
  //           await this.b.serviceErr(req, res, e, i.code);
  //           return await this.b.respond(req, res);
  //         }
  //       }

  //       /**
  //        * 4. Once the profile is updated successfully, update the row with the amended dnaData
  //        */
  //       requestQuery.update = {
  //         cdBioEngineDnaData: JSON.stringify(modifiedProfile), // Updated dnaData to be saved
  //       };
  //       let serviceInput: IServiceInput<any> = {
  //         serviceInstance: this,
  //         serviceModel: CdBioEngineDnaModel,
  //         docName: "CdBioEngineDnaService::updateCdBioEngineDna",
  //         cmd: {
  //           query: requestQuery,
  //         },
  //       };
  //       console.log(
  //         "CdBioEngineDnaService::updateCdBioEngineDna()/requestQuery:",
  //         requestQuery,
  //       );

  //       let ret;
  //       if (modifiedProfile) {
  //         ret = await this.updateI(req, res, serviceInput);
  //         const finalRet = {
  //           updateRet: ret,
  //           newProfile: dnaData,
  //         };

  //         // Respond with the updated profile data
  //         this.b.cdResp.data = finalRet;
  //         return await this.b.respond(req, res);
  //       } else {
  //         const e = "unexpected error ocured while updating";
  //         this.b.err.push(e.toString());
  //         const i = {
  //           messages: this.b.err,
  //           code: "CdBioEngineDnaService:updateCdBioEngineDna",
  //           app_msg: "",
  //         };
  //         await this.b.serviceErr(req, res, e, i.code);
  //         await this.b.respond(req, res);
  //       }
  //     } else {
  //       const e = "Could not validate the requested data.";
  //       this.b.err.push(e);
  //       const i = {
  //         messages: this.b.err,
  //         code: "CdBioEngineDnaService:updateCdBioEngineDna",
  //         app_msg: "",
  //       };
  //       await this.b.serviceErr(req, res, e, i.code);
  //       await this.b.respond(req, res);
  //     }
  //   } catch (e: any) {
  //     this.b.err.push(e.toString());
  //     const i = {
  //       messages: this.b.err,
  //       code: "CdBioEngineDnaService:updateCdBioEngineDna",
  //       app_msg: "",
  //     };
  //     await this.b.serviceErr(req, res, e, i.code);
  //     await this.b.respond(req, res);
  //   }
  // }

  // async updateCdBioEngineDna(req: Request, res: Response): Promise<any> {
  //   try {
  //     const valid = await this.validateUpdateData(req, res);

  //     if (!valid) {
  //       return await this.respondValidationFailure(req, res);
  //     }

  //     const payload = this.extractUpdatePayload(req);

  //     const targetRows = await this.resolveTargetRows(req, res, payload);

  //     const semanticResult = await this.applySemanticUpdates(
  //       req,
  //       res,
  //       targetRows,
  //       payload,
  //     );

  //     const persistResult = await this.persistSemanticUpdates(
  //       req,
  //       res,
  //       semanticResult,
  //     );

  //     return await this.buildUpdateResponse(req, res, persistResult);
  //   } catch (e: any) {
  //     return await this.handleUpdateError(req, res, e);
  //   }
  // }

  async updateCdBioEngineDna(req: Request, res: Response): Promise<any> {
    try {
      // await this.b.init(req, res);

      const payload = req.body?.dat?.f_vals?.[0];

      const query = payload?.query as IQuery;
      this.logger.logDebug(
        `[CdBioEngineDnaService][updateCdBioEngineDna] query: ${inspect(query, { depth: 3 })}`,
      );
      const jsonUpdate: JSDPInstruction[] = payload?.jsonUpdate || [];

      if (!query?.update) {
        return await this.b.serviceErr(
          req,
          res,
          "Missing query.update",
          "CdBioEngineDnaService:updateCdBioEngineDna",
        );
      }

      /**
       * STEP 1:
       * Use ONLY JSDP for JSON search
       */
      const searchInstruction = jsonUpdate.find((i) => i.action === "read");
      this.logger.logDebug(
        `[CdBioEngineDnaService][updateCdBioEngineDna] searchInstruction: ${inspect(searchInstruction, { depth: 3 })}`,
      );

      if (!searchInstruction) {
        return await this.b.serviceErr(
          req,
          res,
          "Missing JSDP search instruction",
          "CdBioEngineDnaService:updateCdBioEngineDna",
        );
      }

      const si: IServiceInput<CdBioEngineDnaModel> = {
        serviceModel: this.serviceModel,
      };

      const rows = await this.b.findByJSDPInstruction(
        req,
        res,
        si,
        searchInstruction,
      );

      this.logger.logDebug(
        `[CdBioEngineDnaService][updateCdBioEngineDna] rows: ${inspect(rows, { depth: 3 })}`,
      );
      const row = rows?.[0];

      this.logger.logDebug(
        `[CdBioEngineDnaService][updateCdBioEngineDna] row: ${inspect(row, { depth: 3 })}`,
      );

      if (!row) {
        return await this.b.serviceErr(
          req,
          res,
          "No matching record found",
          "CdBioEngineDnaService:updateCdBioEngineDna",
        );
      }

      /**
       * STEP 2:
       * Apply UPDATE JSDP to JSON field
       */
      let updatedData =
        (query.update as CdBioEngineDnaModel).cdBioEngineDnaData || {};
      let ret: any = {};

      for (const instr of jsonUpdate) {
        // if (instr.action !== "update") continue;

        // ret = await this.b.updateJsonData(instr, updatedData);
        const serviceInput: IServiceInput<any> = {
          serviceModel: CdBioEngineDnaModel,
          cmd: {
            query: {
              where: {
                cdBioEngineDnaId: row.cdBioEngineDnaId,
              },
              update: {
                cdBioEngineDnaData: updatedData,
              },
            },
          },
        };

        ret = await this.b.update(req, res, serviceInput);

        this.logger.logDebug(
          `[CdBioEngineDnaService][updateCdBioEngineDna] ret: ${inspect(ret, { depth: 3 })}`,
        );

        this.b.cdResp.data = ret;
        this.b.cdResp.app_state.success = true;
        this.b.i.app_msg = `Dna updated!`;
        const r = await this.b.respond(req, res);
      }

      return ret;
    } catch (e: any) {
      return await this.b.serviceErr(
        req,
        res,
        e,
        "CdBioEngineDnaService:updateCdBioEngineDna",
      );
    }
  }

  async getCdBioEngineDnaI(
    req: Request,
    res: Response,
    q?: IQuery,
  ): Promise<CdBioEngineDnaViewModel[]> {
    const b = new BaseService();
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("CdBioEngineDnaService::getCdBioEngineDna/q:", q);
    const serviceInput = {
      serviceModel: CdBioEngineDnaViewModel,
      docName: "CdBioEngineDnaService::getCdBioEngineDnaI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    } as IServiceInput<CdBioEngineDnaViewModel>;
    try {
      return await b.read(req, res, serviceInput);
    } catch (e: any) {
      console.log("CdBioEngineDnaService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdBioEngineDnaService:update",
        app_msg: "",
      };
      await b.serviceErr(req, res, e, i.code);
      return [];
    }
  }

  async validateUpdateData(req: Request, res: Response): Promise<boolean> {
    this.logger.logDebug("[CdBioEngineDnaService][validateUpdateData] 01");

    this.b.err = [];

    try {
      /**
       * 1. Validate request structure
       */
      const post = (req as any).post;

      if (!post) {
        this.b.err.push("Invalid request: Missing post payload.");

        return false;
      }

      if (!post.dat || !Array.isArray(post.dat.f_vals)) {
        this.b.err.push("Invalid request: Missing dat.f_vals.");

        return false;
      }

      if (post.dat.f_vals.length === 0) {
        this.b.err.push("Invalid request: f_vals is empty.");

        return false;
      }

      const fVal = post.dat.f_vals[0];

      this.logger.logDebug(
        `[CdBioEngineDnaService][validateUpdateData] fVal:${inspect(fVal, {
          depth: 4,
        })}`,
      );

      /**
       * 2. Validate query
       */
      const requestQuery: IQuery = fVal.query || {};

      if (requestQuery.where && typeof requestQuery.where !== "object") {
        this.b.err.push("Invalid request: query.where must be an object.");

        return false;
      }

      /**
       * 3. Validate jsonUpdate
       */
      const jsonUpdates: JSDPInstruction[] = fVal.jsonUpdate || [];

      if (!Array.isArray(jsonUpdates)) {
        this.b.err.push("Invalid request: jsonUpdate must be an array.");

        return false;
      }

      /**
       * 4. Ensure at least one selector exists
       *
       * Either:
       *  - query.where
       *  - semantic read instruction
       */

      const hasWhere =
        !!requestQuery.where && Object.keys(requestQuery.where).length > 0;

      const hasSemanticRead = jsonUpdates.some((j) => j.action === "read");

      if (!hasWhere && !hasSemanticRead) {
        this.b.err.push(
          "Invalid request: No selector provided. Expected query.where or JSDP read instruction.",
        );

        return false;
      }

      /**
       * 5. Validate each JSDP instruction
       */
      for (const update of jsonUpdates) {
        /**
         * path
         */
        if (!Array.isArray(update.path) || update.path.length === 0) {
          this.b.err.push(
            "Invalid JSDP instruction: path must be a non-empty array.",
          );

          return false;
        }

        /**
         * action
         */
        const allowedActions = ["create", "update", "delete", "upsert", "read"];

        if (!allowedActions.includes(update.action)) {
          this.b.err.push(`Invalid JSDP action: ${update.action}`);

          return false;
        }

        /**
         * modelField
         */
        if (update.modelField && typeof update.modelField !== "string") {
          this.b.err.push(
            "Invalid JSDP instruction: modelField must be string.",
          );

          return false;
        }

        /**
         * read validation
         */
        if (update.action === "read") {
          if (typeof update.value === "undefined") {
            this.b.err.push(
              "Invalid JSDP read instruction: value is required.",
            );

            return false;
          }
        }

        /**
         * mutation validation
         */
        if (update.action !== "delete" && update.action !== "read") {
          if (typeof update.value === "undefined") {
            this.b.err.push(
              `Invalid JSDP instruction: value is required for ${update.action}.`,
            );

            return false;
          }
        }
      }

      /**
       * 6. Session validation
       *
       * Only validate existence.
       * Ownership/authorization should
       * be delegated to policy layer.
       */

      const svSess = new SessionService();

      const sessionDataExt: ISessionDataExt | null =
        await svSess.getSessionDataExt(req, res, true);

      if (!sessionDataExt) {
        this.b.err.push("Invalid session: Unable to retrieve session data.");

        return false;
      }

      /**
       * VALID
       */
      this.logger.logDebug("[CdBioEngineDnaService][validateUpdateData] VALID");

      return true;
    } catch (e: any) {
      this.logger.logError(
        "[CdBioEngineDnaService][validateUpdateData] ERROR:",
        e,
      );

      this.b.err.push(e.toString());

      return false;
    }
  }

  async updateI(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    return await this.b.update(req, res, serviceInput);
  }

  // ─────────────────────────────
  // READ DNA
  // ─────────────────────────────

  async get(req: Request, res: Response): Promise<void> {
    let q: IQuery = this.b.getQuery(req);

    const serviceInput: IServiceInput<CdBioEngineDnaModel> = {
      serviceModel: CdBioEngineDnaModel,
      modelName: "CdBioEngineDnaModel",
      docName: "CdBioEngineDnaService::get",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };

    try {
      const r = await this.b.read(req, res, serviceInput);
      this.b.successResponse(req, res, r);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "CdBioEngineDnaService::get");
      await this.b.respond(req, res);
    }
  }

  // ─────────────────────────────
  // INTERNAL READ (for engine use)
  // ─────────────────────────────

  async getI(req: Request, res: Response, q?: IQuery): Promise<any> {
    let query: IQuery = q || this.b.getQuery(req);

    const serviceInput: IServiceInput<CdBioEngineDnaModel> = {
      serviceModel: CdBioEngineDnaModel,
      modelName: "CdBioEngineDnaModel",
      docName: "CdBioEngineDnaService::getI",
      cmd: {
        action: "find",
        query: query,
      },
      dSource: 1,
    };

    try {
      return await this.b.read(req, res, serviceInput);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "CdBioEngineDnaService::getI");
      return [];
    }
  }

  async jGet(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body?.dat?.f_vals?.[0];

      const query = payload?.query as IQuery;
      this.logger.logDebug(
        `[CdBioEngineDnaService][jGet] query: ${inspect(query, { depth: 3 })}`,
      );
      const jsonUpdate: JSDPInstruction[] = payload?.jsonUpdate || [];

      // if (!query?.update) {
      //   await this.b.serviceErr(
      //     req,
      //     res,
      //     "Missing query.update",
      //     "CdBioEngineDnaService:jGet",
      //   );
      // }

      /**
       * STEP 1:
       * Use ONLY JSDP for JSON search
       */
      const searchInstruction = jsonUpdate.find((i) => i.action === "read");
      this.logger.logDebug(
        `[CdBioEngineDnaService][jGet] searchInstruction: ${inspect(searchInstruction, { depth: 3 })}`,
      );

      if (!searchInstruction) {
        await this.b.serviceErr(
          req,
          res,
          "Missing JSDP search instruction",
          "CdBioEngineDnaService:jGet",
        );
      }

      const si: IServiceInput<CdBioEngineDnaModel> = {
        serviceModel: this.serviceModel,
      };

      const rows = await this.b.findByJSDPInstruction(
        req,
        res,
        si,
        searchInstruction as JSDPInstruction,
      );

      this.logger.logDebug(
        `[CdBioEngineDnaService][jGet] rows: ${inspect(rows, { depth: 3 })}`,
      );
      // this.b.successResponse(req, res, rows);
      this.b.cdResp.data = rows;
      this.b.cdResp.app_state.success = true;
      this.b.i.app_msg = `Dna updated!`;
      const r = await this.b.respond(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "CdBioEngineDnaService::jGet");
      await this.b.respond(req, res);
    }
  }
}
