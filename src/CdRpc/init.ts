import { Request, Response } from "express";
import { CdRequest } from './sys/utils/request';
const cdr = new CdRequest()
import { CdExec } from './CdExec';
export async function CdInit(req: Request, res: Response, ds?:any) {
    const r = await cdr.processPost(req, res, async () => {
        const cb = new CdExec();
        await cb.exec(req, res, ds);
    });
};


