import { Request, Response } from "express";
import { Observable } from 'rxjs';
import { BaseService } from '../../base/base.service';
import { CdService } from '../../base/cd.service';
import { IExtServiceInput, IQuery, IServiceInput } from '../../base/i-base';
import { CdObjTypeModel } from '../../moduleman/models/cd-obj-type.model';
import { CompanyModel } from '../../moduleman/models/company.model';
import { ConsumerModel } from '../../moduleman/models/consumer.model';
import { CompanyService } from '../../moduleman/services/company.service';
import { ConsumerService } from '../../moduleman/services/consumer.service';
import { GroupTypeModel } from '../models/group-type.model';
import { GroupModel } from '../models/group.model';
import { SessionModel } from '../models/session.model';
import { UserModel } from '../models/user.model';
import { SessionService } from './session.service';
import { UserService } from './user.service';
import { safeStringify } from '../../utils/safe-stringify';
import { GenericController } from "../../base/generic-controller";
import { GenericService } from "../../base/generic-service";

// export class GroupService extends CdService {
export class GroupService extends GenericService<GroupModel> {

    cdToken!: string;
    srvSess!: SessionService;
    // b: BaseService;
    serviceModel = GroupModel;
    docName: string = "GroupService";

    /*
     * create rules
     */
    cRules = {
        required: ['groupName', 'groupTypeId',],
        noDuplicate: ['groupName', 'groupOwnerId',]
    };
    uRules: any[] = [];
    dRules: any[] = [];
    constructor() {
        super(GroupModel)
        // this.b = new BaseService();
    }

    getMemoSummary(cuid: string) {
        return [{}];
    }

    async getModuleGroup(req: Request, res: Response, moduleName: string): Promise<GroupModel[]> {
        const serviceInput = {
            serviceInstance: this,
            serviceModel: GroupModel,
            docName: 'GroupService::getGroupByName',
            cmd: {
                action: 'find',
                query: { where: { groupName: moduleName } }
            },
            dSource: 1,
        }
        return await this.b.read(req, res, serviceInput);
    }

    getModuleGroup$(req: Request, res: Response, moduleName: string): Observable<GroupModel[]> {
        const serviceInput = {
            serviceModel: GroupModel,
            docName: 'GroupService::getGroupByName',
            cmd: {
                action: 'find',
                query: { where: { groupName: moduleName } }
            },
            dSource: 1,
        }
        return this.b.read$(req, res, serviceInput);
    }

