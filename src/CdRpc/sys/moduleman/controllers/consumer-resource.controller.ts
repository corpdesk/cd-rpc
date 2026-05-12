import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { ConsumerResourceService } from '../services/consumer-resource.service';
import { ConsumerResourceModel } from "../models/consumer-resource.model";
import { GenericController } from "../../base/generic-controller";

export class ConsumerResourceController extends GenericController<ConsumerResourceModel> {

    b: BaseService<ConsumerResourceModel>;
    service: ConsumerResourceService;

    constructor() {
        super();
        this.b = new BaseService();
        this.service = new ConsumerResourceService();
    }

    /**
    //  * {
            "ctx": "Sys",
            "m": "Moduleman",
            "c": "ConsumerResource",
            "a": "Create",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "cdObjTypeGuid": "8b4cf8de-1ffc-4575-9e73-4ccf45a7756b",
                            "consumerGuid": "B0B3DA99-1859-A499-90F6-1E3F69575DCD",
                            "objGuid": "8D4ED6A9-398D-32FE-7503-740C097E4F1F"
                        }
                    }
                ],
                "token": "3ffd785f-e885-4d37-addf-0e24379af338"
            },
            "args": {}
        }
     * @param req
     * @param res
    */
    async Create(req: Request, res: Response) {
        try {
            await this.service.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ConsumerResourceController:Create');
        }
    }

    // // /**
    // //  * {
    //     "ctx": "Sys",
    //     "m": "Moduleman",
    //     "c": "ConsumerResource",
    //     "a": "Get",
    //     "dat": {
    //         "f_vals": [
    //             {
    //                 "query": {
    //                     "where": {
    //                         "consumer-resourceGuid": "45E28C72-3C6D-940E-B738-DF3415589906"
    //                     }
    //                 }
    //             }
    //         ],
    //         "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
    //     },
    //     "args": null
    // }
    // //  * @param req
    // //  * @param res
    // //  */
    async Get(req: Request, res: Response) {
        try {
            await this.service.getConsumerResource(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ConsumerResourceController:Get');
        }
    }

    // {
    //     "ctx": "Sys",
    //     "m": "Moduleman",
    //     "c": "ConsumerResource",
    //     "a": "GetType",
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
    async GetType(req: Request, res: Response) {
        try {
            await this.service.getConsumerResourceTypeCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ConsumerResourceController:Get');
        }
    }

    /** Pageable request:
    {
        "ctx": "Sys",
        "m": "Moduleman",
        "c": "ConsumerResource",
        "a": "GetCount",
        "dat": {
            "f_vals": [
                {
                    "query": {
                        "select": [
                            "consumerResourceName",
                            "consumerResourceGuid"
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
    */
    async GetCount(req: Request, res: Response) {
        try {
            // await this.service.GetCount(req, res);
            await this.service.getConsumerResourceQB(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ConsumerResourceController:GetCount');
        }
    }

    /**
     * Get consumers mapped to resources
     * @param req 
     * @param res 
     */
    async GetMaped(req: Request, res: Response) {
        try {
            // await this.service.GetMaped(req, res);
            await this.service.getConsumerResourcesMap(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ConsumerResourceController:GetMaped');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "ConsumerResource",
    //         "a": "Update",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "update": {
    //                             "consumer-resourceName": "/corp-deskv1.2.1.2/system/modules/comm/controllers"
    //                         },
    //                         "where": {
    //                             "consumer-resourceId": 45762
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
        console.log('ConsumerResourceController::Update()/01');
        try {
            console.log('ConsumerResourceController::Update()/02');
            await this.service.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ConsumerResourceController:Update');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "ConsumerResource",
    //         "a": "GetCount",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {"consumer-resourceId": 45763}
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
            await this.b.serviceErr(req, res, e, 'ConsumerResourceController:Update');
        }
    }

}