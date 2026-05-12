import { Request, Response } from "express";
import { BaseService } from "../../base/base.service";
import { CdLogService } from "../services/cd-log.service";
import { CdLogModel } from "../models/cd-log.model";
import { GenericController } from "../../base/generic-controller";

export class CdLogController extends GenericController<CdLogModel> {
  b: BaseService<CdLogModel>;
  service: CdLogService;

  constructor() {
    super()
    this.b = new BaseService();
    this.service = new CdLogService();
    this.service.init();
  }

  /**
   * {
          "ctx": "Sys",
          "m": "Moduleman",
          "c": "CdLog",
          "a": "Get",
          "dat": {
              "f_vals": [
                  {
                      "query": {
                          "where": {"phrase": "CdRequest::processPost()","since": {"unit": "min", "value": "20"}}
                      }
                  }
              ],
              "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
          },
          "args": null
      }
   * @param req
   * @param res
   */
  // async Get(req: Request, res: Response) {
  //   try {
  //       // const reader = new CdLogReader("/path/to/logs"); // e.g., /home/devops/cd-api/
  //     await this.service.init();
  //   //   await this.service.getCdLog(req, res);

  //     const logsWithPhrase = await this.service.queryLogs({
  //       phrase: "CdRequest::processPost()",
  //       since: new Date(Date.now() - 20 * 60 * 1000), // last 20 minutes
  //     });

  //     const recentLogs = await this.service.queryLogs({
  //       since: new Date(Date.now() - 20 * 60 * 1000),
  //     });

  //     console.log("Logs with phrase:", JSON.stringify(logsWithPhrase, null, 2));
  //     console.log("Recent logs:", JSON.stringify(recentLogs, null, 2));
  //   } catch (e: any) {
  //     await this.b.serviceErr(req, res, e, "CdLogController:Get");
  //   }
  // }
  async Get(req: Request, res: Response) {
    try {
      await this.service.getCdLog(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "CdLogController:Get");
    }
  }
}