    async getGroupByName(req: Request, res: Response, groupParams: any) {
        // console.log('starting GroupService::getGroupByName(req, res, groupParams)');
        // console.log('GroupService::getGroupByName/groupParams:', groupParams);
        if (groupParams.groupName) {
            const serviceInput = {
                serviceInstance: this,
                serviceModel: GroupModel,
                docName: 'GroupService::getGroupByName',
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

    // /**
    //  * In the example below we are registering booking module as a resource to emp services
    //  * This allows users registered under empservices to access booking module when appropriate privileges are given
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Group",
    //         "a": "Create",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "data": {
    //                          "cd_obj_type_id": "8b4cf8de-1ffc-4575-9e73-4ccf45a7756b", // module
    //                          "group_id": "B0B3DA99-1859-A499-90F6-1E3F69575DCD", // emp services
    //                          "obj_id": "8D4ED6A9-398D-32FE-7503-740C097E4F1F" // recource (module) id...in this case: booking module
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
    async create(req: Request, res: Response) {
        console.log('GroupService::create::validateCreate()/01')
        const svSess = new SessionService();
        if (await this.validateCreate(req, res)) {
            await this.beforeCreate(req, res);
            const serviceInput = {
                serviceModel: GroupModel,
                serviceModelInstance: this.serviceModel,
                docName: 'Create group',
                dSource: 1,
            }
            console.log('GroupService::create()/serviceInput:', serviceInput)
            console.log('GroupService::create()/(req as any).post:', JSON.stringify((req as any).post))
            const respData = await this.b.create(req, res, serviceInput);
            this.b.i.app_msg = 'new group created';
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = await respData;
            const r = await this.b.respond(req, res);
        } else {
            console.log('moduleman/create::validateCreate()/02')
            const r = await this.b.respond(req, res);
        }
    }

    async createI(req: Request, res: Response, serviceInputExt: IExtServiceInput<any>): Promise<GroupModel | boolean> {
        return await this.b.createI(req, res, serviceInputExt)
    }

    async createPalsGroup(req: Request, res: Response, userData: UserModel) {
        console.log('GroupService::createPalsGroup()/01')
        // const svGroup = new GroupService()
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
        console.log('GroupService::createPalsGroup()/consumerData:', consumerData)
        // const consumerData = await svConsumer.activeConsumer(req, res);

        if (consumerData.length > 0) {
            coId = consumerData[0].companyId;
        }
        const co: CompanyModel[] = await svCompany.getCompanyI(req, res, { where: { companyId: coId } })
        console.log('GroupService::createPalsGroup()/co:', co)

        if (co.length > 0) {
            coId = co[0].companyId
            consGuid = consumerData[0].consumerGuid
            // const cUser = await svSess.getCurrentUser(req)
            console.log('GroupService::createPalsGroup()/userData:', userData)
            console.log('GroupService::createPalsGroup()/co[0].consumerGuid:', co[0].consumerGuid)
            console.log('GroupService::createPalsGroup()/consGuid:', consGuid)
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
            console.log('GroupService::createPalsGroup()/groupData:', groupData)
            const si = {
                serviceInstance: this,
                serviceModel: GroupModel,
                serviceModelInstance: this.serviceModel,
                docName: 'UserService/afterCreate',
                dSource: 1,
            }
            const serviceInputExt: IExtServiceInput<any> = {
                serviceInput: si,
                entityData: groupData
            }
            console.log('GroupService::createPalsGroup()/serviceInputExt:', serviceInputExt)
            return await this.createI(req, res, serviceInputExt)
        } else {
            // console.log('CompanyService::read$()/e:', e)
            const e = "unable to associate user with any company"
            this.b.err.push(e);
            const i = {
                messages: this.b.err,
                code: 'BaseService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
        }

    }

    async groupExists(req: Request, res: Response, q: IQuery): Promise<boolean> {
        const serviceInput: IServiceInput<any> = {
            serviceInstance: this,
            serviceModel: GroupModel,
            docName: 'GroupService::groupExists',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1,
        }
        return this.b.read(req, res, serviceInput)
    }

    async beforeCreate(req: Request, res: Response): Promise<any> {
        const q: any = { where: { cdToken: (req as any).post.dat.token } };
        const serviceInput: IServiceInput<any> = {
            serviceModel: SessionModel,
            modelName: "SessionModel",
            serviceModelInstance: new SessionModel(),
            cmd: {
                action: 'find',
                query: q
            },
            docName: 'beforeCreate',
            dSource: 1,
        }
        this.b.sess = await this.b.get(req, res, serviceInput)
        if (this.b.sess.length > 0) {
            this.b.setPlData(req, { key: 'groupOwnerId', value: this.b.sess[0].currentUserId });
        }
        this.b.setPlData(req, { key: 'consumerGuid', value: this.b.sess[0].consumerGuid });
        this.b.setPlData(req, { key: 'groupGuid', value: this.b.getGuid() });
        this.b.setPlData(req, { key: 'groupEnabled', value: true });
        return true;
    }

    async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        //
    }

    async update(req: Request, res: Response): Promise<void> {
        // console.log('GroupService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: GroupModel,
            docName: 'GroupService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        // console.log('GroupService::update()/02')
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
    async beforeUpdate(q: any) {
        if (q.update.groupResourceEnabled === '') {
            q.update.groupResourceEnabled = null;
        }
        return q;
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

    async validateCreate(req: Request, res: Response) {
        const b = new BaseService();
        console.log('moduleman/GroupService::validateCreate()/01')
        const svSess = new SessionService();
        ///////////////////////////////////////////////////////////////////
        // 1. Validate against duplication
        const params = {
            controllerInstance: this,
            model: GroupModel,
        }
        this.b.i.code = 'GroupService::validateCreate';
        let ret = false;
        if (await this.b.validateUnique(req, res, params)) {
            console.log('moduleman/GroupService::validateCreate()/02')
            if (await this.b.validateRequired(req, res, this.cRules)) {
                console.log('moduleman/GroupService::validateCreate()/03')
                ret = true;
            } else {
                console.log('moduleman/GroupService::validateCreate()/04')
                ret = false;
                this.b.i.app_msg = `the required fields ${this.b.isInvalidFields.join(', ')} is missing`;
                this.b.err.push(this.b.i.app_msg);
                this.b.setAppState(false, this.b.i, svSess.sessResp);
            }
        } else {
            console.log('moduleman/GroupService::validateCreate()/05')
            ret = false;
            this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(', ')} is not allowed`;
            this.b.err.push(this.b.i.app_msg);
            this.b.setAppState(false, this.b.i, svSess.sessResp);
        }
        console.log('moduleman/GroupService::validateCreate()/06')
        const pl: GroupModel = await this.b.getPlData(req);
        //////////////////////////////////////////////////////////////////////////
        // 3. confirm the groupId referenced exists
        if ('groupTypeId' in pl) {
            console.log('moduleman/GroupService::validateCreate()/12')
            console.log('moduleman/GroupService::validateCreate()/pl:', pl)
            const serviceInput = {
                serviceModel: GroupTypeModel,
                docName: 'GroupService::validateCreate',
                cmd: {
                    action: 'find',
                    query: { where: { groupTypeId: pl.groupTypeId } }
                },
                dSource: 1
            }
            console.log('moduleman/GroupService::validateCreate()/serviceInput:', JSON.stringify(serviceInput))
            const r: any = await b.read(req, res, serviceInput)
            console.log('moduleman/GroupService::validateCreate()/r:', r)
            if (r.length > 0) {
                console.log('moduleman/GroupService::validateCreate()/13')
                ret = true;
            } else {
                console.log('moduleman/GroupService::validateCreate()/14')
                ret = false;
                this.b.i.app_msg = `group type reference is invalid`;
                this.b.err.push(this.b.i.app_msg);
                this.b.setAppState(false, this.b.i, svSess.sessResp);
            }
        } else {
            console.log('moduleman/GroupService::validateCreate()/15')
            // this.b.i.app_msg = `parentModuleGuid is missing in payload`;
            // this.b.err.push(this.b.i.app_msg);
            //////////////////
            this.b.i.app_msg = `groupTypeId is missing in payload`;
            this.b.err.push(this.b.i.app_msg);
            this.b.setAppState(false, this.b.i, svSess.sessResp);
        }
        console.log('GroupService::getGroup/20');
        if (this.b.err.length > 0) {
            console.log('moduleman/GroupService::validateCreate()/21')
            ret = false;
        }
        return ret;
    }

    async getGroup(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('GroupService::getGroup/f:', q);
        const serviceInput = {
            serviceModel: GroupModel,
            docName: 'GroupService::getGroup$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    console.log('GroupService::read$()/r:', r)
                    this.b.i.code = 'GroupController::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            console.log('GroupService::read$()/e:', e)
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

    async getGroupI(req: Request, res: Response, q?: IQuery): Promise<GroupModel[]> {
        if (q == null) {
            q = this.b.getQuery(req);
        }
        console.log('GroupService::getGroupI/f:', q);
        const serviceInput = {
            serviceModel: GroupModel,
            docName: 'GroupService::getGroupI',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        } as IServiceInput<GroupModel>
        try {
            return this.b.read(req, res, serviceInput)
        } catch (e: any) {
            console.log('GroupService::getGroupI()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'GroupService:getGroupI',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
            return [];
        }
    }

    async getGroupType(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('GroupService::getGroup/f:', q);
        const serviceInput = {
            serviceModel: GroupTypeModel,
            docName: 'GroupService::getGroupType$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    console.log('GroupService::read$()/r:', r)
                    this.b.i.code = 'GroupController::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            console.log('GroupService::read$()/e:', e)
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

    async getGroupTypeI(req: Request, res: Response, q?: IQuery): Promise<GroupModel[]> {
        const b = new BaseService();
        if (q == null) {
            q = this.b.getQuery(req);
        }
        console.log('GroupService::getGroupI/f:', q);
        const serviceInput = {
            serviceModel: GroupTypeModel,
            docName: 'GroupService::getGroupI',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        } as IServiceInput<GroupTypeModel>
        try {
            return b.read(req, res, serviceInput)
        } catch (e: any) {
            console.log('GroupService::getGroupI()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'GroupService:getGroupI',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
            return [];
        }
    }

    getGroupCount(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('GroupService::getGroupCount/q:', q);
        const serviceInput = {
            serviceModel: GroupModel,
            docName: 'GroupService::getGroupCount$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'GroupController::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.respond(req, res)
            })
    }

    getGroupTypeCount(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('GroupService::getGroupCount/q:', q);
        const serviceInput = {
            serviceModel: GroupTypeModel,
            docName: 'GroupService::getGroupCount$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'GroupController::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.respond(req, res)
            })
    }

    async deleteI(req: Request, res: Response, q: IQuery): Promise<any> {
        console.log('GroupService::deleteI()/q:', q)
        const serviceInput = {
            serviceModel: GroupModel,
            docName: 'GroupService::deleteI',
            cmd: {
                action: 'delete',
                query: q
            },
            dSource: 1
        }

        return this.b.delete(req, res, serviceInput);
    }
}