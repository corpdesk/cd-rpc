import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { SessionService } from '../../user/services/session.service';
import { CdService } from '../../base/cd.service';
import { IExtServiceInput, IRespInfo, IServiceInput, IUser } from '../../base/i-base';
import { InteRactReactModel } from '../models/inte-ract-react.model';
import { from, Observable } from 'rxjs';
import { getConnection } from 'typeorm';
import { GenericController } from "../../base/generic-controller";
import { GenericService } from "../../base/generic-service";

// export class InteRactReactService extends CdService {
export class InteRactReactService extends GenericService<InteRactReactModel> {
    err: string[] = []; // error messages
    b: any; // instance of InteRactReactService
    cdToken: string;
    serviceModel = InteRactReactModel;
    docName = 'InteRactReactService';
    sessModel;
    isInitial; // the first time a bill is created other than being amended
    
    /*
     * create rules
     */
    cRules: any = {
        required: [
        ],
        noDuplicate: []
    };
    uRules: any[];
    dRules: any[];

    constructor() {
        super(InteRactReactModel)
        this.b = new BaseService();
    }

    

    /**
     * {
             "ctx": "App",
             "m": "cd-accts",
             "c": "Bill",
             "a": "Create",
             "dat": {
                 "f_vals": [
                     {
                         "data": {
                             "billName": "myBill9",
                             "billDescription": "vzkle",
                             "billRate": 30, 
                             "billUnit": 14, 
                             "billType": 3,
                             "clientId": 85, 
                             "vendorId": 111162, 
                             "billDate": "2022-03-25 00:00:00",
                             "billTax": 0.18,
                             "billDiscount": 0.1, 
                             "billCost": 2020
                         }
                     }
                 ],
                 "token": "fc735ce6-b52f-4293-9332-0181a49231c4"
             },
             "args": {}
         }
     *  - check if vendor & client has acct/account while creating bill
        - set vendor/acct-account as parent while creating bill
        - set client/acct-account as child
        - create account while creating bill with client/acct-account as hiearchial parent
        - create accts/invoice while creating a bill
     * @param req 
     * @param res 
     */
    async create(req: Request, res: Response) {
        console.log('InteRactReactService::create()/01')
        const svSess = new SessionService();
        if (await this.validateCreate(req, res)) {
            const account = await this.beforeCreate(req, res);
            console.log('InteRactReactService::create()/account:', account)
            const serviceInput = {
                serviceInstance: this,
                serviceModel: InteRactReactModel,
                serviceModelInstance: this.serviceModel,
                docName: 'Create InteRactReact',
                dSource: 1,
            }
            const result = await this.b.create(req, res, serviceInput)
            console.log('InteRactReactService::create()/afterResult:', result)
            const afterResult = await this.afterCreate(req, res, result)
            console.log('InteRactReactService::create()/afterResult:', afterResult)
            this.b.i.app_msg = '';
            this.b.setAppState(true, this.b.i, svSess.sessResp);
            this.b.cdResp.data = afterResult;
            const r = await this.b.respond(req, res);
        } else {
            const r = await this.b.respond(req, res);
        }
    }

    async createI(req, res, serviceInputExt: IExtServiceInput<any>): Promise<InteRactReactModel | boolean> {
        console.log('InteRactReactService::createI()/createI()/01')
        if (await this.validatecreateI(req, res, serviceInputExt)) {
            console.log('InteRactReactService::createI()/02')
            const account = await this.beforeCreateI(req, res, serviceInputExt);
            console.log('InteRactReactService::createI()/account:', account)
            const result = this.b.createI(req, res, serviceInputExt)
            const afterResult = await this.afterCreate(req, res, result)
            console.log('InteRactReactService::createI()/afterResult:', afterResult)
            return afterResult;
        } else {
            const r = await this.b.respond(req, res);
        }
    }

