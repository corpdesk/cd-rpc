import { Request, Response } from "express";
import { BaseService } from "../../base/base.service";
import { Logging } from "../../base/winston.log";
import { ConsumerModel } from "../models/consumer.model";
import { ConsumerService } from "../services/consumer.service";
import { GenericController } from "../../base/generic-controller";

// export class ConsumerController {
export class ConsumerController extends GenericController<ConsumerModel> {
  b: BaseService<ConsumerModel>;
  logger: Logging;
  service: ConsumerService;

  constructor() {
    super();
    this.b = new BaseService();
    this.logger = new Logging();
    this.service = new ConsumerService();
  }

  /**
    //  * {
                "ctx": "Sys",
                "m": "Moduleman",
                "c": "Consumer",
                "a": "Create",
                "dat": {
                    "f_vals": [
                        {
                            "data": {
                                "companyGuid": "8a7a5b56-6c76-11ec-a1b0-4184d18c49ca"
                            }
                        }
                    ],
                    "token": "3ffd785f-e885-4d37-addf-0e24379af338"
                },
                "args": {}
            }
    //  * @param req
    //  * @param res
    //  */
  async Create(req: Request, res: Response) {
    try {
      await this.service.create(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "ConsumerController:Create");
    }
  }

  /**
  //  * {
      "ctx": "Sys",
      "m": "Moduleman",
      "c": "Consumer",
      "a": "Get",
      "dat": {
          "f_vals": [
              {
                  "query": {
                      "where": {
                          "consumerGuid": "45E28C72-3C6D-940E-B738-DF3415589906"
                      }
                  }
              }
          ],
          "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
      },
      "args": null
  }
  //  * @param req
  //  * @param res
  //  */
  async Get(req: Request, res: Response) {
    try {
      await this.service.getConsumer(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "ConsumerController:Get");
    }
  }

  async GetType(req: Request, res: Response) {
    try {
      await this.service.getConsumerTypeCount(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "ConsumerController:Get");
    }
  }

  /** Pageable request:
  //  * {
      "ctx": "Sys",
      "m": "Moduleman",
      "c": "Consumer",
      "a": "GetCount",
      "dat": {
          "f_vals": [
              {
                  "query": {
                      "select": [
                          "consumerName",
                          "consumerGuid"
                      ],
                      "where": {},
                      "take": 5,
                      "skip": 0
                  }
              }
          ],
          "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
      },
      "args": null
  }
  //  * @param req
  //  * @param res
  //  */
  async GetCount(req: Request, res: Response) {
    try {
      // await this.service.getConsumerCount(req, res);
      await this.service.getConsumerQB(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "ConsumerController:Get");
    }
  }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Consumer",
  //         "a": "Update",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "update": {
  //                             "consumerName": "/corp-deskv1.2.1.2/system/modules/comm/controllers"
  //                         },
  //                         "where": {
  //                             "consumerId": 45762
  //                         }
  //                     }
  //                 }
  //             ],
  //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //         },
  //         "args": {}
  //     }
  //  * @param req
  //  * @param res
  //  */
  async Update(req: Request, res: Response) {
    console.log("ConsumerController::Update()/01");
    try {
      console.log("ConsumerController::Update()/02");
      await this.service.update(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "ConsumerController:Update");
    }
  }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Consumer",
  //         "a": "GetCount",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "where": {"consumerId": 45763}
  //                     }
  //                 }
  //             ],
  //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //         },
  //         "args": null
  //     }
  //  * @param req
  //  * @param res
  //  */
  async Delete(req: Request, res: Response) {
    try {
      await this.service.delete(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "ConsumerController:Update");
    }
  }

  /**
   * Controller action to handle Consumer Profile updates.
   * Mirrors UserController.UpdateUserProfile
   */
  async UpdateConsumerProfile(req: Request, res: Response) {
    this.logger.logInfo("ConsumerController::UpdateConsumerProfile()/01");
    try {
      // Delegate to ConsumerService
      await this.service.updateConsumerProfile(req, res);
    } catch (e: any) {
      await this.b.serviceErr(
        req,
        res,
        e,
        "ConsumerController::UpdateConsumerProfile"
      );
    }
  }
}
