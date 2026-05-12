import { Request, Response } from "express";
import { BaseService } from "../../base/base.service";
import { CdController } from "../../base/cd.controller";
import { CdRfcService } from "../services/cd-rfc.service";
import { CdRfcModel } from "../models/cd-rfc.model";
import { GenericController } from "../../base/generic-controller";

// export class CdBioEngineController extends CdController {
export class CdRfcController extends GenericController<CdRfcModel> {
  // b: BaseService;
  service!: CdRfcService;

  constructor() {
    super();
    this.b = new BaseService();
    this.service = new CdRfcService();
  }

  async GetRfcContext(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    const data = await this.service.getRfcContext(req, res, q);
    this.b.successResponse(req, res, data);
  }
}
