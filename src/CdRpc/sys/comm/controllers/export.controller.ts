import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdPdf } from '../../utils/pdf';
import { ExportService } from '../services/export.service';
import { ExportModel } from "../models/export.model";
import { GenericController } from "../../base/generic-controller";

// export class ExportController {
export class ExportController extends GenericController<ExportModel> {
    // b: BaseService;
    service: ExportService;
    constructor(){
        super();
        // this.b = new BaseService();
        this.service = new ExportService();
    }
    
    async Pdf(req: Request, res: Response) {
        console.log('ExportService::Pdf()/01')
        try {
            console.log('ExportService::Pdf()/02')
            const pdf = new CdPdf();
            await this.service.generatePdf(req, res);
        } catch (e: any) {
            this.b.serviceErr(req, res, e, 'ExportService:Pdf');
        }
    }

    // async Print(req: Request, res: Response) {
    //     console.log('ExportService::Print()/01')
    //     try {
    //         console.log('ExportService::Print()/02')
    //         // await this.service.create(req, res);
    //     } catch (e: any) {
    //         this.b.serviceErr(req, res, e, 'ExportService:Print');
    //     }
    // }
}