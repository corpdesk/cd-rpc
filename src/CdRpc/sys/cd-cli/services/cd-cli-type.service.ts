import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdService } from '../../base/cd.service';
import { SessionService } from '../../user/services/session.service';
import { UserService } from '../../user/services/user.service';
import { IExtServiceInput, IQuery, IRespInfo, IServiceInput, IUser, ICdRequest } from '../../base/i-base';
import { CdCliTypeModel } from '../models/cd-cli-type.model';
// import { CdCliViewModel, siGet } from '../models/cdCli-view.model';
// import { CdCliStatViewModel } from '../models/cdCli-stat-view.model';
import { siGet } from '../../base/base.model';
import { Logging } from '../../base/winston.log';
import { CdCliViewModel } from '../models/cd-cli-view.model';
import { GenericService } from "../../base/generic-service";



// export class CdCliTypeService extends CdService {
export class CdCliTypeService extends GenericService<CdCliTypeModel> {
    logger: Logging;
    b: any; // instance of BaseService
    cdToken: string;
    srvSess: SessionService;
    srvUser: UserService;
    user: IUser;
    serviceModel: CdCliTypeModel;
    modelName: "CdCliTypeModel";
    sessModel;
    // moduleModel: ModuleModel;

    /*
     * create rules
     */
    cRules: any = {
        required: ['cdCliTypeName'],
        noDuplicate: ['cdCliTypeName']
    };
    uRules: any[];
    dRules: any[];

    constructor() {
        super()
        this.b = new BaseService();
        this.logger = new Logging();
        this.serviceModel = new CdCliTypeModel();
    }

