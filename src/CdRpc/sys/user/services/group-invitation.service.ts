import { Request, Response } from "express";
import { Observable } from 'rxjs';
import { BaseService } from '../../base/base.service';
import { CdService } from '../../base/cd.service';
import { CDOBJ_TYPE_USER, IExtServiceInput, IQuery, IServiceInput } from '../../base/i-base';
import { CdObjTypeModel } from '../../moduleman/models/cd-obj-type.model';
import { CompanyModel } from '../../moduleman/models/company.model';
import { ConsumerModel } from '../../moduleman/models/consumer.model';
import { CompanyService } from '../../moduleman/services/company.service';
import { ConsumerService } from '../../moduleman/services/consumer.service';
import { GroupMemberController } from '../controllers/group-member.controller';
import { GroupInvitationTypeModel } from '../models/group-invitation-type.model';
import { getGroupInvitationParams, GroupInvitationModel, siCreate } from '../models/group-invitation.model';
import { GroupMemberModel } from '../models/group-member.model';
import { GroupModel } from '../models/group.model';
import { SessionModel } from '../models/session.model';
import { UserModel } from '../models/user.model';
import { GroupMemberService } from './group-member.service';
import { GroupService } from './group.service';
import { SessionService } from './session.service';
import { UserService } from './user.service';
import { GenericController } from "../../base/generic-controller";
import { GenericService } from "../../base/generic-service";

// export class GroupInvitationService extends CdService {
export class GroupInvitationService extends GenericService<GroupInvitationModel> {
    cdToken!: string;
    srvSess!: SessionService;
    // b: BaseService!;
    serviceModel = GroupInvitationModel;
    docName: string = "GroupInvitationService";
    plData!: GroupInvitationModel;

    hostUser!: UserModel[];
    guestUser!: UserModel[];
    inviteGroup!: GroupModel[];
    groupInvitationTypes!: GroupInvitationTypeModel[];
    hostGroupMember!: GroupMemberModel;


    /*
     * create rules
     */
    cRules = {
        required: [
            'hostUser',
            'guestUser',
            'groupInvitationTypeId',
            'groupId'
        ],
        noDuplicate: [
            'hostUser',
            'guestUser',
            'groupId'
        ]
    };
    uRules: any[] = [];
    dRules: any[] = [];
    constructor() {
        super(GroupInvitationModel)
        this.b = new BaseService();
    }

