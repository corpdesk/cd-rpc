import { Request, Response } from "express";
import { MailService } from "../services/mail.service";
import { MailModel } from "../models/mail.model";
import { GenericController } from "../../base/generic-controller";

// export class MailController {
export class MailController extends GenericController<MailModel> {
    // b: BaseService;
    service: MailService;
    constructor(){
        super();
        // this.b = new BaseService();
        this.service = new MailService();
    }
    // /**
    //  * {
        //     "ctx": "Sys",
        //     "m": "Comm",
        //     "c": "MailController",
        //     "a": "sendMail",
        //     "dat": {
        //         "f_vals": [
        //             {
        //                 "service": "NodemailerService",
        //                 "data": {
        //                     "msg": "<strong>Testing msg from client app</strong>"
        //                 }
        //             }
        //         ],
        //         "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
        //     },
        //     "args": null
        // }
    //  * @param req
    //  * @param res
    //  */
    async sendMail(req: Request, res: Response) {
        const service = (req as any).post.dat.f_vals[0].service;
        /**
         * note that the path below is applied at BaseService
         * so the path must be set relative to BaseService
         * NOT this controller
         */
        const cPath = `../${(req as any).post.m.toLowerCase()}/services/${service.toLowerCase()}`; // relative to BaseService because it is called from there
        const clsCtx = {
            path: cPath,
            clsName: service,
            action: (req as any).post.a, // all services must implement send
        }
        const ret = await this.b.resolveCls(req, res, clsCtx);
        // this.b.cdResp.data = ret; //?? not tested after new modification
        await this.b.respond(req, res);
    }
}