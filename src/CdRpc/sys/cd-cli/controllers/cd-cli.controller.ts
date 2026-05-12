import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdCliTypeService } from '../services/cd-cli-type.service';
import { CdCliService } from '../services/cd-cli.service';

export class CdCliController extends GenericController<CdCliModel> {

    b: BaseService;
    svCdCli: CdCliService;
    svCdCliType: CdCliTypeService

    constructor() {
        this.b = new BaseService();
        this.svCdCli = new CdCliService();
        this.svCdCliType = new CdCliTypeService();
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "CdCli",
    //         "a": "Create",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "data": {
    //                         "cd-cliStatName": "/src/CdApi/sys/moduleman",
    //                         "CdCliTypeId": "7ae902cd-5bc5-493b-a739-125f10ca0268",
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
            await this.svCdCli.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:Create');
        }
    }

    /**
     * CreateM, Create multiple
     * @param req 
     * @param res 
     */
    async CreateM(req: Request, res: Response) {
        try {
            await this.svCdCli.createM(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:CreateM');
        }
    }

    async CreateSL(req: Request, res: Response) {
        try {
            await this.svCdCli.createSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:CreateSL');
        }
    }

    

    /**
     * {
            "ctx": "App",
            "m": "CdClis",
            "c": "CdCli",
            "a": "Get",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "where": {"cd-cliStatName": "Kenya"}
                        }
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": null
        }

        curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App", "m": "CdClis","c": "CdCli","a": "Get","dat": {"f_vals": [{"query": {"where": {"cd-cliStatName": "Kenya"}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
     * @param req
     * @param res
     */
    async Get(req: Request, res: Response) {
        try {
            await this.svCdCli.getCdCli(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:Get');
        }
    }

    async GetSL(req: Request, res: Response) {
        try {
            await this.svCdCli.getCdCliSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:GetSL');
        }
    }

    /**
     * {
            "ctx": "App",
            "m": "CdClis",
            "c": "CdCli",
            "a": "GetType",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "where": {"cd-cliTypeId": 100}
                        }
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": null
        }

        curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdClis","c": "CdCli","a": "GetType","dat":{"f_vals": [{"query":{"where": {"cd-cliTypeId":100}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
     * @param req
     * @param res
     */
    async GetType(req: Request, res: Response) {
        try {
            // await this.svCdCli.getCdCliType(req, res);
            await this.svCdCli.getCdObjTypeCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:Get');
        }
    }

    async GetType2(req: Request, res: Response) {
        try {
            // await this.svCdCli.getCdCliType(req, res);
            await this.svCdCli.getCdCliType2(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:GetType2');
        }
    }

    async SearchCdCliTypes(req: Request, res: Response) {
        try {
            // await this.svCdCli.getCdCliType(req, res);
            await this.svCdCli.searchCdCliTypes(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:GetType2');
        }
    }

    /** Pageable request:
     * {
            "ctx": "App",
            "m": "CdClis",
            "c": "CdCli",
            "a": "GetCount",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "select":["cd-cliStatId","cd-cliStatGuid"],
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

     curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdClis","c": "CdCli","a": "GetCount","dat": {"f_vals": [{"query": {"select":["cd-cliStatId","cd-cliStatGuid"],"where": {}, "take":5,"skip": 1}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'

     * @param req
     * @param res
     */
    async GetCount(req: Request, res: Response) {
        try {
            await this.svCdCli.getCdCliQB(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:GetCount');
        }
    }

    /** Pageable request:
     * {
            "ctx": "App",
            "m": "CdClis",
            "c": "CdCli",
            "a": "GetPaged",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "select":["cd-cliStatId","cd-cliStatGuid"],
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

     curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdClis","c": "CdCli","a": "GetPaged","dat": {"f_vals": [{"query": {"select":["cd-cliStatId","cd-cliStatGuid"],"where": {}, "take":5,"skip": 1}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'

     * @param req
     * @param res
     */
    async GetPaged(req: Request, res: Response) {
        try {
            await this.svCdCli.getCdCliPaged(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    async GetPagedSL(req: Request, res: Response) {
        try {
            await this.svCdCli.getPagedSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:GetSL');
        }
    }

    /**
     * {
            "ctx": "App",
            "m": "CdClis",
            "c": "CdCli",
            "a": "Update",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "update": {
                                "cd-cliAssets": null
                            },
                            "where": {
                                "cd-cliStatId": 1
                            }
                        }
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": {}
        }

     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdClis","c": "CdCli","a": "Update","dat": {"f_vals": [{"query": {"update": {"cd-cliAssets": null},"where": {"cd-cliStatId": 1}}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req
     * @param res
     */
    async Update(req: Request, res: Response) {
        console.log('CdCliController::Update()/01');
        try {
            console.log('CdCliController::Update()/02');
            await this.svCdCli.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

    async UpdateSL(req: Request, res: Response) {
        console.log('CdCliController::UpdateSL()/01');
        try {
            console.log('CdCliController::UpdateSL()/02');
            await this.svCdCli.updateSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:UpdateSL');
        }
    }

    /**
     * {
            "ctx": "App",
            "m": "CdClis",
            "c": "CdCli",
            "a": "Delete",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "where": {"cd-cliStatId": 69}
                        }
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": null
        }
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdClis","c": "CdCli","a": "Delete","dat": {"f_vals": [{"query": {"where": {"cd-cliStatId": 69}}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req
     * @param res
     */
    async Delete(req: Request, res: Response) {
        try {
            await this.svCdCli.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

    async DeleteSL(req: Request, res: Response) {
        try {
            await this.svCdCli.deleteSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'BillController:DeleteSL');
        }
    }

    /**
     * 
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdClis","c": "CdCli","a": "CreateType","dat": {"f_vals": [{"data": {"cd-cliTypeName": "Continental Apex"}}],"token": "3ffd785f-e885-4d37-addf-0e24379af338"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     */
    async CreateType(req: Request, res: Response) {
        try {
            await this.svCdCliType.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:CreateType');
        }
    }

    /**
     * 
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdClis","c": "CdCli","a": "UpudateType","dat": {"f_vals": [{"data": {"cd-cliTypeName": "Continental Apex"}}],"token": "3ffd785f-e885-4d37-addf-0e24379af338"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     */
    async UpdateType(req: Request, res: Response) {
        try {
            await this.svCdCliType.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:EditType');
        }
    }

    /**
     * 
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdClis","c": "CdCli","a": "DeleteType","dat": {"f_vals": [{"query": {"where": {"cd-cliTypeId": 107}}}],"token": "08f45393-c10e-4edd-af2c-bae1746247a1"},"args": {}}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     */
    async DeleteType(req: Request, res: Response) {
        try {
            await this.svCdCliType.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliController:DeleteType');
        }
    }

}