import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { SessionService } from '../../user/services/session.service';
import { CdService } from '../../base/cd.service';
import { IExtServiceInput, IQbInput, IRespInfo, IServiceInput, IUser } from '../../base/i-base';
import { from, Observable } from 'rxjs';
import { getConnection } from 'typeorm';
import { InteRactMediaModel } from '../models/inte-ract-media.model';
import { GenericController } from "../../base/generic-controller";

// export class InteRactMediaService extends CdService {
export class InteRactMediaService extends GenericController<InteRactMediaModel> {
    err: string[] = []; // error messages
    b: any; // instance of BaseService
    cdToken: string;
    serviceModel: InteRactMediaModel;
    sessModel;
    isInitial; // the first time a bill is created other than being amended

    /*
     * create rules
     */
    cRules: any = {
        required: [
            'inteRactMediaName',
            'inteRactMedia_typeId',
            'location'
        ],
        noDuplicate: []
    };
    uRules: any[];
    dRules: any[];

    constructor() {
        super()
        this.b = new BaseService();
        this.serviceModel = new InteRactMediaModel();
    }

    /**
     * {
            "ctx": "Sys",
            "m": "InteRact",
            "c": "InteRactMediaController",
            "a": "actionCreate",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "inteRactMedia_name": "",
                            "inteRactMedia_description": "",
                            "inteRactMedia_type_id": "",
                            "location": "http://localhost/xxx"
                        }
                    }
                ],
                "token": "mT6blaIfqWhzNXQLG8ksVbc1VodSxRZ8lu5cMgda"
            },
            "args": null
        }
     * 
     * @param req 
     * @param res 
     */
    async create(req: Request, res: Response) {
        console.log('InteRactMediaService::create()/01')
        const svSess = new SessionService();
        if (await this.validateCreate(req, res)) {
            await this.beforeCreate(req, res);
            const serviceInput = {
                serviceInstance: this,
                serviceModel: InteRactMediaModel,
                serviceModelInstance: this.serviceModel,
                docName: 'Create InteRactMedia',
                dSource: 1,
            }
            const newInteRactMedia = await this.b.create(req, res, serviceInput)
            console.log('InteRactMediaService::create()/newInteRactMedia:', newInteRactMedia)
            const afterResult = await this.afterCreate(req, res, newInteRactMedia)
            console.log('InteRactMediaService::create()/afterResult:', afterResult)
            this.b.i.app_msg = '';
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = afterResult;
            const r = await this.b.respond(req, res);
        } else {
            const r = await this.b.respond(req, res);
        }
    }

    async beforeCreate(req: Request, res: Response): Promise<any> {

    }

    /**
     * sync bill with cd-invoice
     * @param req 
     * @param res 
     * @param createResult 
     * @returns 
     */
    async afterCreate(req, res, result: InteRactMediaModel): Promise<any> {
        return Promise.resolve(result);
    }



    async createI(req, res, serviceInputExt: IExtServiceInput<any>): Promise<InteRactMediaModel | boolean> {
        console.log('InteRactMediaService::createI()/createI()/01')
        if (await this.validatecreateI(req, res, serviceInputExt)) {
            console.log('InteRactMediaService::createI()/02')
            const befRet = await this.beforecreateI(req, res, serviceInputExt);
            console.log('InteRactMediaService::createI()/befRet:', befRet)
            const result = this.b.createI(req, res, serviceInputExt)
            const afterResult = await this.afterCreate(req, res, result)
            console.log('InteRactMediaService::createI()/afterResult:', afterResult)
            return afterResult;
        } else {
            const r = await this.b.respond(req, res);
        }
    }

    async validatecreateI(req, res, serviceInputExt) {
        console.log('InteRactMediaService::validateCreateI()/01')
        let countInvalid = 0;
        // // confirm that entityData conforms to this.cRules
        this.cRules.required.forEach((fieldName) => {
            if (!(fieldName in serviceInputExt.entityData)) { // required field is missing
                countInvalid++;
            }
        })
        if (countInvalid > 0) {
            return true;
        } else {
            return false;
        }
    }

