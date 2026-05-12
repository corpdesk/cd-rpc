import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdDevTypeService } from '../services/cd-dev-type.service';
import { CdDevService } from '../services/cd-dev.service';
import { GenericController } from "../../base/generic-controller";
import { CdCliProfileModel } from "../../cd-cli/models/cd-cli-profile.model";
import { CdDevModel } from "../models/cd-dev.model";

// export class CdDevController {
export class CdDevController extends GenericController<CdDevModel> {

    b: BaseService;
    svCdDev: CdDevService;
    svCdDevType: CdDevTypeService

    constructor() {
        this.b = new BaseService();
        this.svCdDev = new CdDevService();
        this.svCdDevType = new CdDevTypeService();
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "CdDev",
    //         "a": "Create",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "data": {
    //                         "cd-devStatName": "/src/CdApi/sys/moduleman",
    //                         "CdDevTypeId": "7ae902cd-5bc5-493b-a739-125f10ca0268",
    //                         "parentModuleGuid": "00e7c6a8-83e4-40e2-bd27-51fcff9ce63b"
    //                     }
    //                 }
    //             ],
    //             "token": "3ffd785f-e885-4d37-addf-0e24379af338"
    //         },
    //         "args": {}
    //     }
    //  * @param req
    //  * @param res
    //  */
    async Create(req: Request, res: Response) {
        try {
            await this.svCdDev.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:Create');
        }
    }

    /**
     * CreateM, Create multiple
     * @param req 
     * @param res 
     */
    async CreateM(req: Request, res: Response) {
        try {
            await this.svCdDev.createM(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:CreateM');
        }
    }

    async CreateSL(req: Request, res: Response) {
        try {
            await this.svCdDev.createSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:CreateSL');
        }
    }

    

    /**
     * {
            "ctx": "App",
            "m": "CdDevs",
            "c": "CdDev",
            "a": "Get",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "where": {"cd-devStatName": "Kenya"}
                        }
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": null
        }

        curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App", "m": "CdDevs","c": "CdDev","a": "Get","dat": {"f_vals": [{"query": {"where": {"cd-devStatName": "Kenya"}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
        
     * @param req
     * @param res
     */
    async Get(req: Request, res: Response) {
        try {
            await this.svCdDev.getCdDev(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:Get');
        }
    }

    async GetSL(req: Request, res: Response) {
        try {
            await this.svCdDev.getCdDevSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:GetSL');
        }
    }

    /**
     * {
            "ctx": "App",
            "m": "CdDevs",
            "c": "CdDev",
            "a": "GetType",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "where": {"cd-devTypeId": 100}
                        }
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": null
        }

        curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdDevs","c": "CdDev","a": "GetType","dat":{"f_vals": [{"query":{"where": {"cd-devTypeId":100}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
     * @param req
     * @param res
     */
    async GetType(req: Request, res: Response) {
        try {
            // await this.svCdDev.getCdDevType(req, res);
            await this.svCdDev.getCdObjTypeCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:Get');
        }
    }

    async GetType2(req: Request, res: Response) {
        try {
            // await this.svCdDev.getCdDevType(req, res);
            await this.svCdDev.getCdDevType2(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:GetType2');
        }
    }

    async SearchCdDevTypes(req: Request, res: Response) {
        try {
            // await this.svCdDev.getCdDevType(req, res);
            await this.svCdDev.searchCdDevTypes(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:GetType2');
        }
    }

    /** Pageable request:
     * {
            "ctx": "App",
            "m": "CdDevs",
            "c": "CdDev",
            "a": "GetCount",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "select":["cd-devStatId","cd-devStatGuid"],
                            "where": {},
                            "take": 5,
                            "skip": 1
                            }
                    }
                ],
                "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
            },
            "args": null
        }

     curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdDevs","c": "CdDev","a": "GetCount","dat": {"f_vals": [{"query": {"select":["cd-devStatId","cd-devStatGuid"],"where": {}, "take":5,"skip": 1}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'

     * @param req
     * @param res
     */
    async GetCount(req: Request, res: Response) {
        try {
            await this.svCdDev.getCdDevQB(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:GetCount');
        }
    }

    /** Pageable request:
     * {
            "ctx": "App",
            "m": "CdDevs",
            "c": "CdDev",
            "a": "GetPaged",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "select":["cd-devStatId","cd-devStatGuid"],
                            "where": {},
                            "take": 5,
                            "skip": 1
                            }
                    }
                ],
                "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
            },
            "args": null
        }

     curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdDevs","c": "CdDev","a": "GetPaged","dat": {"f_vals": [{"query": {"select":["cd-devStatId","cd-devStatGuid"],"where": {}, "take":5,"skip": 1}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'

     * @param req
     * @param res
     */
    async GetPaged(req: Request, res: Response) {
        try {
            await this.svCdDev.getCdDevPaged(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    async GetPagedSL(req: Request, res: Response) {
        try {
            await this.svCdDev.getPagedSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:GetSL');
        }
    }

    /**
     * {
            "ctx": "App",
            "m": "CdDevs",
            "c": "CdDev",
            "a": "Update",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "update": {
                                "cd-devAssets": null
                            },
                            "where": {
                                "cd-devStatId": 1
                            }
                        }
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": {}
        }

     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdDevs","c": "CdDev","a": "Update","dat": {"f_vals": [{"query": {"update": {"cd-devAssets": null},"where": {"cd-devStatId": 1}}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req
     * @param res
     */
    async Update(req: Request, res: Response) {
        console.log('CdDevController::Update()/01');
        try {
            console.log('CdDevController::Update()/02');
            await this.svCdDev.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

    async UpdateSL(req: Request, res: Response) {
        console.log('CdDevController::UpdateSL()/01');
        try {
            console.log('CdDevController::UpdateSL()/02');
            await this.svCdDev.updateSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:UpdateSL');
        }
    }

    /**
     * {
            "ctx": "App",
            "m": "CdDevs",
            "c": "CdDev",
            "a": "Delete",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "where": {"cd-devStatId": 69}
                        }
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": null
        }
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdDevs","c": "CdDev","a": "Delete","dat": {"f_vals": [{"query": {"where": {"cd-devStatId": 69}}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req
     * @param res
     */
    async Delete(req: Request, res: Response) {
        try {
            await this.svCdDev.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

    async DeleteSL(req: Request, res: Response) {
        try {
            await this.svCdDev.deleteSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'BillController:DeleteSL');
        }
    }

    /**
     * 
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdDevs","c": "CdDev","a": "CreateType","dat": {"f_vals": [{"data": {"cd-devTypeName": "Continental Apex"}}],"token": "3ffd785f-e885-4d37-addf-0e24379af338"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     */
    async CreateType(req: Request, res: Response) {
        try {
            await this.svCdDevType.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:CreateType');
        }
    }

    /**
     * 
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdDevs","c": "CdDev","a": "UpudateType","dat": {"f_vals": [{"data": {"cd-devTypeName": "Continental Apex"}}],"token": "3ffd785f-e885-4d37-addf-0e24379af338"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     */
    async UpdateType(req: Request, res: Response) {
        try {
            await this.svCdDevType.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:EditType');
        }
    }

    /**
     * 
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdDevs","c": "CdDev","a": "DeleteType","dat": {"f_vals": [{"query": {"where": {"cd-devTypeId": 107}}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     */
    async DeleteType(req: Request, res: Response) {
        try {
            await this.svCdDevType.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevController:DeleteType');
        }
    }

}