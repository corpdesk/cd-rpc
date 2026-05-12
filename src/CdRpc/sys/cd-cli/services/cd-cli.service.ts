import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdService } from '../../base/cd.service';
import { SessionService } from '../../user/services/session.service';
import { UserService } from '../../user/services/user.service';
import { IExtServiceInput, IQuery, IRespInfo, IServiceInput, IUser, ICdRequest, ISessionDataExt } from '../../base/i-base';
import { CdCliModel } from '../models/cd-cli.model';
// import { CdCliViewModel, siGet } from '../models/cdCli-view.model';
import { CdCliTypeModel } from '../models/cd-cli-type.model';
import { CdCliViewModel } from '../models/cd-cli-view.model';
import { siGet } from '../../base/base.model';
// import { CdGeoLocationService } from '../../cd-geo/services/cd-geo-location.service';
import { Logging } from '../../base/winston.log';
import { CompanyService } from '../../moduleman/services/company.service';
import { CompanyModel } from '../../moduleman/models/company.model';
// import { CdGeoLocationModel } from '../../cd-geo/models/cd-geo-location.model';
import { CdCliProfileModel, ICdCliProfileProfile } from '../models/cd-cli-profile.model';
import { IUserProfile, userProfileDefault } from '../../user/models/user.model';
import { CdCliProfileViewModel } from '../models/cd-cli-profile-view.model';
import { Like, Not } from 'typeorm';
import { QueryTransformer } from '../../utils/query-transformer';
import { GenericService } from "../../base/generic-service";

// export class CdCliService extends CdService {
export class CdCliService extends GenericService<CdCliModel> {
    logger: Logging;
    b: any; // instance of BaseService
    cdToken: string;
    srvSess: SessionService;
    srvUser: UserService;
    user: IUser;
    serviceModel: CdCliModel;
    modelName: "CdCliModel";
    sessModel;
    sessDataExt: ISessionDataExt;
    // moduleModel: ModuleModel;
    arrLikeConditions: any[] = [];
    /*
     * create rules
     */
    cRules: any = {
        required: ['cdCliName', 'cdCliTypeId'],
        noDuplicate: ['cdCliName', 'cdCliTypeId']
    };
    uRules: any[];
    dRules: any[];

    constructor() {
        super()
        this.b = new BaseService();
        this.logger = new Logging();
        this.serviceModel = new CdCliModel();
    }

    async initSession(req: Request, res: Response) {
        const svSess = new SessionService();
        this.sessDataExt = await svSess.getSessionDataExt(req, res);
    }