    async validatecreateI(req, res, serviceInputExt) {
        console.log('InteRactReactService::validateCreateI()/01')
        let countInvalid = 0;
        // const validRequired = await this.b.validateRequired(req, res, this.cRules)
        // console.log('InteRactReactService::validateCreateI()/validRequired:', validRequired)

        // confirm that entityData conforms to this.cRules
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
    async afterCreate(req, res, newBill: InteRactReactModel): Promise<any> {
        
    }

    async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
        const q = this.b.getQuery(req);
        console.log('InteRactReactService::getBill/q:', q);
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    // console.log('InteRactReactService::read$()/r:', r)
                    this.b.i.code = 'InteRactReactService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.sqliteConn.close();
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            console.log('InteRactReactService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'InteRactReactService:update',
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
    //         "m": "CdAccts",
    //         "c": "Bill",
    //         "a": "Update",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "update": {
    //                             "billGuid": "azimio3"
    //                         },
    //                         "where": {
    //                             "billId": 8
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
    async update(req: Request, res: Response) {
        console.log('InteRactReactService::update()/01');
        let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: InteRactReactModel,
            docName: 'InteRactReactService::update',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        console.log('InteRactReactService::update()/02')
        this.b.update$(req, res, serviceInput)
            .subscribe((ret: any) => {
                this.b.cdResp.data = ret;
                this.b.sqliteConn.close();
                this.b.respond(req, res)
            })
    }

    async updateI(req, res, q): Promise<any> {
        console.log('InteRactReactService::updateI()/01');
        // let q = this.b.getQuery(req);
        q = this.beforeUpdate(q);
        const serviceInput = {
            serviceModel: InteRactReactModel,
            docName: 'InteRactReactService::updateI',
            cmd: {
                action: 'update',
                query: q
            },
            dSource: 1
        }
        console.log('InteRactReactService::update()/02')
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
        console.log('InteRactReactService::validateCreate()/01')
        const validRequired = await this.b.validateRequired(req, res, this.cRules)
        console.log('InteRactReactService::validateCreate()/validRequired:', validRequired)
        return validRequired;
    }

    // /**
    //  *
    //  * {
    //         "ctx": "App",
    //         "m": "CdAccts",
    //         "c": "Bill",
    //         "a": "Get",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {
    //                             "billId": 8
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
    async getInteRactReact(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('InteRactReactService::getBill/q:', q);
        const serviceInput = {
            serviceModel: InteRactReactModel,
            docName: 'InteRactReactService::getBill',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        try {
            this.b.read$(req, res, serviceInput)
                .subscribe((r: any) => {
                    console.log('InteRactReactService::read$()/r:', r)
                    this.b.i.code = 'InteRactReactService::Get';
                    const svSess = new SessionService();
                    svSess.sessResp.cd_token = (req as any).post.dat.token;
                    svSess.sessResp.ttl = svSess.getTtl();
                    this.b.setAppState(true, this.b.i, svSess.sessResp);
                    this.b.cdResp.data = r;
                    this.b.respond(req, res)
                })
        } catch (e: any) {
            console.log('InteRactReactService::read$()/e:', e)
            this.b.err.push(e.toString());
            const i = {
                messages: this.b.err,
                code: 'InteRactReactService:update',
                app_msg: ''
            };
            await this.b.serviceErr(req, res, e, i.code)
            await this.b.respond(req, res)
        }
    }

    // /**
    //  * {
    //         "ctx": "App",
    //         "m": "CdAccts",
    //         "c": "Bill",
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
        console.log('InteRactReactService::getBillCount()/q:', q);
        const serviceInput = {
            serviceModel: InteRactReactModel,
            docName: 'InteRactReactService::getBillCount',
            cmd: {
                action: 'find',
                query: q
            },
            dSource: 1
        }
        this.b.readCount$(req, res, serviceInput)
            .subscribe((r: any) => {
                this.b.i.code = 'InteRactReactService::Get';
                const svSess = new SessionService();
                svSess.sessResp.cd_token = (req as any).post.dat.token;
                svSess.sessResp.ttl = svSess.getTtl();
                this.b.setAppState(true, this.b.i, svSess.sessResp);
                this.b.cdResp.data = r;
                this.b.sqliteConn.close();
                this.b.respond(req, res)
            })
    }

    async delete(req: Request, res: Response) {
        const q = this.b.getQuery(req);
        console.log('InteRactReactService::delete()/q:', q)
        const serviceInput = {
            serviceModel: InteRactReactModel,
            docName: 'InteRactReactService::delete',
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

    ////////////////////////

    /**
     * User associates are available in 3 categories
     * 1. All consumer users: from inte_ract_association
     * 2. Pals from inte_ract_association
     * 3. All groups where the user belongs: from mGroupMember::getUserGroups($userID);
     *
     * This method allow clients to access these associations from one interface.
     * 
     * 
     * fAssociation()
    {
        return "
        inte_ract_association.inte_ract_association_id AS group_id,
        inte_ract_association.inte_ract_association_guid AS group_guid,
        inte_ract_association.inte_ract_association_name AS group_name,
        (SELECT null) AS member_name,
        (SELECT null) AS group_description,
        (SELECT null) AS group_owner_id,
        (SELECT null) AS 'doc_id',
        (SELECT null) AS 'group_type_id',
        (SELECT null) AS 'module_guid',
        (SELECT null) AS 'company_id',
        (SELECT null) AS 'is_public',
        (SELECT null) AS 'enabled'
        ";

        group_members_view
        ->join('group_member', 'group.group_guid', '=', 'group_member.member_guid')
            ->select(\DB::raw("
                " . self::fGroup() . ",
                " . self::fGroupMember() . "
                ")
    }
     */

     getAssociation(userID)
     {
        //  $groups = [];
        //  $obj = \DB::table('inte_ract_association')
        //      ->select(\DB::raw(self::fAssociation()))
        //      ->where('enabled', true);
        //  $ret1 = mB::qbGet(null, $filter, $obj, $order);
 
        //  $ret2 = mGroupMember::getUserGroups($userID);
        //  return array_merge($ret1, $ret2);
     }
}