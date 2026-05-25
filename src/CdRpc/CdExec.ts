// src/CdRpc/CdExec.ts
import { Request, Response } from "express";
import { BaseService } from './sys/base/base.service';
import { IRespInfo } from './sys/base/i-base';
import { Logging } from "./sys/base/winston.log";
// import { Logging } from './sys/base/winston.log';

export class CdExec {
    b: BaseService<any>;
    logger: Logging;
    constructor() {
        this.b = new BaseService();
        this.logger = new Logging();
    }
    async exec(req: Request, res: Response, ds=null) {
        this.logger.logInfo('CdExec::exec()/01');
        if (await this.b.valid(req, res)) {
            this.logger.logInfo('CdExec::exec()/02');
            try {
                const pl = (req as any).post; // payload;
                const ePath = this.b.entryPath(pl);
                const clsCtx = {
                    path: ePath,
                    clsName: `${pl.c}Controller`,
                    action: pl.a,
                    dataSource: ds
                }
                // this.logger.logInfo('CdExec::exec()/clsCtx:', clsCtx)
                return await this.b.resolveCls(req, res, clsCtx);
            } catch (e: any) {
                this.logger.logInfo('CdExec::exec()/03');
                const i: IRespInfo = {
                    messages: e,
                    code: 'CdExec:exec:01',
                    app_msg: ''
                }
                return await this.b.returnErr(req, res, i);
            }
        } else {
            this.logger.logInfo('CdExec::exec()/04');
            this.b.err.push('invalid request');
            const i: IRespInfo = {
                messages: this.b.err,
                code: 'CdExec:exec:02',
                app_msg: ''
            }
            await this.b.returnErr(req, res, i);
        }
    }
}