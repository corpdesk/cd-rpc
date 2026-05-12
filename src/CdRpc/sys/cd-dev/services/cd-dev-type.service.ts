import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdService } from '../../base/cd.service';
import { SessionService } from '../../user/services/session.service';
import { UserService } from '../../user/services/user.service';
import { IExtServiceInput, IQuery, IRespInfo, IServiceInput, IUser, ICdRequest } from '../../base/i-base';
import { CdDevTypeModel } from '../models/cd-dev-type.model';
// import { CdDevViewModel, siGet } from '../models/cdDev-view.model';
// import { CdDevStatViewModel } from '../models/cdDev-stat-view.model';
import { siGet } from '../../base/base.model';
import { Logging } from '../../base/winston.log';
import { CdDevViewModel } from '../models/cd-dev-view.model';



export class CdDevTypeService extends CdService {
    logger: Logging;
    b: any; // instance of BaseService
    cdToken: string;
    srvSess: SessionService;
    srvUser: UserService;
    user: IUser;
    serviceModel: CdDevTypeModel;
    modelName: "CdDevTypeModel";
    sessModel;
    // moduleModel: ModuleModel;

    /*
     * create rules
     */
    cRules: any = {
        required: ['cdDevTypeName'],
        noDuplicate: ['cdDevTypeName']
    };
    uRules: any[];
    dRules: any[];

    constructor() {
        super()
        this.b = new BaseService();
        this.logger = new Logging();
        this.serviceModel = new CdDevTypeModel();
    }

     /**
     * {
        "ctx": "App",
        "m": "CdDevs",
        "c": "CdDev",
        "a": "Create",
        "dat": {
            "f_vals": [
            {
                "data": {
                    "cdDevStatGuid":"",
                    "cdDevStatName": "Benin", 
                    "cdDevStatDescription":"2005",
                    "cdGeoLocationId":null,
                    "cdDevWoccu": false,
                    "cdDevCount": null,
                    "cdDevMembersCount": 881232, 
                    "cdDevSavesShares":56429394,
                    "cdDevLoans":45011150,
                    "cdDevReserves":null, 
                    "cdDevAssets": null,
                    "cdDevMemberPenetration":20.95,
                    "cdDevStatDateLabel": "2005-12-31 23:59:59",
                    "cdDevStatRefId":null
	            }
            }
            ],
            "token": "3ffd785f-e885-4d37-addf-0e24379af338"
        },
        "args": {}
        }
     * @param req
     * @param res
     */
    async create(req: Request, res: Response) {
        this.logger.logInfo('CdDevTypecreate::validateCreate()/01')
        
        const svSess = new SessionService();
        if (await this.validateCreate(req, res)) {
            await this.beforeCreate(req, res);
            const serviceInput = {
                serviceModel: CdDevTypeModel,
                modelName: "CdDevTypeModel",
                serviceModelInstance: this.serviceModel,
                docName: 'Create CdDev',
                dSource: 1,
            }
            this.logger.logInfo('CdDevTypeService::create()/serviceInput:', serviceInput)
            const respData = await this.b.create(req, res, serviceInput);
            this.b.i.app_msg = 'new CdDev created';
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = await respData;
            const r = await this.b.respond(req, res);
        } else {
            this.logger.logInfo('CdDevTypecreate::validateCreate()/02')
            const r = await this.b.respond(req, res);
        }
    }

    async createSL(req: Request, res: Response) {
        const svSess = new SessionService();
        await this.b.initSqlite(req, res)
        if (await this.validateCreateSL(req, res)) {
            await this.beforeCreateSL(req, res);
            const serviceInput = {
                serviceInstance: this,
                serviceModel: CdDevTypeModel,
                serviceModelInstance: this.serviceModel,
                docName: 'Create CdDev',
                dSource: 1,
            }
            const result = await this.b.createSL(req, res, serviceInput)
            this.b.connSLClose()
            this.b.i.app_msg = '';
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = result;
            const r = await this.b.respond(req, res);
        } else {
            const r = await this.b.respond(req, res);
        }
    }