    /**
     * Create from new company:
     *  - Create company, then create cdCli
     * 
     * Create from existing company
     *  - select company then create cdCli
    * {
       "ctx": "App",
       "m": "CdClis",
       "c": "CdCli",
       "a": "Create",
       "dat": {
           "f_vals": [
           {
               "data": {
                   "cdCliGuid":"",
                   "cdCliName": "Benin", 
                   "cdCliDescription":"2005",
                   "cdGeoLocationId":null,
                   "cdCliWoccu": false,
                   "cdCliCount": null,
                   "cdCliEfgsCount": 881232, 
                   "cdCliSavesShares":56429394,
                   "cdCliLoans":45011150,
                   "cdCliReserves":null, 
                   "cdCliAssets": null,
                   "cdCliEfgPenetration":20.95,
                   "cdCliDateLabel": "2005-12-31 23:59:59",
                   "cdCliRefId":null
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
        this.logger.logInfo('cdCli/create::validateCreate()/01')

        const svSess = new SessionService();
        if (await this.validateCreate(req, res)) {
            await this.beforeCreate(req, res);
            const serviceInput = {
                serviceModel: CdCliModel,
                modelName: "CdCliModel",
                serviceModelInstance: this.serviceModel,
                docName: 'Create CdCli',
                dSource: 1,
            }
            this.logger.logInfo('CdCliService::create()/serviceInput:', serviceInput)
            const respData = await this.b.create(req, res, serviceInput);
            this.b.i.app_msg = 'new CdCli created';
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = await respData;
            const r = await this.b.respond(req, res);
        } else {
            this.logger.logInfo('cdCli/create::validateCreate()/02')
            const r = await this.b.respond(req, res);
        }
    }

    async validateCreate(req: Request, res: Response) {
        this.logger.logInfo('cdCli/CdCliService::validateCreate()/01');
        const svSess = new SessionService();
        // const svCompany = new CompanyService();
        let companyParams;

        // const fValItem = req.body.dat.f_vals[0];
        let pl: CdCliModel = this.b.getPlData(req);
        console.log("CdCliService::validateCreate()/pl:", pl)

        // Validation params for the different checks
        const validationParams = [
            {
                field: 'cdCliTypeId',
                query: { cdCliTypeId: pl.cdCliTypeId },
                model: CdCliTypeModel
            }
        ];

        if ('companyId' in pl) {
            companyParams = {
                field: 'companyId',
                query: { companyId: pl.companyId },
                model: CompanyModel
            }
            validationParams.push(companyParams)
        }

        const valid = await this.validateExistence(req, res, validationParams);

        if (!valid) {
            this.logger.logInfo('cdCli/CdCliService::validateCreate()/Validation failed');
            this.b.setAppState(false, this.b.i, svSess.sessResp);
            return false;
        }

        // Proceed with further CdCli-specific validation or creation logic
        this.logger.logInfo('cdCli/CdCliService::validateCreate()/Validation passed');

        // Other validation logic (e.g., duplicate checks, required field checks, etc.)

        return true;
    }

    async validateExistence(req, res, validationParams) {
        const promises = validationParams.map(param => {
            const serviceInput = {
                serviceModel: param.model,
                docName: `CdCliService::validateExistence(${param.field})`,
                cmd: {
                    action: 'find',
                    query: { where: param.query }
                },
                dSource: 1
            };
            console.log("CdCliService::validateExistence/param.model:", param.model);
            console.log("CdCliService::validateExistence/serviceInput:", JSON.stringify(serviceInput));
            const b = new BaseService();
            return b.read(req, res, serviceInput).then(r => {
                if (r.length > 0) {
                    this.logger.logInfo(`cdCli/CdCliService::validateExistence() - ${param.field} exists`);
                    return true;
                } else {
                    this.logger.logError(`cdCli/CdCliService::validateExistence() - Invalid ${param.field}`);
                    this.b.i.app_msg = `${param.field} reference is invalid`;
                    this.b.err.push(this.b.i.app_msg);
                    return false;
                }
            });
        });

        const results = await Promise.all(promises);

        // If any of the validations fail, return false
        return results.every(result => result === true);
    }

    async createSL(req: Request, res: Response) {
        const svSess = new SessionService();
        await this.b.initSqlite(req, res)
        if (await this.validateCreateSL(req, res)) {
            await this.beforeCreateSL(req, res);
            const serviceInput = {
                serviceInstance: this,
                serviceModel: CdCliModel,
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

    async createI(req, res, serviceInputExt: IExtServiceInput<any>): Promise<CdCliModel | boolean> {
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
                    "cdCliGuid": "",
                    "cdCliName": "Kenya",
                    "cdCliDescription": "2006",
                    "cdGeoLocationId": null,
                    "cdCliWoccu": false,
                    "cdCliCount": 2993,
                    "cdCliEfgsCount": 3265545,
                    "cdCliSavesShares": 1608009012,
                    "cdCliLoans": 1604043550,
                    "cdCliReserves": 102792479,
                    "cdCliAssets": 2146769999,
                    "cdCliEfgPenetration": 16.01,
                    "cdCliDateLabel": "2006-12-31 23:59:59",
                    "cdCliRefId": null
                },
                {
                    "cdCliGuid": "",
                    "cdCliName": "Malawi",
                    "cdCliDescription": "2006",
                    "cdGeoLocationId": null,
                    "cdCliWoccu": false,
                    "cdCliCount": 70,
                    "cdCliEfgsCount": 62736,
                    "cdCliSavesShares": 6175626,
                    "cdCliLoans": 4946246,
                    "cdCliReserves": 601936,
                    "cdCliAssets": 7407250,
                    "cdCliEfgPenetration": 0.9,
                    "cdCliDateLabel": "2006-12-31 23:59:59",
                    "cdCliRefId": null
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
        this.logger.logInfo('CdCliService::createM()/01')
        let data = (req as any).post.dat.f_vals[0].data
        this.logger.logInfo('CdCliService::createM()/data:', data)
        // this.b.models.push(CdCliModel)
        // this.b.init(req, res)

        for (var cdCliData of data) {
            this.logger.logInfo('cdCliData', cdCliData)
            const cdCliQuery: CdCliModel = cdCliData;
            const svCdCli = new CdCliService();
            const si = {
                serviceInstance: svCdCli,
                serviceModel: CdCliModel,
                serviceModelInstance: svCdCli.serviceModel,
                docName: 'CdCliService::CreateM',
                dSource: 1,
            }
            const serviceInputExt: IExtServiceInput<any> = {
                serviceInput: si,
                entityData: cdCliQuery
            }
            let ret = await this.createI(req, res, serviceInputExt)
            this.logger.logInfo('CdCliService::createM()/forLoop/ret:', { ret: ret })
        }
        // return current sample data
        // eg first 5
        // this is just a sample for development
        // producation can be tailored to requrement 
        // and the query can be set from the client side.
        let q = {
            // "select": [
            //     "cdCliName",
            //     "cdCliDescription"
            // ],
            "where": {},
            "take": 5,
            "skip": 0
        }
        this.getCdCli(req, res, q)
    }

    async CdCliExists(req: Request, res: Response, q: IQuery): Promise<boolean> {
        const serviceInput: IServiceInput<any> = {
            serviceInstance: this,
            serviceModel: CdCliModel,
            docName: 'CdCliService::CdCliExists',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1,
        }
        return this.b.read(req, res, serviceInput)
    }

    async beforeCreate(req: Request, res: Response): Promise<any> {
        /**
         * create can be processed from existing or new company
         * In case of new company, setCompanyId() saves and use the id to set companyId for cdCli
         */
        await this.setCompanyId(req, res)