    async beforeCreateI(req, res, serviceInputExt: IExtServiceInput<any>): Promise<any> {
        return Promise.resolve(null)
    }

    async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        const q = this.b.getQuery(req);
        console.log('InteRactMediaService::getInteRactMedia/q:', q);
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // console.log('InteRactMediaService::read$()/r:', r)
                    this.b.i.code = 'InteRactMediaService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.sqliteConn.close();
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            console.log('InteRactMediaService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'InteRactMediaService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    // /**
    //  *
    //  * {
    //         "ctx": "App",
    //         "m": "InteRact",
    //         "c": "InteRactMedia",
    //         "a": "Update",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "update": {
    //                             "billGuid": "azimio3"
    //                         },
    //                         "where": {
    //                             "inteRactPubId": 8
    //                         }
    //                     }
    //                 }
    //             ],
    //             "token": "fc735ce6-b52f-4293-9332-0181a49231c4"
    //         },
    //         "args": {}
    //     }
    //  * @param req
    //  * @param res
    //  */
    update(req: Request, res: Response) {
        console.log('InteRactMediaService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: InteRactMediaModel,
            docName: 'InteRactMediaService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        console.log('InteRactMediaService::update()/02')
        this.b.update$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.sqliteConn.close();
                this.b.respond(req, res)
            })
    }

    async updateI(req, res, q): Promise<any> {
        console.log('InteRactMediaService::updateI()/01');
        // let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: InteRactMediaModel,
            docName: 'InteRactMediaService::updateI',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        console.log('InteRactMediaService::update()/02')
        return this.b.update(req, res, serviceInput)
    }

    /**
     * harmonise any data that can
     * result in type error;
     * @param q
     * @returns
     */
    beforeUpdate(q: any) {
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
        console.log('InteRactMediaService::validateCreate()/01')
        const validRequired = await this.b.validateRequired(req, res, this.cRules)
        console.log('InteRactMediaService::validateCreate()/validRequired:', validRequired)
        return validRequired;
    }