    /**
     * 
     * 
        {
            "ctx": "Sys",
            "m": "User",
            "c": "GroupInvitationController",
            "a": "actionCreate",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "hostUser": "1010",
                            "guestUser": "1003",
                            "groupInvitationTypeId": 1315,
                            "groupId": 1323
                        }
                        }
                    ],
                "token": "6E831EAF-244D-2E5A-0A9E-27C1FDF7821D"
            },
            "args": null
        }


        {
            "ctx": "Sys",
            "m": "User",
            "c": "GroupInvitation",
            "a": "Create",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "hostUser": "1010",
                            "guestUser": "1003",
                            "groupInvitationTypeId": "1313"
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
    async create(req: Request, res: Response) {
        console.log('GroupInvitationService::create::validateCreate()/01')
        const svSess = new SessionService();
        if (await this.validateCreate(req, res)) {
            await this.beforeCreate(req, res);
            // const serviceInput = {
            //     serviceModel: GroupInvitationModel,
            //     serviceModelInstance: this.serviceModel,
            //     docName: 'Create invitation to a group',
            //     dSource: 1,
            // }
            // console.log('GroupInvitationService::create()/serviceInput:', serviceInput)
            console.log('GroupInvitationService::create()/(req as any).post:', JSON.stringify((req as any).post))
            const respData = await this.b.create(req, res, siCreate(this));
            console.log('GroupInvitationService::create()/respData:', JSON.stringify(respData))
            if ('app_state' in respData) {
                if (respData.success === false) {
                    return respData
                } else {
                    const r = await this.b.respond(req, res);
                }
            } else {
                this.b.i.app_msg = 'new group created';
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = await respData;
                const r = await this.b.respond(req, res);
            }

        } else {
            console.log('GroupInvitationService/create::validateCreate()/02')
            const r = await this.b.respond(req, res);
        }
    }

    async createI(req: Request, res: Response, serviceInputExt: IExtServiceInput<GroupInvitationModel>): Promise<GroupInvitationModel | boolean> {
        return await this.b.createI(req, res, serviceInputExt)
    }

    async validateCreate(req: Request, res: Response): Promise<boolean> {
        console.log('GroupInvitationService::validateCreate()/01')
        const svSess = new SessionService()
        const svUser = new UserService()
        const svGroup = new GroupService()
        const params = {
            controllerInstance: this,
            model: GroupInvitationModel,
        }
        this.b.i.code = 'GroupInvitation::validateCreate';
        let ret = false;
        this.plData = await this.b.getPlData(req)
        /**
                 * confirm that the host, guest and destination groups exists
                 */
        let q: any = { where: { userId: this.plData.hostUser } };
        this.hostUser = await svUser.getUserI(req, res, q)
        console.log('GroupInvitationService::validateCreate()/this.hostUser:', this.hostUser)
        q = { where: { userId: this.plData.guestUser } };
        this.guestUser = await svUser.getUserI(req, res, q);
        console.log('GroupInvitationService::validateCreate()/this.guestUser:', this.guestUser)
        // groupInvitationTypeId
        q = { where: { groupInvitationTypeId: this.plData.groupInvitationTypeId } };
        this.groupInvitationTypes = await this.getGroupInvitationTypeI(req, res, q)
        console.log('GroupInvitationService::validateCreate()/this.groupInvitationTypes1:', this.groupInvitationTypes)
        if (await this.isUserPal(req, res)) {
            await this.setPalsGroupID(req, res);
        }
        if (await this.b.validateUnique(req, res, params)) {
            console.log('GroupInvitation::validateCreate()/03')
            if (await this.b.validateRequired(req, res, this.cRules)) {
                console.log('GroupInvitation::validateCreate()/04')

                console.log('GroupInvitationService::validateCreate()/this.plData:', this.plData)
                // /**
                //  * confirm that the host, guest and destination groups exists
                //  */
                if ('groupId' in this.plData) {
                    q = { where: { groupId: this.plData.groupId } };
                    this.inviteGroup = await svGroup.getGroupI(req, res, q)
                    console.log('GroupInvitationService::validateCreate()/this.groupInvitationTypes2:', this.groupInvitationTypes)
                    if (this.hostUser.length > 0 && this.guestUser.length > 0 && this.inviteGroup.length > 0) {
                        return true;
                    } else {
                        return false;
                    }
                }

                if (this.hostUser.length > 0 && this.guestUser.length > 0) {
                    return true;
                } else {
                    return false;
                }

            } else {
                console.log('GroupInvitation::validateCreate()/04')
                ret = false;
                this.b.i.app_msg = `the required fields ${this.b.isInvalidFields.join(', ')} is missing`;
                this.b.err.push(this.b.i.app_msg);
                this.b.setAppState(false, this.b.i, svSess.sessResp);
                return ret;
            }
        } else {
            console.log('GroupInvitation::validateCreate()/05')
            ret = false;
            this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(', ')} is not allowed`;
            this.b.err.push(this.b.i.app_msg);
            this.b.setAppState(false, this.b.i, svSess.sessResp);
            return ret;
        }
    }

    async beforeCreate(req: Request, res: Response): Promise<any> {
        console.log('GroupInvitationService::beforeCreate()/01')
        await this.b.setPlData(req, { key: 'groupInvitationGuid', value: this.b.getGuid() });
    }

    async isUserPal(req: Request, res: Response): Promise<boolean> {
        console.log('GroupInvitationService::isUserPal()/01')
        if (this.b.isEmpty(this.groupInvitationTypes)) {
            const q = { where: { groupInvitationTypeId: this.plData.groupInvitationTypeId } };
            this.groupInvitationTypes = await this.getGroupInvitationTypeI(req, res, q)
            console.log('GroupInvitationService::isUserPal()/this.groupInvitationTypes:', this.groupInvitationTypes)
        }
        if (this.groupInvitationTypes[0].groupInvitationTypeName === 'user_pals') {
            return true;
        } else {
            return false;
        }
    }

    async setPalsGroupID(req: Request, res: Response) {
        console.log('GroupInvitationService::setPalsGroupID()/01')
        // use hostUser to get the userGuid then use it to get group details
        const svGroup = new GroupService()
        console.log('GroupInvitationService::setPalsGroupID()/this.hostUser:', this.hostUser)
        const hostGroup: GroupModel[] = await svGroup.getGroupI(req, res, { where: { groupName: `${this.hostUser[0].userGuid}-pals` } })
        console.log('GroupInvitationService::setPalsGroupID()/hostGroup:', hostGroup)
        await this.b.setPlData(req, { key: 'groupId', value: hostGroup[0].groupId });
        console.log('GroupInvitationService::setPalsGroupID()/(req as any).post:', JSON.stringify((req as any).post))
    }

    async createPalsGroupInvitation(req: Request, res: Response, userData: UserModel) {
        console.log('GroupInvitationService::createPalsGroupInvitation()/01')
        // const svGroupInvitation = new GroupInvitationService()
        const svConsumer = new ConsumerService()
        svConsumer.b = this.b
        const svCompany = new CompanyService()
        svCompany.b = this.b
        // const svSess = new SessionService()
        let coId = null;
        let consGuid = null;
        // const co = await svConsumer.activeCompany(req, res);

        ////////////
        const plData = await this.b.getPlData(req)
        consGuid = plData.consumerGuid
        const consumerData: ConsumerModel[] = await svConsumer.getConsumerByGuid(req, res, consGuid)
        console.log('GroupInvitationService::createPalsGroupInvitation()/consumerData:', consumerData)
        // const consumerData = await svConsumer.activeConsumer(req, res);

        if (consumerData.length > 0) {
            coId = consumerData[0].companyId;
        }
        const co: CompanyModel[] = await svCompany.getCompany(req, res, { where: { companyId: coId } })
        console.log('GroupInvitationService::createPalsGroupInvitation()/co:', co)

        if (co.length > 0) {
            coId = co[0].companyId
            consGuid = consumerData[0].consumerGuid
        }
        // const cUser = await svSess.getCurrentUser(req)
        console.log('GroupInvitationService::createPalsGroupInvitation()/userData:', userData)
        console.log('GroupInvitationService::createPalsGroupInvitation()/co[0].consumerGuid:', co[0].consumerGuid)
        console.log('GroupInvitationService::createPalsGroupInvitation()/consGuid:', consGuid)
        const groupData = {
            groupGuid: this.b.getGuid(),
            groupName: `${userData.userGuid}-pals`,
            groupOwnerId: userData.userId,
            groupTypeId: 7,
            moduleGuid: "-dkkm6",
            companyId: coId,
            consumerGuid: consGuid,
            isPublic: false,
            enabled: true,
        };
        console.log('GroupInvitationService::createPalsGroupInvitation()/groupData:', groupData)
        const si = {
            serviceInstance: this,
            serviceModel: GroupInvitationModel,
            serviceModelInstance: this.serviceModel,
            docName: 'UserService/afterCreate',
            dSource: 1,
        }
        const serviceInputExt: IExtServiceInput<any> = {
            serviceInput: si,
            entityData: groupData
        }
        console.log('GroupInvitationService::createPalsGroupInvitation()/serviceInputExt:')
        return await this.createI(req, res, serviceInputExt)
    }

    async accept(req: Request, res: Response) {
        console.log('GroupInvitationService::accept()/01')
        console.log('GroupInvitationService::accept()/this.b.getCuid(req):', this.b.getCuid(req))
        const svSess = new SessionService()
        if (await this.validateAccept(req, res)) {
            console.log('GroupInvitationService::accept()/02')
            try {
                console.log('GroupInvitationService::accept()/03')
                // move user to group 
                const svGroupMember = new GroupMemberService()
                let si = {
                    serviceInstance: svGroupMember,
                    serviceModel: GroupMemberModel,
                    serviceModelInstance: svGroupMember.serviceModel,
                    docName: 'svGroupInvitation/accept',
                    dSource: 1,
                }
                let serviceInputExt: IExtServiceInput<any> = {
                    serviceInput: si,
                    entityData: this.hostGroupMember
                }
                const invoiceData: any = await svGroupMember.createI(req, res, serviceInputExt)
                console.log('GroupInvitationService::accept()/04')
                console.log('GroupInvitationService::accept()/this.plData:', this.plData)
                ///////////////////
                const serviceInput = {
                    serviceModel: GroupInvitationModel,
                    docName: 'GroupInvitationService::updateI',
                    cmd: {
                        action: 'update',
                        query: {
                            where: this.plData,
                            update: { accept: true }
                        }
                    },
                    dSource: 1
                }
                const result = await this.updateI(req, res, serviceInput)
                // the following message can be configured for different type of membership
                // this.b.i.app_msg = 'you are now a member'
                // this.b.setAppState(true, this.b.i, svSess.sessResp);
                // this.b.cdResp.data = result;
                // const r = await this.b.respond(req, res);
                this.b.successResponse(req, res, result, 'you are now a member')
            } catch (e: any) {
                console.log('GroupInvitationService::accept()/05')
                console.log('GroupInvitationService::getGroupI()/e:', e)
                this.b.err.push(e.toString());
                const i = {
                    messages: this.b.err,
                    code: 'GroupInvitationService:getGroupI',
                    app_msg: ''
                };
                await this.b.serviceErr(req, res, e, i.code)
                await this.b.respond(req, res)
            }
        } else {
            console.log('GroupInvitationService::accept()/06')
            this.b.err.push('validation failure');
            const i = {
                messages: this.b.err,
                code: 'GroupInvitationService:accept',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, 'validation failure', i.code)
            await this.b.respond(req, res)
        }
    }

    /**
     * - enforce user privacy: only the subject user, can perform the accept process.
     * - So confirm that the currentUser maps to the user accepting the invitation
     * @param req 
     * @param res 
     */
    async validateAccept(req: Request, res: Response) {
        console.log('GroupInvitationService::validateAccept()/01')
        console.log('GroupInvitationService::validateAccept()/this.b.getCuid(req)1:', this.b.getCuid(req))
        const svSess = new SessionService()
        const svGroup = new GroupService()
        const svGroupMember = new GroupMemberService()
        const svUser = new UserService()
        this.plData = await this.b.getPlData(req)
        console.log('GroupInvitationService::validateAccept()/this.plData:', this.plData)
        try {
            console.log('GroupInvitationService::validateAccept()/02')
            console.log('GroupInvitationService::validateAccept()/this.b.getCuid(req)2:', this.b.getCuid(req))
            const groupInvitations: GroupInvitationModel[] = await this.getGroupInvitationI(req, res, { where: { groupInvitationId: this.plData.groupInvitationId } })
            console.log('GroupInvitationService::validateAccept()/groupInvitations:', groupInvitations)
            console.log('GroupInvitationService::validateAccept()/03')
            if (groupInvitations.length > 0) {
                console.log('GroupInvitationService::validateAccept()/04')
                const destinationGroup: GroupModel[] = await svGroup.getGroupI(req, res, { where: { groupId: groupInvitations[0].groupId } })
                console.log('GroupInvitationService::validateAccept()/destinationGroup:', destinationGroup)
                const guestUser: UserModel[] = await svUser.getUserI(req, res, { where: { userId: groupInvitations[0].guestUser } })
                console.log('GroupInvitationService::validateAccept()/guestUser:', guestUser)
                this.hostGroupMember = {
                    userIdMember: guestUser[0].userId,
                    memberGuid: guestUser[0].userGuid,
                    groupGuidParent: destinationGroup[0].groupGuid,
                    cdObjTypeId: CDOBJ_TYPE_USER
                }
                console.log('GroupInvitationService::validateAccept()/this.hostGroupMember:', this.hostGroupMember)
                console.log('GroupInvitationService::validateAccept()/this.b.getCuid(req):', this.b.getCuid(req))
                // const cuid = svSess.getCuid(req)
                console.log('GroupInvitationService::validateAccept()/(req as any).post:', (req as any).post)
                if (this.b.getCuid(req) === this.hostGroupMember.userIdMember) {
                    console.log('GroupInvitationService::validateAccept()/05')
                    // confirm the invitation has not been accepted yet
                    if (groupInvitations[0].accept) {
                        console.log('GroupInvitationService::validateAccept()/05_1')
                        this.b.setAlertMessage('this invitation has already been accepted', svSess, false)
                        return false;
                    }
                    return true;
                } else {
                    this.b.setAlertMessage('you do not have privilege to do this process', svSess, false)
                    return false;
                }
            } else {
                console.log('GroupInvitationService::validateAccept()/07')
                return false
            }
        } catch (e: any) {
            console.log('GroupInvitationService::validateAccept()/02')
            console.log('GroupInvitationService::validateAccept()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'GroupInvitationService:validateAccept',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    async getMemoSummary(cuid: string): Promise<any[]> {
        return [{}];
    }

    async getModuleGroupInvitation(req: Request, res: Response, moduleName: string): Promise<GroupInvitationModel[]> {
        const serviceInput = {
            serviceInstance: this,
            serviceModel: GroupInvitationModel,
            docName: 'GroupInvitationService::getGroupInvitationByName',
            cmd: {
                action: 'find',
                query: { where: { groupName: moduleName } }
            },
            dSource: 1,
        }
        return await this.b.read(req, res, serviceInput);
    }

    async getModuleGroupInvitation$(req: Request, res: Response, moduleName: string): Promise<Observable<GroupInvitationModel[]>> {
        const serviceInput = {
            serviceModel: GroupInvitationModel,
            docName: 'GroupInvitationService::getGroupInvitationByName',
            cmd: {
                action: 'find',
                query: { where: { groupName: moduleName } }
            },
            dSource: 1,
        }
        return this.b.read$(req, res, serviceInput);
    }

    async getGroupInvitationByName(req: Request, res: Response, groupParams: any) {
        // console.log('starting GroupInvitationService::getGroupInvitationByName(req, res, groupParams)');
        // console.log('GroupInvitationService::getGroupInvitationByName/groupParams:', groupParams);
        if (groupParams.groupName) {
            const serviceInput = {
                serviceInstance: this,
                serviceModel: GroupInvitationModel,
                docName: 'GroupInvitationService::getGroupInvitationByName',
                cmd: {
                    action: 'find',
                    query: { where: { groupName: groupParams.groupName, groupTypeId: groupParams.groupTypeId } }
                },
                dSource: 1,
            }
            return await this.b.read(req, res, serviceInput);
        } else {
            console.log('groupParams.groupName is invalid');
        }
    }



    async groupExists(req: Request, res: Response, q: IQuery): Promise<boolean> {
        const serviceInput: IServiceInput<any> = {
            serviceInstance: this,
            serviceModel: GroupInvitationModel,
            docName: 'GroupInvitationService::groupExists',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1,
        }
        return this.b.read(req, res, serviceInput)
    }

    async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        //
    }

    async update(req: Request, res: Response): Promise<void> {
        // console.log('GroupInvitationService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: GroupInvitationModel,
            docName: 'GroupInvitationService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        // console.log('GroupInvitationService::update()/02')
        this.b.update$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.respond(req, res)
            })
    }

    /**
     * harmonise any data that can
     * result in type error;
     * @param q
     * @returns
     */
    beforeUpdate(q: any) {
        if (q.update.groupResourceEnabled === '') {
            q.update.groupResourceEnabled = null;
        }
        return q;
    }

    // async updateI(req, res, serviceInput) {
    //     return this.b.update(req, res, serviceInput)
    // }
    async updateI(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<GroupInvitationModel>,
  ): Promise<any> {
    console.log("UserService::updateI()/01");

    // Check if cmd exists before assignment
    if (serviceInput.cmd) {
      serviceInput.cmd.query = this.beforeUpdate(
        serviceInput.cmd.query as IQuery,
      );
    }

    serviceInput = {
      serviceModel: GroupInvitationModel,
      docName: "GroupInvitationService::updateI",
      cmd: {
        action: "update",
        query: serviceInput.cmd?.query as IQuery,
      },
      dSource: 1,
    };
    console.log("GroupInvitationService::updateI()/02");
    return this.b.update(req, res, serviceInput);
  }
    

    async remove(req: Request, res: Response) {
        //
    }

    /**
     * methods for transaction rollback
     */
    rbCreate(): number {
        return 1;
    }

    rbUpdate(): number {
        return 1;
    }

    rbDelete(): number {
        return 1;
    }

    async getGroupInvitation(req: Request, res: Response) {
        // const q = this.b.getQuery(req);
        // console.log('GroupInvitationService::getGroupInvitation/f:', q);
        // const serviceInput = {
        //     serviceModel: GroupInvitationModel,
        //     docName: 'GroupInvitationService::getGroupInvitation',
        //     cmd: {
        //         action: 'find',
        //         query: q
        //     },
        //     dSource: 1
        // }
        try {
            this.b.read$(req, res, getGroupInvitationParams(this.b.getQuery(req)))
                .subscribe((r: any) => {
                    // console.log('GroupInvitationService::read$()/r:', r)
                    // this.b.i.code = 'GroupInvitationController::Get';
                    // const svSess = new SessionService();
                    // svSess.sessResp.cd_token = (req as any).post.dat.token;
                    // svSess.sessResp.ttl = svSess.getTtl();
                    // this.b.setAppState(true, this.b.i, svSess.sessResp);
                    // this.b.cdResp.data = r;
                    // this.b.respond(req, res)
                    this.b.successResponse(req, res, r)
                })
        } catch (e: any) {
            console.log('GroupInvitationService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'BaseService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    async getGroupInvitationI(req: Request, res: Response, q: IQuery) {
        console.log('GroupInvitationService::getGroupInvitationI/f:', q);
        const serviceInput = {
            serviceModel: GroupInvitationModel,
            docName: 'GroupInvitationService::getGroupInvitationI',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            return await this.b.read(req, res, serviceInput)
        } catch (e: any) {
            console.log('GroupInvitationService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'BaseService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    async getGroupInvitationType(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('GroupInvitationService::getGroupInvitation/f:', q);
        const serviceInput = {
            serviceModel: GroupInvitationTypeModel,
            docName: 'GroupInvitationService::getGroupInvitationType$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    console.log('GroupInvitationService::read$()/r:', r)
                    this.b.i.code = 'GroupInvitationController::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            console.log('GroupInvitationService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'BaseService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    async getGroupInvitationTypeI(req: Request, res: Response, q?: IQuery): Promise<GroupInvitationTypeModel[]> {
        const b = new BaseService();
        if (q == null) {
            q = this.b.getQuery(req);
        }
        console.log('GroupInvitationService::getGroupInvitationTypeI/f:', q);
        const serviceInput = {
            serviceModel: GroupInvitationTypeModel,
            docName: 'GroupInvitationService::getGroupInvitationTypeI',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        } as IServiceInput<GroupInvitationTypeModel>;
        try {
            return b.read(req, res, serviceInput)
        } catch (e: any) {
            console.log('GroupInvitationService::getGroupInvitationTypeI()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'GroupInvitationService:getGroupInvitationTypeI',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            this.b.respond(req, res)
            return [];
        }
    }

    // getGroupInvitationPaged(req: Request, res: Response) {
    //     const q = this.b.getQuery(req);
    //     console.log('GroupInvitationService::getGroupInvitationCount/q:', q);
    //     const serviceInput = {
    //         serviceModel: GroupInvitationModel,
    //         docName: 'GroupInvitationService::getGroupInvitationCount$',
    //         cmd: {
    //             action: 'find',
    //             query: q
    //         },
    //         dSource: 1
    //     }
    //     this.b.readCount$(req, res, serviceInput)
    //         .subscribe((r: any) => {
    //             this.b.i.code = 'GroupInvitationController::Get';
    //             const svSess = new SessionService();
    //             svSess.sessResp.cd_token = (req as any).post.dat.token;
    //             svSess.sessResp.ttl = svSess.getTtl();
    //             this.b.setAppState(true, this.b.i, svSess.sessResp);
    //             this.b.cdResp.data = r;
    //             this.b.respond(req, res)
    //         })
    // }

    /**
     * {
            "ctx": "App",
            "m": "CdAccts",
            "c": "GroupInvitation",
            "a": "GetPaged",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "select": [
                                "GroupInvitationName",
                                "GroupInvitationGuid"
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
     * @param req
     * @param res
     */
    getPaged(req: Request, res: Response) {
        // const q = this.b.getQuery(req);
        // console.log('GroupInvitationService::getGroupInvitationCount()/q:', q);
        // const serviceInput = {
        //     serviceModel: GroupInvitationModel,
        //     docName: 'GroupInvitationService::getGroupInvitationCount',
        //     cmd: {
        //         action: 'find',
        //         query: q
        //     },
        //     dSource: 1
        // }
        this.b.readCount$(req, res, getGroupInvitationParams(this.b.getQuery(req)))
            .subscribe((r: any) => {
                // this.b.i.code = 'GroupInvitationService::Get';
                // const svSess = new SessionService();
                // svSess.sessResp.cd_token = (req as any).post.dat.token;
                // svSess.sessResp.ttl = svSess.getTtl();
                // this.b.setAppState(true, this.b.i, svSess.sessResp);
                // this.b.cdResp.data = r;
                // this.b.sqliteConn.close();
                // this.b.respond(req, res)
                this.b.successResponse(req,res,r)
            })
    }

    getGroupInvitationTypeCount(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('GroupInvitationService::getGroupInvitationCount/q:', q);
        const serviceInput = {
            serviceModel: GroupInvitationTypeModel,
            docName: 'GroupInvitationService::getGroupInvitationCount$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'GroupInvitationController::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.respond(req, res)
            })
    }

    async delete(req: Request, res: Response): Promise<void> {
        const q = this.b.getQuery(req);
        console.log('GroupInvitationService::delete()/q:', q)
        const serviceInput = {
            serviceModel: GroupInvitationModel,
            docName: 'GroupInvitationService::delete',
            cmd: {
                action: 'delete',
                query: q
            },
            dSource: 1
        }

        this.b.delete$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.respond(req, res)
            })
    }
}