        this.b.setPlData(req, { key: 'cdCliGuid', value: this.b.getGuid() });
        this.b.setPlData(req, { key: 'cdCliEnabled', value: true });
        return true;
    }

    async beforeCreateSL(req: Request, res: Response): Promise<any> {
        this.b.setPlData(req, { key: 'cdCliGuid', value: this.b.getGuid() });
        this.b.setPlData(req, { key: 'cdCliEnabled', value: true });
        return true;
    }

    async setCompanyId(req: Request, res: Response) {
        const svCompany = new CompanyService();
        if ('extData' in (req as any).post.dat.f_vals[0]) {
            if ('company' in (req as any).post.dat.f_vals[0].extData) {
                const si = {
                    serviceInstance: svCompany,
                    serviceModel: CompanyModel,
                    serviceModelInstance: svCompany.serviceModel,
                    docName: 'CdCliService/beforeCreate',
                    dSource: 1,
                }
                const serviceInputExt: IExtServiceInput<any> = {
                    serviceInput: si,
                    entityData: (req as any).post.dat.f_vals[0].extData.company
                }
                // Call CompanyService to create a new company
                const c: any = await svCompany.createI(req, res, serviceInputExt);
                this.b.setPlData(req, { key: 'companyId', value: c.companyId });
            }
        }
    }

    async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        // const serviceInput: IServiceInput<any> = {
        //     serviceInstance: this,
        //     serviceModel: CdCliModel,
        //     docName: 'CdCliService::CdCliExists',
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
        this.logger.logInfo('CdCliService::getCdCli/q:', q);
        try {
            this.b.readSL$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // this.logger.logInfo('CdCliService::read$()/r:', r)
                    this.b.i.code = 'CdCliService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.connSLClose()
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            this.logger.logInfo('CdCliService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'CdCliService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    update(req: Request, res: Response) {
        // this.logger.logInfo('CdCliService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: CdCliModel,
            docName: 'CdCliService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        // this.logger.logInfo('CdCliService::update()/02')
        this.b.update$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.respond(req, res)
            })
    }

    updateSL(req: Request, res: Response) {
        this.logger.logInfo('CdCliService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdateSL(q);
        const serviceInput = {
            serviceModel: CdCliModel,
            docName: 'CdCliService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        this.logger.logInfo('CdCliService::update()/02')
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

    async validateCreateSL(req: Request, res: Response) {
        return true;
    }

    /**
     * 
     * curl test:
     * curl -k -X POST -H 'Content-Type: application/json' -d '{"ctx": "App", "m": "CdClis","c": "CdCli","a": "Get","dat": {"f_vals": [{"query": {"where": {"cdCliName": "Kenya"}}}],"token":"08f45393-c10e-4edd-af2c-bae1746247a1"},"args": null}' http://localhost:3001 -v  | jq '.'
     * @param req 
     * @param res 
     * @param q 
     */
    async getCdCli(req: Request, res: Response, q?: IQuery): Promise<any> {

        if (q === null) {
            q = this.b.getQuery(req);
        }
        this.logger.logInfo('CdCliService::getCdCli/f:', q);
        // const serviceInput = siGet(q,this)
        this.serviceModel = new CdCliModel();
        const serviceInput: IServiceInput<any> = this.b.siGet(q,'CdCliService:getCdCli' ,CdCliModel)
        serviceInput.serviceModelInstance = this.serviceModel
        serviceInput.serviceModel = CdCliModel
        try {
            const r = await this.b.read(req, res, serviceInput)
            this.b.successResponse(req, res, r)
        } catch (e: any) {
            this.logger.logInfo('CdCliService::read$()/e:', e)
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

    /**
     * Queey params:
     * - selected data level eg all-available, world, continent, country, continental-region, national-region
     * - list of selected items 
     * - eg: 
     * - on selection of all-available, show list of countries availaable with summary data
     * - on selection of world show continents with available data
     * - on selection of continent show list of countries availaable with summary data
     * - on selection of countrie list of national-resions availaable with summary data
     * - on selection of national-region given national-resion with summary data
     * @param q 
     */
    async getCdClis(req: Request, res: Response, q?: IQuery): Promise<any> {
        if (q === null) {
            q = this.b.getQuery(req);
        }
        this.logger.logInfo('CdCliService::getCdClis/q:', q);
        const serviceInput = siGet(q, this)
        try {
            const r = await this.b.read(req, res, serviceInput)
            this.b.successResponse(req, res, r)
        } catch (e: any) {
            this.logger.logInfo('CdCliService::read$()/e:', e)
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
        this.logger.logInfo('CdCliService::getCdCli/q:', q);
        const serviceInput = siGet(q, this)
        try {
            this.b.readSL$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // this.logger.logInfo('CdCliService::read$()/r:', r)
                    this.b.i.code = 'CdCliService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.connSLClose()
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            this.logger.logInfo('CdCliService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'CdCliService:update',
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
        this.logger.logInfo('CdCliService::getCdCli/f:', q);
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliService::getCdCliType$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // this.logger.logInfo('CdCliService::read$()/r:', r)
                    this.b.i.code = 'CdCliController::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            this.logger.logInfo('CdCliService::read$()/e:', e)
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

    /////////////////////////////////////////////////////////////////////////////////////////
    // Fetch all enabled CdCliTypes
    async getCdCliType2(req: any, res: any): Promise<void> {
        const q = this.b.getQuery(req);
        const serviceInput: IServiceInput<any> = {
            serviceInstance: this,
            serviceModel: CdCliTypeModel,
            docName: 'CdCliTypeService::getCdCliType2',
            cmd: {
                action: 'find',
                query: q,
            },
            dSource: 1,
        };

        const dbResult = await this.b.read2(req, res, serviceInput);
        this.b.i.code = 'CdCliTypeService::getCdCliType2';
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = dbResult;
        this.b.respond(req, res)
    }

    // Search CdCliTypes with dynamic filtering
    async searchCdCliTypes(req: any, res: any): Promise<void> {
        try {

            await this.transformSearchQuery(req, res)
            // const take = 10; // Limit
            // const skip = 0;  // Offset

            const serviceInput: IServiceInput<any> = {
                serviceInstance: this,
                serviceModel: CdCliTypeModel,
                docName: 'CdCliTypeService::searchCdCliTypes',
                cmd: {
                    action: 'find',
                    query: {
                        where: this.arrLikeConditions,
                    },
                },
                dSource: 1,
            };

            console.log("CdCliTypeService::searchCdCliTypes()/serviceInput.cmd?.query:", serviceInput.cmd?.query);

            const dbResult = await this.b.read2(req, res, serviceInput);
            this.b.i.code = 'CdCliTypeService::searchCdCliTypes';
            const svSess = new SessionService();
            svSess.sessResp.cd_token = (req as any).post.dat.token;
            svSess.sessResp.ttl = svSess.getTtl();
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = dbResult;
            this.b.respond(req, res);
        } catch (e: any) {
            this.logger.logInfo('CdCliTypeService::searchCdCliTypes()/e:', e);
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'CdCliTypeService::searchCdCliTypes',
                app_msg: ''
            };
            this.b.serviceErr(req, res, e, i.code);
            this.b.respond(req, res);
        }
    }

    async transformSearchQuery(req: Request, res: Response) {
        const q: IQuery = this.b.getPlQuery(req);
        const tq = QueryTransformer.transformQuery(q)
        const COOP_TYPE_SEARCH_FIELDS = tq.searchFields;
        const searchTerm = tq.searchTerm;
        COOP_TYPE_SEARCH_FIELDS.forEach(field => {
            this.arrLikeConditions.push({ [field]: Like(`%${searchTerm}%`) });
        });
    }


    // Utility: Generate OR conditions for a search term and fields
    orConditions(searchTerm: string, fields: string[]): any[] {
        return fields.map(field => ({
            [field]: `%${searchTerm}%`,
        }));
    }

    // Utility: Add additional OR conditions to existing conditions
    addOrConditions(where: any[], extraConditions: { [key: string]: any }): any[] {
        return where.map(condition => ({
            ...condition,
            ...extraConditions,
        }));
    }
    //////////////////////////////////////////////////////////////////////////////////////////

    getCdObjTypeCount(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('CdCliService::getCdObjCount/q:', q);
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliService::getCdObjCount$',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'CdCliService::getCdObjTypeCount';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.respond(req, res)
            })
    }

    /**
     * 
     * @param req 
     * @param res 
     */
    getCdCliPaged(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        this.logger.logInfo('CdCliService::getCdCliPaged/q:', q);
        const serviceInput = {
            serviceModel: CdCliViewModel,
            docName: 'CdCliService::getCdCliPaged$',
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

    getCdCliQB(req: Request, res: Response) {
        console.log('CdCliService::getCdCliQB()/1')
        this.b.entityAdapter.registerMappingFromEntity(CdCliViewModel);
        const q = this.b.getQuery(req);
        const serviceInput = {
            serviceModel: CdCliViewModel,
            docName: 'CdCliService::getCdCliQB',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }

        this.b.readQB$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = serviceInput.docName;
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
        this.logger.logInfo('CdCliService::getCdCliPaged()/q:', q);
        const serviceInput = {
            serviceModel: CdCliModel,
            docName: 'CdCliService::getCdCliPaged',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCountSL$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'CdCliService::Get';
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
        this.logger.logInfo('CdCliService::getCdCliPaged/q:', q);
        const serviceInput = {
            serviceModel: CdCliTypeModel,
            docName: 'CdCliService::getCdCliPaged$',
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
        this.logger.logInfo('CdCliService::delete()/q:', q)
        const serviceInput = {
            serviceModel: CdCliModel,
            docName: 'CdCliService::delete',
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
        this.logger.logInfo('CdCliService::deleteSL()/q:', q)
        const serviceInput = {
            serviceModel: CdCliModel,
            docName: 'CdCliService::deleteSL',
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

    /**
     * This method is used internally by other methods in data agregation
     * @param req 
     * @param res 
     * @param q 
     * @returns 
     */
    async getCdCliI(req: Request, res: Response, q?: IQuery): Promise<any> {
        if (q === null) {
            q = this.b.getQuery(req);
        }
        this.logger.logInfo('CdCliService::getCdCliI/q:', q);
        let serviceModel = new CdCliViewModel();
        const serviceInput: IServiceInput<any> = this.b.siGet(q,'CdCliService:getCdCliI' ,CdCliViewModel)
        serviceInput.serviceModelInstance = serviceModel
        serviceInput.serviceModel = CdCliViewModel
        try {
            let respData = await this.b.read(req, res, serviceInput)
            return { data: respData, error: null }
        } catch (e: any) {
            this.logger.logInfo('CdCliService::read()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'BaseService:update',
                app_msg: ''
            };
            return { data: null, error: e }
        }
    }

    /**
     * get data by geo-location
     * 1. get data from n selected locations
     * 2. list countries queried
     * 3. derive polulation data from geoLocation data
     * @param req 
     * @param res 
     */
    // async StatsByGeoLocation(req: Request, res: Response, q?: IQuery) {
    //     if (q === null) {
    //         q = this.b.getQuery(req);
    //     }

    //     let svCdGeoLocationService = new CdGeoLocationService()
    //     let gData = await svCdGeoLocationService.getGeoLocationI(req, res, q)

    //     // ,"order": {"cdCliDateLabel": "ASC"}
    //     q.order = { "cdCliDateLabel": "ASC" }
    //     let cData = await this.getCdCliI(req, res, q)
    //     let ret = {
    //         geoLocationData: gData.data,
    //         cdCliData: cData.data,
    //     }
    //     this.logger.logInfo('CdCliService::StatsByGeoLocation()/ret:', ret)
    //     this.b.cdResp.data = await ret;
    //     this.b.respond(req, res)
    // }

    async getCdCliProfileI(req: Request, res: Response, q?: IQuery): Promise<any> {
        if (q === null) {
            q = this.b.getQuery(req);
        }
        this.logger.logInfo('CdCliService::getCdCliProfileI/q:', q);
        let serviceModel = new CdCliProfileViewModel();
        const serviceInput: IServiceInput<any> = this.b.siGet(q,'CdCliService:getCdCliProfileI' ,CdCliProfileViewModel)
        serviceInput.serviceModelInstance = serviceModel
        serviceInput.serviceModel = CdCliProfileViewModel
        try {
            let respData = await this.b.read(req, res, serviceInput)
            return { data: respData, error: null }
        } catch (e: any) {
            this.logger.logInfo('CdCliService::read()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'BaseService:update',
                app_msg: ''
            };
            return { data: null, error: e }
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////
    // STARTING MEMBER PROFILE FEATURES
    // Public method to update user member profile (e.g., avatar, bio)
    async updateCurrentMemberProfile(req: Request, res: Response) {
        const svSession = new SessionService();
        try {
            // const session = await svSession.getSession(req, res);
            // const userId = session[0].currentUserId;
            // const pl:CdCliProfileModel = this.b.getPlData(req)
            // const q = {where: {userId: userId,cdCliId: pl.cdCliId}}
            // const cdCliEfg = this.getCdCliProfileI(req, res, q)
            const updatedProfile = this.b.getPlData(req);  // Extract payload data

            // Validate input
            const validProfile = await this.validateProfileData(updatedProfile);

            if (validProfile) {
                // Prepare serviceInput for BaseService methods
                const serviceInput: IServiceInput<any> = {
                    serviceInstance: this,
                    serviceModel: CdCliProfileModel,
                    docName: 'CdCliProfileService::updateCurrentMemberProfile',
                    cmd: {
                        query: updatedProfile
                    }
                };

                // Update user member profile using BaseService's updateJSONColumnQB method
                const result = await this.b.updateJSONColumnQB(req, res, serviceInput, 'user member profile', updatedProfile);

                // Respond to API caller
                // return await this.b.respond(req, res, { success: true, data: result });
                this.b.cdResp.data = result;
                return await this.b.respond(req, res)
            } else {
                // return await this.b.respond(req, res, { success: false, message: "Invalid profile data" });
                const e = "Invalid profile data"
                this.logger.logInfo('UserService::read$()/e:', { error: e })
                this.b.err.push(e.toString());
                const i = {
                    messages: this.b.err,
                    code: 'UserService:updateProfile',
                    app_msg: ''
                };
                await this.b.serviceErr(req, res, e, i.code)
                await this.b.respond(req, res)
            }

        } catch (e: any) {
            this.logger.logInfo('UserService::read$()/e:', { error: e })
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'UserService:updateProfile',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    // async getUserProfile(req: Request, res: Response) {
    //     try {
    //         const pl = this.b.getPlData(req)
    //         const userId = pl.userId;

    //         // Retrieve the user member profile using an internal method
    //         const profile = await this.getUserProfileI(req, res, userId);

    //         // Respond with the retrieved profile data
    //         this.b.cdResp.data = profile;
    //         return await this.b.respond(req, res);
    //     } catch (e: any) {
    //         this.b.err.push(e.toString());
    //         const i = {
    //             messages: this.b.err,
    //             code: 'UserService:getProfile',
    //             app_msg: ''
    //         };
    //         await this.b.serviceErr(req, res, e, i.code);
    //         await this.b.respond(req, res);
    //     }
    // }

    // Public method to get a user member profile
    // async getCurrentMemberProfile(req: Request, res: Response) {
    //     try {
    //         const svSession = new SessionService()
    //         const session = await svSession.getSession(req, res);
    //         const userId = session[0].currentUserId;
    //         console.log("UserServices::getCurrentMemberProfile9)/userId:", userId)
    //         // Retrieve the user member profile using an internal method
    //         const profile = await this.getUserProfileI(req, res, userId);

    //         // Respond with the retrieved profile data
    //         this.b.cdResp.data = profile;
    //         return await this.b.respond(req, res);
    //     } catch (e: any) {
    //         this.b.err.push(e.toString());
    //         const i = {
    //             messages: this.b.err,
    //             code: 'UserService:getProfile',
    //             app_msg: ''
    //         };
    //         await this.b.serviceErr(req, res, e, i.code);
    //         await this.b.respond(req, res);
    //     }
    // }

    // Internal method to retrieve user member profile
    // async getUserProfileI(req, res, cdCliEfgId: number): Promise<ICdCliProfileProfile | null> {
    //     try {
    //         // // Use BaseService to retrieve user member profile
    //         // const result = await this.b.read(req, res, serviceInput);
    //         // const user = await this.getCdCliProfileI(userId)
    //         const q = { where: { cdCliEfgId: cdCliEfgId } }
    //         const cdCliEfg: CdCliProfileViewModel[] = await this.getCdCliProfileI(req, res, q)
    //         if (cdCliEfg && cdCliEfg[0].cdCliEfgProfile) {
    //             let cdCliEfgProfileJSON: ICdCliProfileProfile = JSON.parse(cdCliEfg[0].cdCliEfgProfile)

    //             if ('cdCliEfgData' in cdCliEfgProfileJSON) {
    //                 // profile data is valid

    //                 // update with latest user data
    //                 cdCliEfgProfileJSON[0].cdCliEfgData = cdCliEfg

    //             } else {
    //                 // profile data is not set, so set it from default
    //                 cdCliEfgProfileJSON = cdCliEfgProfileDefault
    //                 /**
    //                  * this stage should be modified to
    //                  * filter data based on pwermission setting
    //                  * permission data can further be relied on
    //                  * by the front end for hidden or other features of accessibility
    //                  * to user member profile data.
    //                  * This mechanism can be applied to all corpdesk resources
    //                  */
    //                 cdCliEfgProfileJSON.cdCliEfgship.memberData = cdCliEfg
    //             }
    //             return cdCliEfgProfileJSON;  // Parse the JSON field

    //         } else {
    //             return null;
    //         }

    //     } catch (e: any) {
    //         this.b.err.push(e.toString());
    //         const i = {
    //             messages: this.b.err,
    //             code: 'UserService:getProfile',
    //             app_msg: ''
    //         };
    //         await this.b.serviceErr(req, res, e, i.code);
    //         await this.b.respond(req, res);
    //     }
    // }

    // Internal method to handle profile updates
    async updateUserProfileI(req, res, userId: string, newProfileData: Partial<IUserProfile>) {
        try {
            // Use BaseService method to handle JSON updates for user member profile field
            const serviceInput = {
                serviceInstance: this,
                serviceModel: CdCliProfileModel,
                docName: 'CdCliProfileService::updateUserProfileI',
                cmd: {
                    query: newProfileData
                    // query: {
                    //     where: { user_id: userId },
                    //     update: { user member profile: newProfileData }
                    // }
                }
            };

            await this.b.updateJSONColumnQB(req, res, serviceInput, 'user member profile', newProfileData);
            return newProfileData;  // Return updated profile
        } catch (error) {
            throw new Error(`Error updating user member profile: ${error.message}`);
        }
    }

    // Helper method to validate profile data
    validateProfileData(profileData: Partial<IUserProfile>): boolean {
        // Example validation for bio length
        if (profileData.bio && profileData.bio.length > 500) {
            return false;  // Bio is too long
        }
        return true;
    }


    // Internal helper method to get a user by ID
    // async getCdCliProfileByIdI(userId: number) {
    //     return await this.db.user.findOne({ where: { user_id: userId } });
    // }
}

function transformed(q: IQuery) {
    throw new Error('Function not implemented.');
}
