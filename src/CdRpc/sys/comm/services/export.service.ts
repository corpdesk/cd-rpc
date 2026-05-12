import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { SessionService } from '../../user/services/session.service';
import { CdPdf } from '../../utils/pdf';
import { GenericService } from "../../base/generic-service";
import { ExportModel } from "../models/export.model";

// export class ExportService {
export class ExportService extends GenericService<ExportModel> {
    // b: BaseService;
    cdToken!: string;
    serviceModel = ExportModel;
    docName: string = "ExportService";

    constructor() {
        super(ExportModel);
    }
    
    async generatePdf(req: Request, res: Response) {
        const svSess = new SessionService();
        const pdf = new CdPdf();
        const ret = await pdf.fromHtml(req, res);
        // save print records
        const serviceInput = {
            serviceInstance: this,
            serviceModel: ExportModel,
            serviceModelInstance: this.serviceModel,
            docName: 'Generate Pdf',
            dSource: 1,
        }
        // const result = await this.b.create(req, res, serviceInput)
        this.b.i.app_msg = '';
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = [];
        const r = await this.b.respond(req, res);
    }
}