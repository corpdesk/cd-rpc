import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdController } from '../../base/cd.controller';
import { IExtServiceInput } from '../../base/i-base';
import { ConsumerService } from '../../moduleman/services/consumer.service';
import { GroupService } from '../services/group.service';
import { SessionService } from '../services/session.service';
import { GenericController } from "../../base/generic-controller";
import { GroupModel } from "../models/group.model";

// export class GroupController extends CdController {
export class GroupController extends GenericController<GroupModel> {
    b: BaseService;
    svGroup: GroupService;

    constructor() {
        super();
        this.b = new BaseService();
        this.svGroup = new GroupService();
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "User",
    //         "c": "Group",
    //         "a": "Create",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "data": {
    //                         "groupName": "/src/CdApi/sys/moduleman",
    //                         "groupTypeGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
    //                         "parentGroupGuid": "00e7c6a8-83e4-40e2-bd27-51fcff9ce63b"
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
            await this.svGroup.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupController:Create');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "User",
    //         "c": "Group",
    //         "a": "Get",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {"groupId": 45763}
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
            await this.svGroup.getGroup(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupController:Get');
        }
    }

    async GetType(req: Request, res: Response) {
        try {
            await this.svGroup.getGroupTypeCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupController:Get');
        }
    }

    // /** Pageable request:
    //  * {
    //         "ctx": "Sys",
    //         "m": "User",
    //         "c": "Group",
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
            await this.svGroup.getGroupCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupController:Get');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "User",
    //         "c": "Group",
    //         "a": "Update",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "update": {
    //                             "groupName": "/corp-deskv1.2.1.2/system/modules/comm/controllers"
    //                         },
    //                         "where": {
    //                             "groupId": 45762
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
        console.log('GroupController::Update()/01');
        try {
            console.log('GroupController::Update()/02');
            await this.svGroup.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupController:Update');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "User",
    //         "c": "Group",
    //         "a": "GetCount",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {"groupId": 45763}
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
            await this.svGroup.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupController:Update');
        }
    }
}