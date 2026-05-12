import qs from 'qs';
import { Request, Response } from 'express';
import { DEFAULT_CD_REQUEST, DEFAULT_CD_RESPONSE } from '../base/i-base';
import { Logging } from '../base/winston.log';

export class CdRequest {
    logger: Logging;
    constructor() {
        this.logger = new Logging()
    }

    async processPost(req: Request, resp: Response, callback: () => void) {
        this.logger.logInfo('CdRequest::processPost()/01')
        let queryData = '';
        let contentType;
        let jQueryData;
        if (req.method === 'POST') {
            this.logger.logInfo('CdRequest::processPost()/02')
            contentType = req.headers['content-type'];
            // this.logger.logInfo('CdRequest::processPost():', { pl: req.body })
            // this.logger.logInfo('CdRequest::processPost():', { contentType: contentType })
            (req as any).post = req.body


            const inp = await (req as any).post;
            callback();

        } else {
            this.logger.logInfo('CdRequest::processPost()/04')
            return {};
        }
    }


}

// function getCircularReplacer() {
//     const seen = new WeakSet();
//     return (key, value) => {
//         if (typeof value === "object" && value !== null) {
//             if (seen.has(value)) {
//                 return;
//             }
//             seen.add(value);
//         }
//         return value;
//     };
// }



