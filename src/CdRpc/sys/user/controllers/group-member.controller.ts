import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdController } from '../../base/cd.controller';
import { GroupMemberModel } from '../models/group-member.model';
import { GroupMemberService } from '../services/group-member.service';
import { GenericController } from "../../base/generic-controller";

// export class GroupMemberController extends CdController {
export class GroupMemberController extends GenericController<GroupMemberModel> {
    b: BaseService;
    svGroupMember: GroupMemberService;

    constructor() {
        super();
        this.b = new BaseService();
        this.svGroupMember = new GroupMemberService();
    }

    /**
     * {
            "ctx": "Sys",
            "m": "User",
            "c": "GroupMember",
            "a": "Create",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "userIdMember": "1010",
                            "memberGuid": "fe5b1a9d-df45-4fce-a181-65289c48ea00",
                            "groupGuidParent": "D7FF9E61-B143-D083-6130-A51058AD9630",
                            "cdObjTypeId": "9"
                        }
                    },
                    {
                        "data": {
                            "userIdMember": "1015",
                            "memberGuid": "fe5b1a9d-df45-4fce-a181-65289c48ea00",
                            "groupGuidParent": "2cdaba03-5121-11e7-b279-c04a002428aa",
                            "cdObjTypeId": "9"
                        }
                    }
                ],
                "token": "6E831EAF-244D-2E5A-0A9E-27C1FDF7821D"
            },
            "args": null
        }
     * @param req
     * @param res
     */
    async Create(req: Request, res: Response) {
        try {
            await this.svGroupMember.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupMemberController:Create');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "GroupMember",
    //         "a": "Get",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {"companyId": 45763}
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
            await this.svGroupMember.getGroupMember(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'GroupMemberController:Get');
        }
    }

    // async GetType(req: Request, res: Response) {
    //     try {
    //         await this.svGroupMember.getGroupMemberTypeCount(req, res);
    //     } catch (e: any) {
    //         this.b.serviceErr(req, res, e, 'GroupMemberController:Get');
    //     }
    // }

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
            await this.svGroupMember.getGroupMemberCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "GroupMember",
    //         "a": "Update",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "update": {
    //                             "companyName": "/corp-deskv1.2.1.2/system/modules/comm/controllers"
    //                         },
    //                         "where": {
    //                             "companyId": 45762
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
        console.log('GroupMemberController::Update()/01');
        try {
            console.log('GroupMemberController::Update()/02');
            await this.svGroupMember.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "GroupMember",
    //         "a": "GetCount",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {"companyId": 45763}
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
            await this.svGroupMember.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Update');
        }
    }

}