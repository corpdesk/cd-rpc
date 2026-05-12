
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { BaseService } from '../../base/base.service';
import { SessionService } from '../../user/services/session.service';
import { UserService } from '../../user/services/user.service';
// import { CalendarService } from '../../cd-scheduler/services/cd-scheduler-calendar.services';
import { GroupMemberService } from '../../user/services/group-member.service';
import { ConsumerService } from './consumer.service';
import { AclService } from './acl.service';
import { GroupService } from '../../user/services/group.service';
import { ModuleModel } from '../models/module.model';
import { IExtServiceInput, IRespInfo, IServiceInput, JWT } from '../../base/i-base';
import { DocModel } from '../models/doc.model';
import { CdPushSocketModel } from '../../cd-push/models/cd-push-socket.model';
import { JwtModel } from "../models/jwt.model";
import { GenericService } from "../../base/generic-service";
import { CdObjModel } from "../models/cd-obj.model";

const { sign, verify } = jwt;
const jwtSecret = 'example-secret';
const cdPushClients: any = [];
const socketsStore: any = [];

const DEFAULT_CD_REQUEST = {
    ctx: 'Sys',
    m: '',
    c: '',
    a: '',
    dat: {
        f_vals: [{
            data: {}
        }],
        token: ''
    },
    args: {}
};

// export class JwtService extends CdService {
export class JwtService extends GenericService<JwtModel> {
    cdToken = "";
    docModel;
    // b: BaseService;
    svSess!: SessionService;
    svUser!: UserService;
    svGroup!: GroupService;
    svGroupMember!: GroupMemberService;
    serviceModel = JwtModel; 
    docName: string = "";
    // svNotif: NotificationService;
    // svCalnd!: CalendarService;
    svConsumer!: ConsumerService;
    svAcl!: AclService;
    consumerGuid!: string;
    i: IRespInfo = {
        messages: [],
        code: '',
        app_msg: ''
    };

    /*
     * create rules
     */
    cRules: any = {
        required: [
            'docName',
            'docFrom',
            'docTypeId',
            'companyId',
        ],
        noDuplicate: [],
    };

    constructor() {
        super(JwtModel);
        this.b = new BaseService();
        this.docModel = new DocModel();
    }

    async create(req: Request, res: Response): Promise<void> {
        if (await this.validateCreate(req, res)) {
            this.docModel = new DocModel();
            await this.beforeCreate(req, res);
            const serviceInput = {
                serviceInstance: this,
                serviceModel: DocModel,
                docName: 'Create Doc',
                dSource: 1,
            }
            const regResp: any = await this.b.create(req, res, serviceInput);
            this.b.cdResp = await regResp;
            const r = await this.b.respond(req, res);
        } else {
            const i = {
                messages: this.b.err,
                code: 'DocService:create',
                app_msg: ''
            };
            await this.b.setAppState(false, i, null);
            const r = await this.b.respond(req, res);
        }
    }

