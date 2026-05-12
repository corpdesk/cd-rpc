import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { ModuleService } from '../services/module.service';
import { GenericController } from "../../base/generic-controller";
import { UserModel } from "../../user/models/user.model";
import { ModuleModel } from "../models/module.model";

// export class ModuleController extends GenericController<ul{
export class ModuleController extends GenericController<ModuleModel> {

    b: BaseService<ModuleModel>;
    service: ModuleService;

    constructor() {
        super();
        this.b = new BaseService();
        this.service = new ModuleService();
    }

    /**
     *
     * {
            "ctx": "Sys",
            "m": "Moduleman",
            "c": "Module",
            "a": "Create",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "moduleName": "CdAi",
                            "isSysModule": false
                        },
                        "cdObj": {
                            "cdObjName": "CdAi",
                            "cdObjTypeGuid": "809a6e31-9fb1-4874-b61a-38cf2708a3bb",
                            "parentModuleGuid": "04060dfa-fc94-4e3a-98bc-9fbd739deb87"
                        }
                    }
                ],
                "token": "3ffd785f-e885-4d37-addf-0e24379af338"
            },
            "args": {}
        }
     */
    async Create(req: Request, res: Response) {
        try {
            await this.service.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Create');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Module",
    //         "a": "Get",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "filter": { "moduleId":98}
    //                 }
    //             ],
    //             "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
    //         },
    //         "args": null
    //     }
    //  * @param req
    //  * @param res
    //  */
    async Get(req: Request, res: Response) {
        try {
            await this.service.getModule(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    // /** Pageable request:
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Module",
    //         "a": "GetCount",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "select":["moduleId","moduleGuid"],
    //                         "where": {},
    //                         "take": 5,
    //                         "skip": 1
    //                         }
    //                 }
    //             ],
    //             "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
    //         },
    //         "args": null
    //     }
    //  * @param req
    //  * @param res
    //  */
    async GetCount(req: Request, res: Response) {
        try {
            // await this.service.getModuleCount(req, res);
            await this.service.getModuleQB(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    // /**
    //  *
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Module",
    //         "a": "Update",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "update": {
    //                             "moduleName": "TesterModule"
    //                         },
    //                         "where": {"moduleId":93}
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
        try {
            await this.service.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

    async Delete(req: Request, res: Response) {
        try {
            await this.service.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

    async PurgeModule(req: Request, res: Response) {
        console.log("ModuleController::PurgeModule()/Start");
        try {
            await this.service.purgeModule(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:PurgeModule');
        }
    }

}