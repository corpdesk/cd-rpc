import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { AclService } from '../services/acl.service';
import { AclModel } from "../models/acl.model";
import { GenericController } from "../../base/generic-controller";

// export class AclController {
export class AclController extends GenericController<AclModel> {

    b: BaseService<AclModel>;
    service: AclService;

    constructor() {
        super()
        this.b = new BaseService();
        this.service = new AclService();
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Acl",
    //         "a": "Create",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "data": {
    //                         "aclName": "/src/CdApi/sys/moduleman",
    //                         "aclTypeGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
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
            await this.service.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'AclController:Create');
        }
    }

    async CreateSL(req: Request, res: Response) {
        try {
            await this.service.createSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'AclController:CreateSL');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Acl",
    //         "a": "Get",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {"aclId": 45763}
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
    async Get(req: Request, res: Response) {
        try {
            await this.service.getAcl(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'AclController:Get');
        }
    }

    async GetSL(req: Request, res: Response) {
        try {
            await this.service.getAclSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'AclController:GetSL');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Acl",
    //         "a": "GetType",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {"aclTypeId": 45763}
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
    async GetType(req: Request, res: Response) {
        try {
            await this.service.getAclTypeCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'AclController:Get');
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
            // await this.service.getAclCount(req, res);
            await this.service.getAclQB(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    // /** Pageable request:
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Module",
    //         "a": "GetPaged",
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
    async GetPaged(req: Request, res: Response) {
        try {
            await this.service.getAclCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    async GetPagedSL(req: Request, res: Response) {
        try {
            await this.service.getPagedSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'AclController:GetSL');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Acl",
    //         "a": "Update",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "update": {
    //                             "aclName": "/corp-deskv1.2.1.2/system/modules/comm/controllers"
    //                         },
    //                         "where": {
    //                             "aclId": 45762
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
        console.log('AclController::Update()/01');
        try {
            console.log('AclController::Update()/02');
            await this.service.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

    async UpdateSL(req: Request, res: Response) {
        console.log('AclController::UpdateSL()/01');
        try {
            console.log('AclController::UpdateSL()/02');
            await this.service.updateSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'AclController:UpdateSL');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Acl",
    //         "a": "Delete",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {"aclId": 45763}
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
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

    async DeleteSL(req: Request, res: Response) {
        try {
            await this.service.deleteSL(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'BillController:DeleteSL');
        }
    }

}