     /**
     * {
        "ctx": "App",
        "m": "CdClis",
        "c": "CdCli",
        "a": "Create",
        "dat": {
            "f_vals": [
            {
                "data": {
                    "cdCliStatGuid":"",
                    "cdCliStatName": "Benin", 
                    "cdCliStatDescription":"2005",
                    "cdGeoLocationId":null,
                    "cdCliWoccu": false,
                    "cdCliCount": null,
                    "cdCliMembersCount": 881232, 
                    "cdCliSavesShares":56429394,
                    "cdCliLoans":45011150,
                    "cdCliReserves":null, 
                    "cdCliAssets": null,
                    "cdCliMemberPenetration":20.95,
                    "cdCliStatDateLabel": "2005-12-31 23:59:59",
                    "cdCliStatRefId":null
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
        this.logger.logInfo('CdCliTypecreate::validateCreate()/01')
        
        const svSess = new SessionService();
        if (await this.validateCreate(req, res)) {
            await this.beforeCreate(req, res);
            const serviceInput = {
                serviceModel: CdCliTypeModel,
                modelName: "CdCliTypeModel",
                serviceModelInstance: this.serviceModel,
                docName: 'Create CdCli',
                dSource: 1,
            }
            this.logger.logInfo('CdCliTypeService::create()/serviceInput:', serviceInput)
            const respData = await this.b.create(req, res, serviceInput);
            this.b.i.app_msg = 'new CdCli created';
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = await respData;
            const r = await this.b.respond(req, res);
        } else {
            this.logger.logInfo('CdCliTypecreate::validateCreate()/02')
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
                serviceModel: CdCliTypeModel,
                serviceModelInstance: this.serviceModel,
                docName: 'Create CdCli',
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

    async createI(req, res, serviceInputExt: IExtServiceInput<any>): Promise<CdCliTypeModel | boolean> {
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
        "m": "CdClis",
        "c": "CdCli",
        "a": "CreateM",
        "dat": {
            "f_vals": [
            {
                "data": [
                {
                    "cdCliStatGuid": "",
                    "cdCliStatName": "Kenya",
                    "cdCliStatDescription": "2006",
                    "cdGeoLocationId": null,
                    "cdCliWoccu": false,
                    "cdCliCount": 2993,
                    "cdCliMembersCount": 3265545,
                    "cdCliSavesShares": 1608009012,
                    "cdCliLoans": 1604043550,
                    "cdCliReserves": 102792479,
                    "cdCliAssets": 2146769999,
                    "cdCliMemberPenetration": 16.01,
                    "cdCliStatDateLabel": "2006-12-31 23:59:59",
                    "cdCliStatRefId": null
                },
                {
                    "cdCliStatGuid": "",
                    "cdCliStatName": "Malawi",
                    "cdCliStatDescription": "2006",
                    "cdGeoLocationId": null,
                    "cdCliWoccu": false,
                    "cdCliCount": 70,
                    "cdCliMembersCount": 62736,
                    "cdCliSavesShares": 6175626,
                    "cdCliLoans": 4946246,
                    "cdCliReserves": 601936,
                    "cdCliAssets": 7407250,
                    "cdCliMemberPenetration": 0.9,
                    "cdCliStatDateLabel": "2006-12-31 23:59:59",
                    "cdCliStatRefId": null
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
        this.logger.logInfo('CdCliTypeService::createM()/01')
        let data = (req as any).post.dat.f_vals[0].data
        this.logger.logInfo('CdCliTypeService::createM()/data:', data)
        // this.b.models.push(CdCliTypeModel)
        // this.b.init(req, res)

        for (var cdCliData of data) {
            this.logger.logInfo('cdCliData', cdCliData)
            const cdCliQuery: CdCliTypeModel = cdCliData;
            const svCdCli = new CdCliTypeService();
            const si = {
                serviceInstance: svCdCli,
                serviceModel: CdCliTypeModel,
                serviceModelInstance: svCdCli.serviceModel,
                docName: 'CdCliTypeService::CreateM',
                dSource: 1,
            }
            const serviceInputExt: IExtServiceInput<any> = {
                serviceInput: si,
                entityData: cdCliQuery
            }
            let ret = await this.createI(req, res, serviceInputExt)
            this.logger.logInfo('CdCliTypeService::createM()/forLoop/ret:', {ret: ret})
        }
        // return current sample data
        // eg first 5
        // this is just a sample for development
        // producation can be tailored to requrement 
        // and the query can be set from the client side.
        let q = {
            // "select": [
            //     "cdCliStatName",
            //     "cdCliStatDescription"
            // ],
            "where": {},
            "take": 5,
            "skip": 0
        }
        this.getCdCli(req, res,q)
    }

    async CdCliExists(req: Request, res: Response, q: IQuery): Promise<boolean> {
        const serviceInput: IServiceInput<any> = {
            serviceInstance: this,
            serviceModel: CdCliTypeModel,
            docName: 'CdCliTypeService::CdCliExists',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1,
        }
        return this.b.read(req, res, serviceInput)
    }

    async beforeCreate(req: Request, res: Response): Promise<any> {
        this.b.setPlData(req, { key: 'cdCliTypeGuid', value: this.b.getGuid() });
        this.b.setPlData(req, { key: 'cdCliTypeEnabled', value: true });
        return true;
    }

    async beforeCreateSL(req: Request, res: Response): Promise<any> {
        this.b.setPlData(req, { key: 'cdCliStatGuid', value: this.b.getGuid() });
        this.b.setPlData(req, { key: 'cdCliStatEnabled', value: true });
        return true;
    }

    async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        // const serviceInput: IServiceInput<any> = {
        //     serviceInstance: this,
        //     serviceModel: CdCliTypeModel,
        //     docName: 'CdCliTypeService::CdCliExists',
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
        this.logger.logInfo('CdCliTypeService::getCdCliTypeq:', q);
        try {
            this.b.readSL$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // this.logger.logInfo('CdCliTypeService::read$()/r:', r)
                    this.b.i.code = 'CdCliTypeService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.connSLClose()
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            this.logger.logInfo('CdCliTypeService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'CdCliTypeService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    update(req: Request, res: Response) {
        // this.logger.logInfo('CdCliTypeService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliTypeService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        // this.logger.logInfo('CdCliTypeService::update()/02')
        this.b.update$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.respond(req, res)
            })
    }

    updateSL(req: Request, res: Response) {
        this.logger.logInfo('CdCliTypeService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdateSL(q);
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliTypeService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        this.logger.logInfo('CdCliTypeService::update()/02')
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
        if (q.update.CdCliEnabled === '') {
            q.update.CdCliEnabled = null;
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
        this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/01')
        const svSess = new SessionService();
        ///////////////////////////////////////////////////////////////////
        // 1. Validate against duplication
        const params = {
            controllerInstance: this,
            model: CdCliTypeModel,
        }
        this.b.i.code = 'CdCliTypeService::validateCreate';
        let ret = false;
        if (await this.b.validateUnique(req, res, params)) {
            this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/02')
            if (await this.b.validateRequired(req, res, this.cRules)) {
                this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/03')
                ret = true;
            } else {
                this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/04')
                ret = false;
                this.b.i.app_msg = `the required fields ${this.b.isInvalidFields.join(', ')} is missing`;
                this.b.err.push(this.b.i.app_msg);
                this.b.setAppState(false, this.b.i, svSess.sessResp);
            }
        } else {
            this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/05')
            ret = false;
            this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(', ')} is not allowed`;
            this.b.err.push(this.b.i.app_msg);
            this.b.setAppState(false, this.b.i, svSess.sessResp);
        }
        this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/06')
        ///////////////////////////////////////////////////////////////////
        // 2. confirm the cdCliTypeId referenced exists
        // const pl: CdCliTypeModel = this.b.getPlData(req);
        // if ('cdCliTypeId' in pl) {
        //     this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/07')
        //     this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/pl:', pl)
        //     const serviceInput = {
        //         serviceModel: CdCliTypeModel,
        //         docName: 'CdCliTypeService::validateCreate',
        //         cmd: {
        //             action: 'find',
        //             query: { where: { cdCliTypeId: pl.cdCliTypeId } }
        //         },
        //         dSource: 1
        //     }
        //     this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/serviceInput:', JSON.stringify(serviceInput))
        //     const r: any = await this.b.read(req, res, serviceInput)
        //     this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/r:', r)
        //     if (r.length > 0) {
        //         this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/08')
        //         ret = true;
        //     } else {
        //         this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/10')
        //         ret = false;
        //         this.b.i.app_msg = `CdCli type reference is invalid`;
        //         this.b.err.push(this.b.i.app_msg);
        //         this.b.setAppState(false, this.b.i, svSess.sessResp);
        //     }
        // } else {
        //     this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/11')
        //     // this.b.i.app_msg = `parentModuleGuid is missing in payload`;
        //     // this.b.err.push(this.b.i.app_msg);
        //     //////////////////
        //     this.b.i.app_msg = `cdCliTypeId is missing in payload`;
        //     this.b.err.push(this.b.i.app_msg);
        //     this.b.setAppState(false, this.b.i, svSess.sessResp);
        // }
        this.logger.logInfo('CdCliTypeService::getCdCliType12');
        if (this.b.err.length > 0) {
            this.logger.logInfo('CdCliTypeCdCliTypeService::validateCreate()/13')
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
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App", "m": "CdClis","c": "CdCli","a": "Get","dat": {"f_vals": [{"query": {"where": {"cdCliStatName": "Kenya"}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     * @param q 
     */
    async getCdCli(req: Request, res: Response, q?: IQuery): Promise<any> {
        if (q === null) {
            q = this.b.getQuery(req);
        }
        this.logger.logInfo('CdCliTypeService::getCdCliTypef:', q);
        const serviceInput = siGet(q,this)
        try {
            const r = await this.b.read(req, res, serviceInput)
            this.b.successResponse(req, res, r)
        } catch (e: any) {
            this.logger.logInfo('CdCliTypeService::read$()/e:', e)
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

    async getCdCliSL(req: Request, res: Response) {
        await this.b.initSqlite(req, res)
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdCliTypeService::getCdCliTypeq:', q);
        const serviceInput = siGet(q,this)
        try {
            this.b.readSL$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // this.logger.logInfo('CdCliTypeService::read$()/r:', r)
                    this.b.i.code = 'CdCliTypeService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.connSLClose()
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            this.logger.logInfo('CdCliTypeService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'CdCliTypeService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    /**
     * 
     * curl test:
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App","m": "CdClis","c": "CdCli","a": "GetType","dat":{"f_vals": [{"query":{"where": {"cdCliTypeId":100}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     */
    getCdCliType(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdCliTypeService::getCdCliTypef:', q);
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliTypeService::getCdCliType$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // this.logger.logInfo('CdCliTypeService::read$()/r:', r)
                    this.b.i.code = 'CdCliController::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            this.logger.logInfo('CdCliTypeService::read$()/e:', e)
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
    getCdCliCount(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdCliTypeService::getCdCliCount/q:', q);
        const serviceInput = {
            serviceModel: CdCliViewModel,
            docName: 'CdCliTypeService::getCdCliCount$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'CdCliController::Get';
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
        this.logger.logInfo('CdCliTypeService::getCdCliCount()/q:', q);
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliTypeService::getCdCliCount',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCountSL$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'CdCliTypeService::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.connSLClose()
                this.b.respond(req, res)
            })
    }

    getCdCliTypeCount(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdCliTypeService::getCdCliCount/q:', q);
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliTypeService::getCdCliCount$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'CdCliController::Get';
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
        this.logger.logInfo('CdCliTypeService::delete()/q:', q)
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliTypeService::delete',
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
        this.logger.logInfo('CdCliTypeService::deleteSL()/q:', q)
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliTypeService::deleteSL',
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