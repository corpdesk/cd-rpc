import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdController } from '../../base/cd.controller';
import { IExtServiceInput } from '../../base/i-base';
import { ConsumerService } from '../../moduleman/services/consumer.service';
import { GroupInvitationService } from '../services/group-invitation.service';
import { SessionService } from '../services/session.service';
import { GroupInvitationModel } from "../models/group-invitation.model";
import { GenericController } from "../../base/generic-controller";

// export class GroupInvitationController extends CdController {
export class GroupInvitationController extends GenericController<GroupInvitationModel> {
    b: BaseService;
    svGroupInvitation: GroupInvitationService;

    constructor() {
        super();
        this.b = new BaseService();
        this.svGroupInvitation = new GroupInvitationService();
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "User",
    //         "c": "GroupInvitation",
    //         "a": "Create",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "data": {
    //                         "groupName": "/src/CdApi/sys/moduleman",
    //                         "groupTypeGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
    //                         "parentGroupInvitationGuid": "00e7c6a8-83e4-40e2-bd27-51fcff9ce63b"
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
            await this.svGroupInvitation.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupInvitationController:Create');
        }
    }

    /**
     * {
            "ctx": "Sys",
            "m": "User",
            "c": "GroupInvitation",
            "a": "Accept",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "groupInvitationId": 1431
                        }
                    }
                ],
                "token": "415cc20f-33d4-4641-9fa2-ab35f9dcc8df"
            },
            "args": {}
        }
     * @param req
     * @param res
     */
    async Accept(req: Request, res: Response) {
        try {
            console.log('GroupInvitationController::Accept()/01')
            await this.svGroupInvitation.accept(req, res);
        } catch (e: any) {
            console.log('GroupInvitationController::Accept()/02')
            await this.b.serviceErr(req, res, e, 'GroupInvitationController:Create');
        }
    }

    /**
     * {
            "ctx": "Sys",
            "m": "User",
            "c": "GroupInvitation",
            "a": "Get",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "where": {"hostUser": 1003}
                        }
                    }
                ],
                "token": "415cc20f-33d4-4641-9fa2-ab35f9dcc8df"
            },
            "args": null
        }
     * @param req
     * @param res
     */
    async Get(req: Request, res: Response) {
        try {
            await this.svGroupInvitation.getGroupInvitation(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupInvitationController:Get');
        }
    }

    async GetType(req: Request, res: Response) {
        try {
            await this.svGroupInvitation.getGroupInvitationTypeCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupInvitationController:Get');
        }
    }

    /** Pageable request:
     * {
            "ctx": "Sys",
            "m": "User",
            "c": "GroupInvitation",
            "a": "GetPaged",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "select":["moduleId","moduleGuid"],
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
     * @param req
     * @param res
     */
    async GetPaged(req: Request, res: Response) {
        try {
            await this.svGroupInvitation.getPaged(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupInvitationController:GetPaged');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "User",
    //         "c": "GroupInvitation",
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
        console.log('GroupInvitationController::Update()/01');
        try {
            console.log('GroupInvitationController::Update()/02');
            await this.svGroupInvitation.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupInvitationController:Update');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "User",
    //         "c": "GroupInvitation",
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
            await this.svGroupInvitation.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupInvitationController:Update');
        }
    }
}