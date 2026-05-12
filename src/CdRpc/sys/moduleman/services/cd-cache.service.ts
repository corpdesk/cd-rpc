import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdService } from '../../base/cd.service';
import { SessionService } from '../../user/services/session.service';
import { UserService } from '../../user/services/user.service';
import { IExtServiceInput, IQuery, IRespInfo, IServiceInput, IUser } from '../../base/i-base';
import { CdCacheModel } from '../models/cd-cache.model';
import { GenericController } from "../../base/generic-controller";
import { GenericService } from "../../base/generic-service";
import { SessionModel } from "../../user/models/session.model";

// export class CdCacheService extends CdService {
export class CdCacheService extends GenericService<CdCacheModel> {
    b: any; // instance of BaseService
    cdToken!: string;
    srvSess!: SessionService;
    srvUser!: UserService;
    user!: IUser;
    serviceModel = CdCacheModel;
    docName: string = 'CdCache';
    sessModel!: SessionModel;
    // moduleModel: ModuleModel;

    /*
     * create rules
     */
    cRules: any = {
        required: ['key', 'value'],
        noDuplicate: []
    };
    uRules: any[] = [];
    dRules: any[] = [];

    constructor() {
        super(CdCacheModel);
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "CdCache",
    //         "a": "Create",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "data": {
    //                         "cdCacheName": "/src/CdApi/sys/moduleman",
    //                         "cdCacheTypeGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
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
    async create(req: Request, res: Response) {
        console.log('moduleman/create::validateCreate()/01')
        const svSess = new SessionService();
        if (await this.validateCreate(req, res)) {
            await this.beforeCreate(req, res);
            // const serviceInput = {
            //     serviceModel: CdCacheModel,
            //     serviceModelInstance: this.serviceModel,
            //     docName: 'Create cdCache',
            //     dSource: 1,
            // }
            // console.log('CdCacheService::create()/serviceInput:', serviceInput)
            const respData = await this.b.redisCreate(req, res);
            this.b.i.app_msg = 'new cdCache created';
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = await respData;
            const r = await this.b.respond(req, res);
        } else {
            console.log('moduleman/create::validateCreate()/02')
            const r = await this.b.respond(req, res);
        }
    }

    async createI(req: Request, res: Response, serviceInputExt: IExtServiceInput<any>): Promise<CdCacheModel | boolean> {
        return await this.b.createI(req, res, serviceInputExt)
    }

    async cdCacheExists(req: Request, res: Response, q: IQuery): Promise<boolean> {
        const serviceInput: IServiceInput<any> = {
            serviceInstance: this,
            serviceModel: CdCacheModel,
            docName: 'CdCacheService::cdCacheExists',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1,
        }
        return this.b.read(req, res, serviceInput)
    }

    async beforeCreate(req: Request, res: Response): Promise<any> {
        return true;
    }

    async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        //
    }

    async update(req: Request, res: Response) {
        // console.log('CdCacheService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: CdCacheModel,
            docName: 'CdCacheService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        // console.log('CdCacheService::update()/02')
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
        if (q.update.cdCacheEnabled === '') {
            q.update.cdCacheEnabled = null;
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
        // to implement
        return true;
    }

    async get(req: Request, res: Response) {
        console.log('moduleman/read::validateCreate()/01')
        const svSess = new SessionService();
        if (await this.validateRead(req, res)) {
            const respData = await this.b.redisRead(req, res);
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = await respData;
            const r = await this.b.respond(req, res);
        } else {
            console.log('moduleman/create::validateRead()/02')
            const r = await this.b.respond(req, res);
        }
    }

    validateRead(req: Request, res: Response){
        return true;
    }

    getCdCacheCount(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('CdCacheService::getCdCacheCount/q:', q);
        const serviceInput = {
            // serviceModel: CdCacheViewModel,
            docName: 'CdCacheService::getCdCacheCount$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'CdCacheController::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.respond(req, res)
            })
    }



    async delete(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('CdCacheService::delete()/q:', q)
        const serviceInput = {
            serviceModel: CdCacheModel,
            docName: 'CdCacheService::delete',
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