    // /**
    //  *
    //  * {
    //         "ctx": "App",
    //         "m": "InteRact",
    //         "c": "InteRactMedia",
    //         "a": "Get",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {
    //                             "inteRactPubId": 8
    //                         }
    //                     }
    //                 }
    //             ],
    //             "token": "fc735ce6-b52f-4293-9332-0181a49231c4"
    //         },
    //         "args": {}
    //     }
    //  * @param req
    //  * @param res
    //  */
    async getInteRactMedia(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('InteRactMediaService::getInteRactMedia/q:', q);
        const serviceInput = {
            serviceModel: InteRactMediaModel,
            docName: 'InteRactMediaService::getInteRactMedia',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    console.log('InteRactMediaService::read$()/r:', r)
                    this.b.i.code = 'InteRactMediaService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            console.log('InteRactMediaService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'InteRactMediaService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    // /**
    //  * {
    //         "ctx": "App",
    //         "m": "InteRact",
    //         "c": "InteRactMedia",
    //         "a": "GetCount",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "select": [
    //                             "billName",
    //                             "billGuid"
    //                         ],
    //                         "where": {},
    //                         "take": 5,
    //                         "skip": 0
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
    getPaged(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('InteRactMediaService::getInteRactMediaCount()/q:', q);
        const serviceInput = {
            serviceModel: InteRactMediaModel,
            docName: 'InteRactMediaService::getInteRactMediaCount',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'InteRactMediaService::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.sqliteConn.close();
                this.b.respond(req, res)
            })
    }

    // getViewPaged(req: Request, res: Response) {
    //     const q = this.b.getQuery(req);
    //     console.log('InteRactMediaService::getInteRactMediaCount()/q:', q);
    //     const serviceInput = {
    //         serviceModel: InteRactMediaViewModel,
    //         docName: 'InteRactMediaService::getInteRactMediaCount',
    //         cmd: {
    //             action: 'find',
    //             query: q
    //         },
    //         dSource: 1
    //     }
    //     this.b.readCount$(req, res, serviceInput)
    //         .subscribe((r: any) => {
    //             this.b.i.code = 'InteRactMediaService::Get';
    //             const svSess = new SessionService();
    //             svSess.sessResp.cd_token = (req as any).post.dat.token;
    //             svSess.sessResp.ttl = svSess.getTtl();
    //             this.b.setAppState(true, this.b.i, svSess.sessResp);
    //             this.b.cdResp.data = r;
    //             this.b.sqliteConn.close();
    //             this.b.respond(req, res)
    //         })
    // }

    delete(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('InteRactMediaService::delete()/q:', q)
        const serviceInput = {
            serviceModel: InteRactMediaModel,
            docName: 'InteRactMediaService::delete',
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

    /**
     * {
            "ctx": "Sys",
            "m": "InteRact",
            "c": "InteRactMedia",
            "a": "TestJsonQuery",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "select": [
                                "inte_ractPubId",
                                "inte_ractPubName",
                                "inte_ractPubDescription",
                                "inte_ractPubGuid",
                                "docId",
                                "inteRactPubTypeId",
                                "public",
                                "m",
                                "c",
                                "j_val"
                            ],
                            "where": [
                                {
                                    "conjType": "",// options null, or omit the property
                                    "dataType":"json",
                                    "field": "j_val",
                                    "jPath": "'$.domain.group.doc_id'",
                                    "operator": "=",
                                    "val": 11091
                                },
                                {
                                    "field": "doc_id",
                                    "fieldType": "json",
                                    "operator": "=",
                                    "val": 11121,
                                    "conjType": "and" 
                                }
                            ]
                        }
                    }
                ],
                "token": "fc735ce6-b52f-4293-9332-0181a49231c4"
            },
            "args": {}
        }
     * @param req
     * @param res
     */
    async testJsonQuery(req: Request, res: Response): Promise<any> {
        console.log('InteRactMediaService::testJsonQuery()/01');
        let q: IQbInput = this.b.getQuery(req);
        console.log('InteRactMediaService::testJsonQuery()/q:', q);
        const serviceInput = {
            serviceModel: InteRactMediaModel,
            docName: 'InteRactMediaService::testJsonQuery',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            // this.b.readJSON$(req, res, serviceInput)
            //     .subscribe((r: any) => {
            //         // console.log('InteRactMediaService::testJsonQuery()/r:', r)
            //         this.b.i.code = 'InteRactMediaService::Get';
            //         const svSess = new SessionService();
            //         svSess.sessResp.cd_token = (req as any).post.dat.token;
            //         svSess.sessResp.ttl = svSess.getTtl();
            //         this.b.setAppState(true, this.b.i, svSess.sessResp);
            //         this.b.cdResp.data = r;
            //         this.b.respond(req, res)
            //     })
            const r = await this.b.readJSON(req, res, serviceInput)
            console.log('InteRactMediaService::testJsonQuery()/02');
            console.log('InteRactMediaService::testJsonQuery()/r:', r);
            this.b.i.code = 'InteRactMediaService::Get';
            const svSess = new SessionService();
            console.log('InteRactMediaService::testJsonQuery()/03');
            svSess.sessResp.cd_token = (req as any).post.dat.token;
            svSess.sessResp.ttl = svSess.getTtl();
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            console.log('InteRactMediaService::testJsonQuery()/04');
            this.b.cdResp.data = r;
            console.log('InteRactMediaService::testJsonQuery()/05');
            this.b.respond(req, res)
        } catch (e: any) {
            console.log('InteRactMediaService::testJsonQuery()/03');
            console.log('InteRactMediaService::testJsonQuery()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'InteRactMediaService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }
}