    async createI(req, res, serviceInputExt: IExtServiceInput<any>): Promise<CdDevTypeModel | boolean> {
        return await this.b.createI(req, res, serviceInputExt)
    }

    /**
     * CreateM, Create multiple records
     *  - 1. validate the loop field for multiple data
     *  - 2. loop through the list
     *  - 3. in each cycle:
     *      - get createItem
     *      - createI(createItem)
     *      - save return value
     *  - 4. set return data
     *  - 5. return data
     * 
     * {
        "ctx": "App",
        "m": "CdDevs",
        "c": "CdDev",
        "a": "CreateM",
        "dat": {
            "f_vals": [
            {
                "data": [
                {
                    "cdDevStatGuid": "",
                    "cdDevStatName": "Kenya",
                    "cdDevStatDescription": "2006",
                    "cdGeoLocationId": null,
                    "cdDevWoccu": false,
                    "cdDevCount": 2993,
                    "cdDevMembersCount": 3265545,
                    "cdDevSavesShares": 1608009012,
                    "cdDevLoans": 1604043550,
                    "cdDevReserves": 102792479,
                    "cdDevAssets": 2146769999,
                    "cdDevMemberPenetration": 16.01,
                    "cdDevStatDateLabel": "2006-12-31 23:59:59",
                    "cdDevStatRefId": null
                },
                {
                    "cdDevStatGuid": "",
                    "cdDevStatName": "Malawi",
                    "cdDevStatDescription": "2006",
                    "cdGeoLocationId": null,
                    "cdDevWoccu": false,
                    "cdDevCount": 70,
                    "cdDevMembersCount": 62736,
                    "cdDevSavesShares": 6175626,
                    "cdDevLoans": 4946246,
                    "cdDevReserves": 601936,
                    "cdDevAssets": 7407250,
                    "cdDevMemberPenetration": 0.9,
                    "cdDevStatDateLabel": "2006-12-31 23:59:59",
                    "cdDevStatRefId": null
                }
                ]
            }
            ],
            "token": "3ffd785f-e885-4d37-addf-0e24379af338"
        },
        "args": {}
        }
     * 
     * 
     * @param req 
     * @param res 
     */
    async createM(req: Request, res: Response) {
        this.logger.logInfo('CdDevTypeService::createM()/01')
        let data = (req as any).post.dat.f_vals[0].data
        this.logger.logInfo('CdDevTypeService::createM()/data:', data)
        // this.b.models.push(CdDevTypeModel)
        // this.b.init(req, res)

        for (var cdDevData of data) {
            this.logger.logInfo('cdDevData', cdDevData)
            const cdDevQuery: CdDevTypeModel = cdDevData;
            const svCdDev = new CdDevTypeService();
            const si = {
                serviceInstance: svCdDev,
                serviceModel: CdDevTypeModel,
                serviceModelInstance: svCdDev.serviceModel,
                docName: 'CdDevTypeService::CreateM',
                dSource: 1,
            }
            const serviceInputExt: IExtServiceInput<any> = {
                serviceInput: si,
                entityData: cdDevQuery
            }
            let ret = await this.createI(req, res, serviceInputExt)
            this.logger.logInfo('CdDevTypeService::createM()/forLoop/ret:', {ret: ret})
        }
        // return current sample data
        // eg first 5
        // this is just a sample for development
        // producation can be tailored to requrement 
        // and the query can be set from the client side.
        let q = {
            // "select": [
            //     "cdDevStatName",
            //     "cdDevStatDescription"
            // ],
            "where": {},
            "take": 5,
            "skip": 0
        }
        this.getCdDev(req, res,q)
    }

    async CdDevExists(req: Request, res: Response, q: IQuery): Promise<boolean> {
        const serviceInput: IServiceInput<any> = {
            serviceInstance: this,
            serviceModel: CdDevTypeModel,
            docName: 'CdDevTypeService::CdDevExists',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1,
        }
        return this.b.read(req, res, serviceInput)
    }

    async beforeCreate(req: Request, res: Response): Promise<any> {
        this.b.setPlData(req, { key: 'cdDevTypeGuid', value: this.b.getGuid() });
        this.b.setPlData(req, { key: 'cdDevTypeEnabled', value: true });
        return true;
    }

