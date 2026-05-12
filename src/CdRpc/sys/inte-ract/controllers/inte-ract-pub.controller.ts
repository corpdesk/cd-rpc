import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { IServiceInput } from '../../base/i-base';
import { InteRactPubService } from '../services/inte-ract-pub.service';
import { InteRactPubModel } from "../models/inte-ract-pub.model";
import { GenericController } from "../../base/generic-controller";

export class InteRactPubController extends GenericController<InteRactPubModel> {

    b: BaseService;
    svInteRactPub: InteRactPubService;

    constructor() {
        console.log('InteRactPubController::constructor()/01')
        this.b = new BaseService();
        console.log('InteRactPubController::constructor()/02')
        this.svInteRactPub = new InteRactPubService();
    }

    /**
     * {
            "ctx": "Sys",
            "m": "InteRact",
            "c": "InteRactPub",
            "a": "Create",
            "dat": {
                "f_vals": [
                    {
                        "inteRactMedia": {
                            "inteRactMediaName": "",
                            "inteRactMediaDescription": "",
                            "inteRactMediaType_id": "",
                            "location": "http://localhost/xxx"
                        },
                        "data": {
                            "inteRactPubName": "pms/schedule?project_id=3&schedule_id=12",
                            "inteRactPubDescription": "jgfl",
                            "inteRactPubType_id": "",
                            "public": false,
                            "m": "pms",
                            "c": "schedule",
                            "j_val": "{\"m\":\"pms\",\"c\":\"schedules\",\"projectID\":\"3\",\"scheduleID\":\"12\"}"
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
    async Create(req: Request, res: Response) {
        console.log('InteRactPubController::Create()/01')
        try {
            console.log('InteRactPubController::Create()/02')
            await this.svInteRactPub.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'InteRactPubController:Create');
        }
    }

    // /**
    // {
    //     "ctx": "App",
    //     "m": "CdAccts",
    //     "c": "InteRactPub",
    //     "a": "Get",
    //     "dat": {
    //         "f_vals": [
    //             {
    //                 "query": {
    //                     "where": {}
    //                 }
    //             }
    //         ],
    //         "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
    //     },
    //     "args": null
    // }
    //  * @param req
    //  * @param res
    //  */
    async Get(req: Request, res: Response) {
        try {
            await this.svInteRactPub.getInteRactPub(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'InteRactPubController:Get');
        }
    }

    // /** Pageable request:
    //   * {
    //         "ctx": "App",
    //         "m": "CdAccts",
    //         "c": "InteRactPub",
    //         "a": "GetCount",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "select": [
    //                             "billName",
    //                             "billGuid"
    //                         ],
    //                         "where": {},
    //                         "take": 5,
    //                         "skip": 0
    //                     }
    //                 }
    //             ],
    //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
    //         },
    //         "args": null
    //     }
    //   * @param req
    //   * @param res
    //   */
    async GetPaged(req: Request, res: Response) {
        try {
            await this.svInteRactPub.getPaged(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'InteRactPubController:GetCount');
        }
    }

    // /**
    //  * {
    //         "ctx": "App",
    //         "m": "CdAccts",
    //         "c": "InteRactPub",
    //         "a": "InteRactPubViewPaged",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {},
    //                         "take": 5,
    //                         "skip": 0
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
    async GetViewPaged(req: Request, res: Response) {
        try {
            await this.svInteRactPub.getViewPaged(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'InteRactPubController:InteRactPubViewPaged');
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
        console.log('InteRactPubController::Update()/01');
        try {
            console.log('InteRactPubController::Update()/02');
            await this.svInteRactPub.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'InteRactPubController:Update');
        }
    }

    // /**
    //  * {
    //          "ctx": "App",
    //          "m": "CdAccts",
    //          "c": "InteRactPub",
    //          "a": "Delete",
    //          "dat": {
    //              "f_vals": [
    //                  {
    //                      "query": {
    //                          "where": {
    //                              "billGuid": "qyuiop"
    //                          }
    //                      }
    //                  }
    //              ],
    //              "token": "fc735ce6-b52f-4293-9332-0181a49231c4"
    //          },
    //          "args": {}
    //      }
    //  * @param req
    //  * @param res
    //  */
    async Delete(req: Request, res: Response) {
        try {
            await this.svInteRactPub.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'InteRactPubController:Delete');
        }
    }

    /**
     * {
    "ctx": "Sys",
    "m": "InteRact",
    "c": "InteRactPub",
    "a": "TestJsonQuery",
    "dat": {
        "f_vals": [
            {
                "query": {
                    "select": [
                        "inteRactPub_id",
                        "inteRactPub_name",
                        "inteRactPub_description",
                        "inteRactPub_guid",
                        "doc_id",
                        "inteRactPub_type_id",
                        "public",
                        "m",
                        "c",
                        "j_val"
                    ],
                    "where": [
                        {
                            "conjType": null,
                            "dataType":"json",
                            "field": "j_val",
                            "jPath": "'$.domain.group.doc_id'",
                            "operator": "=",
                            "val": 11091
                        },
                        {
                            "field": "doc_id",
                            "fieldType": "json",
                            "operator": "=",
                            "val": 11121,
                            "conjType": "and" 
                        }
                    ]
                }
            }
        ],
        "token": "fc735ce6-b52f-4293-9332-0181a49231c4"
    },
    "args": {}
}
     * @param req
     * @param res
     */
    async TestJsonQuery(req: Request, res: Response) {
        try {
            await this.svInteRactPub.testJsonQuery(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'InteRactPubController:TestJsonQuery');
        }
    }
}