    async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<JwtModel>,
  ): Promise<JwtModel | boolean> {
    serviceInputExt.entityData.jwtGuid = this.b.getGuid();
    return await this.b.createI(req, res, serviceInputExt);
  }

    async validateCreate(req: Request, res: Response) {
        const params = {
            controllerInstance: this,
            model: ModuleModel,
        }
        if (await this.b.validateUnique(req, res, params)) {
            if (await this.b.validateRequired(req, res, this.cRules)) {
                return true;
            } else {
                this.b.err.push(`you must provide ${this.cRules.required.join(', ')}`);
                return false;
            }
        } else {
            this.b.err.push(`duplication of ${this.cRules.noDuplicate.join(', ')} not allowed`);
            return false;
        }
    }

    async beforeCreate(req: Request, res: Response) {
        this.b.setPlData(req, { key: 'docGuid', value: this.b.getGuid() });
        this.b.setPlData(req, { key: 'docDate', value: this.b.mysqlNow() });
        this.b.setPlData(req, { key: 'docEnabled', value: true });
        // this.b.setPlData(req, { key: 'docTypeId', value: await this.getDocTypeId(req, res) });
        // this.b.setPlData(req, { key: 'companyId', value: await this.getCompanyId(req) });
        return true;
    }

    // async getDocTypeId(req: Request, res: Response): Promise<number> {
    //     let ret = 0;
    //     const m = (req as any).post.m;
    //     const c = (req as any).post.c;
    //     const a = (req as any).post.a;
    //     console.log('DocService::getDocTypeId()/01')
    //     const docType: DocTypeModel[] = await this.getDocTypeByName(req, res, `${c}_${a}`)
    //     console.log('DocService::getDocTypeId()/02')
    //     console.log('DocService::getDocTypeId()/docType:', docType);
    //     if (docType.length > 0) {
    //         console.log('DocService::getDocTypeId()/03')
    //         ret = docType[0].docTypeId;
    //     } else {
    //         console.log('DocService::getDocTypeId()/04')
    //         const r = await this.createDocType(req, res);
    //         console.log('DocService::getDocTypeId()/05')
    //         console.log('DocService::getDocTypeId()/r:', r);
    //         if (r.length > 0) {
    //             ret = r[0].docTypeId;
    //         } else {
    //             ret = null;
    //             console.log('DocService::getDocTypeId()/06')
    //             this.i = {
    //                 messages: this.b.err,
    //                 code: 'DocService:getDocTypeId',
    //                 app_msg: 'error getting DocTypeId'
    //             };
    //             await this.b.serviceErr(req, res, this.i.app_msg, this.i.code)
    //         }
    //     }
    //     console.log('DocService::getDocTypeId()/06')
    //     console.log('DocService::getDocTypeId()/ret:', ret)
    //     return await ret;
    // }

    // async createDocType(req: Request, res: Response): Promise<DocTypeModel[]> {
    //     console.log('DocService::createDocType()/01')
    //     const m = (req as any).post.m;
    //     const c = (req as any).post.c;
    //     const a = (req as any).post.a;
    //     console.log('DocService::createDocType()/(req as any).post:', (req as any).post)
    //     const docTypeRepository: any = await getConnection().getRepository(DocTypeModel);
    //     console.log('DocService::createDocType()/02')
    //     await this.b.setSess(req, res);
    //     const svModule = new ModuleService();
    //     console.log('DocService::createDocType()/03')
    //     const mod: ModuleModel[] = await svModule.getModuleByName(req, res, m)
    //     console.log('DocService::createDocType()/04')
    //     const dtm: DocTypeModel = new DocTypeModel();
    //     console.log('DocService::createDocType()/05')
    //     dtm.docTypeName = `${c}_${a}`;
    //     console.log('DocService::createDocType()/06')
    //     console.log('DocService::createDocType()/mod:', mod)
    //     if (mod.length > 0) {
    //         dtm.moduleGuid = mod[0].moduleGuid;
    //         console.log('DocService::createDocType()/07')
    //         dtm.docGuid = this.b.getGuid();
    //         dtm.docTypeController = c;
    //         dtm.docTypeAction = a;
    //         dtm.docTypeEnabled = true;
    //         dtm.enableNotification = true;
    //         console.log('DocService::createDocType()/08')
    //         const ret = await docTypeRepository.save(await dtm);
    //         console.log('DocService::createDocType()/09')
    //         console.log('createDocType()/ret:', await ret)
    //         return await ret;
    //     } else {
    //         console.log('BaseService::createDocType()/10')
    //         this.i = {
    //             messages: this.b.err,
    //             code: 'DocService:createDocType',
    //             app_msg: 'unregistered module prohibited'
    //         };
    //         await this.b.serviceErr(req, res, this.i.app_msg, this.i.code)
    //     }

    // }

    // async getDocTypeByName(req, res, docTypeName: string): Promise<DocTypeModel[]> {
    //     const serviceInput = {
    //         serviceInstance: this,
    //         serviceModel: DocTypeModel,
    //         docName: 'DocService::getDocTypeByName',
    //         cmd: {
    //             action: 'find',
    //             query: { where: { docTypeName: `${docTypeName}` } }
    //         },
    //         dSource: 1
    //     }
    //     return await this.b.read(req, res, serviceInput)
    // }

    // async getCompanyId(req) {
    //     return 1;
    // }

    // async docTypeExists(req, res, docTypeName: string): Promise<boolean> {
    //     let ret = false;
    //     const result = await this.getDocTypeByName(req, res, docTypeName)
    //     if (result.length > 0) {
    //         ret = true;
    //     }
    //     return ret;
    // }

    // // /**
    // //  * {
    // //         "ctx": "Sys",
    // //         "m": "Moduleman",
    // //         "c": "Module",
    // //         "a": "Get",
    // //         "dat": {
    // //             "f_vals": [
    // //                 {
    // //                     "filter": {
    // //                         "select":["moduleId","moduleGuid"],
    // //                         "where": { "moduleId":98}
    // //                         }
    // //                 }
    // //             ],
    // //             "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
    // //         },
    // //         "args": null
    // //     }
    // //  * @param req
    // //  * @param res
    // //  */
    // getDoc(req: Request, res: Response) {
    //     const f = this.b.getQuery(req);
    //     const serviceInput = {
    //         serviceModel: ModuleViewModel,
    //         docName: 'MenuService::getModuleMenu$',
    //         cmd: {
    //             action: 'find',
    //             query: f
    //         },
    //         dSource: 1
    //     }
    //     this.b.read$(req, res, serviceInput)
    //         .subscribe((r: any) => {
    //             this.i.code = 'ModulesController::Get';
    //             const svSess = new SessionService();
    //             svSess.sessResp.cd_token = (req as any).post.dat.token;
    //             svSess.sessResp.ttl = svSess.getTtl();
    //             this.b.setAppState(true, this.i, svSess.sessResp);
    //             this.b.cdResp.data = r;
    //             this.b.respond(req, res)
    //         })
    // }

    // getDocCount(req: Request, res: Response) {
    //     const q = this.b.getQuery(req);
    //     const serviceInput = {
    //         serviceModel: ModuleViewModel,
    //         docName: 'MenuService::getModuleCount$',
    //         cmd: {
    //             action: 'find',
    //             query: q
    //         },
    //         dSource: 1
    //     }
    //     this.b.readCount$(req, res, serviceInput)
    //         .subscribe((r: any) => {
    //             this.i.code = 'ModulesController::Get';
    //             const svSess = new SessionService();
    //             svSess.sessResp.cd_token = (req as any).post.dat.token;
    //             svSess.sessResp.ttl = svSess.getTtl();
    //             this.b.setAppState(true, this.i, svSess.sessResp);
    //             this.b.cdResp.data = r;
    //             this.b.respond(req, res)
    //         })
    // }

    /**
     * Use BaseService for simple search
     * @param req
     * @param res
     */
    async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        return await this.b.read(req, res, serviceInput);
    }

    // remove(req: Request, res: Response): Promise<void> {
    //     return null;
    // }

    async update(req: Request, res: Response) {
        const serviceInput = {
            serviceModel: CdPushSocketModel,
            docName: 'JwtService::update',
            cmd: {
                action: 'update',
                query: (req as any).post.dat.f_vals[0].query
            },
            dSource: 1
        }

        this.b.update$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.respond(req, res)
            })
    }

    async delete(req: Request, res: Response) {
        const serviceInput = {
            serviceModel: ModuleModel,
            docName: 'ModuleService::delete',
            cmd: {
                action: 'delete',
                query: (req as any).post.dat.f_vals[0].query
            },
            dSource: 1
        }

        this.b.delete$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.respond(req, res)
            })
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    // Check request credentials, and create a JWT if there is a match.
    async fetchUserToken(req: Request, res: Response): Promise<JWT> {
        if (this.validateClient(req, res)) {
            return {
                jwtToken: await this.aquireJwt(req, res),
                checked: false,
                checkTime: 0,
                authorized: false,
            }
        } else {
            return {
                jwtToken: '',
                checked: false,
                checkTime: 0,
                authorized: false,
            }
        }
    }

    /**
     * Eventually this will query db
     * @param {*} payLoad
     * @returns
     */
    validateClient(req: Request, res: Response) {
        // console.log('validateClient()/payLoad:', pl);
        // return cdPushClients.filter((c) => c.resourceGuid === payLoad.resourceGuid && c.resourceName === payLoad.resourceName).length > 0;
        return true;
    }


    async aquireJwt(req: Request, res: Response) {
        console.log('JwtService::aquireJwt()/01');
        const pl: any = this.b.getPlData(req);
        console.log('aquireJwt()/pl:', pl);
        const newToken = jwt.sign({
            'sub': pl.resourceGuid,
            'username': pl.resourceName
        },
            jwtSecret,
            /**
             * Expire the token after 15 minutes
             * This value can be supplied from the app_state.sess
             */
            {
                expiresIn: 900
            }
        );
        /**
         * update saved data with token so future connecton can fetch data using token
         */
        // cdPushClients.forEach((c) => {
        //     if (c.resourceGuid === pl.resourceGuid && c.resourceName === pl.resourceName) {
        //         c.jwtToken = newToken;
        //         console.log('cdPushClients item:', c);
        //     }
        // })
        console.log('JwtService::aquireJwt()/newToken:', newToken);
        await this.setJwt(req, res, newToken);
        return newToken;
    }

    async setJwt(req: Request, res: Response, newToken: string) {
        const pl: any = await this.b.getPlData(req);
        console.log('JwtService::setJwt()/pl:', pl);
        pl.jwtToken = newToken;
        const q = {
            update: pl,
            where: {
                resourceGuid: pl.resourceGuid
            }
        }
        const serviceInput = {
            serviceModel: CdPushSocketModel,
            docName: 'JwtService::update',
            cmd: {
                action: 'update',
                query: q,
            },
            dSource: 1
        }

        const ret = await this.b.update(req, res, serviceInput)
        console.log('JwtService::setJwt()/update ret:', ret);
    }

    getState(s: boolean, m: string) {
        return {
            success: s,
            msg: m
        }
    }

    validRegister(req: Request) {
        /**
         * avoide double entry
         * removed expired entries
         * set returnable state
         */
        return true;
    }

    clientHasSocket(userId: string, pushGuid: string) {
        console.log('clientHasSocket()/01')
        console.log('clientHasSocket()/socketsStore:', socketsStore)
        console.log('clientHasSocket()/userId:', userId)
        console.log('clientHasSocket()/pushGuid:', pushGuid)
        return socketsStore.filter((s: any) => s.userId === userId && s.pushGuid === pushGuid).length > 0;
    }

    // get destination socket based on the selected cdObjId;
    async destinationSocket(cdObj: CdObjModel, cdPushClients: any[]) {
        console.log('destinationSocket()/cdObjId:', cdObj)
        console.log('destinationSocket()/cdPushClients:', cdPushClients)
        const socketArr = cdPushClients.filter(c => c.resourceGuid === cdObj.cdObjGuid).map(c => c.socket);
        console.log('destinationSocket()/socketArr:', socketArr)
        if (socketArr.length > 0) {
            console.log('destinationSocket()/returning socket...')
            return socketArr[0];
        } else {
            return false;
        }
    }

    saveSocket(uid: string, pGuid: string, ws: any) {
        console.log('saveSocket()/saving the socket')
        console.log('saveSocket()/socketsStore:', socketsStore)
        console.log('saveSocket()/pGuid:', pGuid)
        if (!this.clientHasSocket(uid, pGuid)) {
            const socketData = {
                socket: ws,
                userId: uid,
                pushGuid: pGuid
            }
            socketsStore.push(socketData);
        } else {
            console.log('client socket exists!')
        }
    }

    resetSocket(uid: string, pGuid: string, ws: any) {
        console.log('resetSocket()/resetting the socket')
        console.log('resetSocket()/socketsStore:', socketsStore)
        console.log('resetSocket()/pGuid:', pGuid)
        if (this.clientHasSocket(uid, pGuid)) {
            console.log('socket exists')
            socketsStore.forEach((s: any, i: any) => {
                if (s.userId === uid && s.pushGuid === pGuid) {
                    console.log('about to remove the socket')
                    s.socket.close();
                    console.log('closed the socket')
                    socketsStore.splice(i, 1);
                    console.log('socket removed')
                }
            });
            const socketData = {
                socket: ws,
                userId: uid,
                pushGuid: pGuid
            }
            console.log('saving new socket')
            socketsStore.push(socketData);
        }
    }


}