    async beforeCreateSL(req: Request, res: Response): Promise<any> {
        this.b.setPlData(req, { key: 'cdDevStatGuid', value: this.b.getGuid() });
        this.b.setPlData(req, { key: 'cdDevStatEnabled', value: true });
        return true;
    }

    async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        // const serviceInput: IServiceInput<any> = {
        //     serviceInstance: this,
        //     serviceModel: CdDevTypeModel,
        //     docName: 'CdDevTypeService::CdDevExists',
        //     cmd: {
        //         action: 'find',
        //         query: q
        //     },
        //     dSource: 1,
        // }
        return this.b.read(req, res, serviceInput)
    }

    async readSL(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        await this.b.initSqlite(req, res)
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdDevTypeService::getCdDevTypeq:', q);
        try {
            this.b.readSL$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // this.logger.logInfo('CdDevTypeService::read$()/r:', r)
                    this.b.i.code = 'CdDevTypeService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.connSLClose()
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            this.logger.logInfo('CdDevTypeService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'CdDevTypeService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    update(req: Request, res: Response) {
        // this.logger.logInfo('CdDevTypeService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: CdDevTypeModel,
            docName: 'CdDevTypeService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        // this.logger.logInfo('CdDevTypeService::update()/02')
        this.b.update$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.respond(req, res)
            })
    }

    updateSL(req: Request, res: Response) {
        this.logger.logInfo('CdDevTypeService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdateSL(q);
        const serviceInput = {
            serviceModel: CdDevTypeModel,
            docName: 'CdDevTypeService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        this.logger.logInfo('CdDevTypeService::update()/02')
        this.b.updateSL$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.connSLClose()
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
        if (q.update.CdDevEnabled === '') {
            q.update.CdDevEnabled = null;
        }
        return q;
    }

    beforeUpdateSL(q: any) {
        if (q.update.billEnabled === '') {
            q.update.billEnabled = null;
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
        this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/01')
        const svSess = new SessionService();
        ///////////////////////////////////////////////////////////////////
        // 1. Validate against duplication
        const params = {
            controllerInstance: this,
            model: CdDevTypeModel,
        }
        this.b.i.code = 'CdDevTypeService::validateCreate';
        let ret = false;
        if (await this.b.validateUnique(req, res, params)) {
            this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/02')
            if (await this.b.validateRequired(req, res, this.cRules)) {
                this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/03')
                ret = true;
            } else {
                this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/04')
                ret = false;
                this.b.i.app_msg = `the required fields ${this.b.isInvalidFields.join(', ')} is missing`;
                this.b.err.push(this.b.i.app_msg);
                this.b.setAppState(false, this.b.i, svSess.sessResp);
            }
        } else {
            this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/05')
            ret = false;
            this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(', ')} is not allowed`;
            this.b.err.push(this.b.i.app_msg);
            this.b.setAppState(false, this.b.i, svSess.sessResp);
        }
        this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/06')
        ///////////////////////////////////////////////////////////////////
        // 2. confirm the cdDevTypeId referenced exists
        // const pl: CdDevTypeModel = this.b.getPlData(req);
        // if ('cdDevTypeId' in pl) {
        //     this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/07')
        //     this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/pl:', pl)
        //     const serviceInput = {
        //         serviceModel: CdDevTypeModel,
        //         docName: 'CdDevTypeService::validateCreate',
        //         cmd: {
        //             action: 'find',
        //             query: { where: { cdDevTypeId: pl.cdDevTypeId } }
        //         },
        //         dSource: 1
        //     }
        //     this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/serviceInput:', JSON.stringify(serviceInput))
        //     const r: any = await this.b.read(req, res, serviceInput)
        //     this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/r:', r)
        //     if (r.length > 0) {
        //         this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/08')
        //         ret = true;
        //     } else {
        //         this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/10')
        //         ret = false;
        //         this.b.i.app_msg = `CdDev type reference is invalid`;
        //         this.b.err.push(this.b.i.app_msg);
        //         this.b.setAppState(false, this.b.i, svSess.sessResp);
        //     }
        // } else {
        //     this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/11')
        //     // this.b.i.app_msg = `parentModuleGuid is missing in payload`;
        //     // this.b.err.push(this.b.i.app_msg);
        //     //////////////////
        //     this.b.i.app_msg = `cdDevTypeId is missing in payload`;
        //     this.b.err.push(this.b.i.app_msg);
        //     this.b.setAppState(false, this.b.i, svSess.sessResp);
        // }
        this.logger.logInfo('CdDevTypeService::getCdDevType12');
        if (this.b.err.length > 0) {
            this.logger.logInfo('CdDevTypeCdDevTypeService::validateCreate()/13')
            ret = false;
        }
        return ret;
    }

    async validateCreateSL(req: Request, res: Response) {
        return true;
    }

    /**
     * 
     * curl test:
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App", "m": "CdDevs","c": "CdDev","a": "Get","dat": {"f_vals": [{"query": {"where": {"cdDevStatName": "Kenya"}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     * @param q 
     */
    async getCdDev(req: Request, res: Response, q?: IQuery): Promise<any> {
        if (q === null) {
            q = this.b.getQuery(req);
        }
        this.logger.logInfo('CdDevTypeService::getCdDevTypef:', q);
        const serviceInput = siGet(q,this)
        try {
            const r = await this.b.read(req, res, serviceInput)
            this.b.successResponse(req, res, r)
        } catch (e: any) {
            this.logger.logInfo('CdDevTypeService::read$()/e:', e)
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

    async getCdDevSL(req: Request, res: Response) {
        await this.b.initSqlite(req, res)
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdDevTypeService::getCdDevTypeq:', q);
        const serviceInput = siGet(q,this)
        try {
            this.b.readSL$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // this.logger.logInfo('CdDevTypeService::read$()/r:', r)
                    this.b.i.code = 'CdDevTypeService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.connSLClose()
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            this.logger.logInfo('CdDevTypeService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'CdDevTypeService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    /**
     * 
     * curl test:
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdDevs","c": "CdDev","a": "GetType","dat":{"f_vals": [{"query":{"where": {"cdDevTypeId":100}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     */
    getCdDevType(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdDevTypeService::getCdDevTypef:', q);
        const serviceInput = {
            serviceModel: CdDevTypeModel,
            docName: 'CdDevTypeService::getCdDevType$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // this.logger.logInfo('CdDevTypeService::read$()/r:', r)
                    this.b.i.code = 'CdDevController::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            this.logger.logInfo('CdDevTypeService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'BaseService:update',
                app_msg: ''
            };
            this.b.serviceErr(req, res, e, i.code)
            this.b.respond(req, res)
        }
    }

    /**
     * 
     * @param req 
     * @param res 
     */
    getCdDevCount(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdDevTypeService::getCdDevCount/q:', q);
        const serviceInput = {
            serviceModel: CdDevViewModel,
            docName: 'CdDevTypeService::getCdDevCount$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'CdDevController::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.respond(req, res)
            })
    }

    getPagedSL(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdDevTypeService::getCdDevCount()/q:', q);
        const serviceInput = {
            serviceModel: CdDevTypeModel,
            docName: 'CdDevTypeService::getCdDevCount',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCountSL$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'CdDevTypeService::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.connSLClose()
                this.b.respond(req, res)
            })
    }

    getCdDevTypeCount(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdDevTypeService::getCdDevCount/q:', q);
        const serviceInput = {
            serviceModel: CdDevTypeModel,
            docName: 'CdDevTypeService::getCdDevCount$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'CdDevController::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.respond(req, res)
            })
    }

    delete(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdDevTypeService::delete()/q:', q)
        const serviceInput = {
            serviceModel: CdDevTypeModel,
            docName: 'CdDevTypeService::delete',
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

    deleteSL(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdDevTypeService::deleteSL()/q:', q)
        const serviceInput = {
            serviceModel: CdDevTypeModel,
            docName: 'CdDevTypeService::deleteSL',
            cmd: {
                action: 'delete',
                query: q
            },
            dSource: 1
        }

        this.b.deleteSL$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.respond(req, res)
            })
    }
}