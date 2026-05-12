import { Request, Response } from "express";
// import { BaseService } from "../../base/base.service";
// import { GenericController } from "../../base/generic-controller";
// import { CdBioEngineDnaService } from "../services/cd-bio-engine-dna.service";
import { CdBioEngineDnaModel } from "../models/cd-bio-engine-dna.model";
import { GenericController } from "../../../sys/base/generic-controller";
import { BaseService } from "../../../sys/base/base.service";
import { CdBioEngineDnaService } from "../services/cd-bio-engine.service";

export class CdBioEngineDnaController extends GenericController<CdBioEngineDnaModel> {

  b: BaseService<CdBioEngineDnaModel>;
  service: CdBioEngineDnaService;

  constructor() {
    super();
    this.b = new BaseService();
    this.service = new CdBioEngineDnaService();
  }

  // ─────────────────────────────
  // GET
  // ─────────────────────────────
  async Get(req: Request, res: Response) {
    try {
      await this.service.get(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "CdBioEngineDnaController:Get");
    }
  }

  
  async Update(req: Request, res: Response) {
    try {
      await this.service.update(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "CdBioEngineDnaController:Update");
    }
  }

  // ─────────────────────────────
  // UPDATE DNA
  // ─────────────────────────────
  async UpdateCdBioEngineDna(req: Request, res: Response) {
    try {
      await this.service.updateCdBioEngineDna(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "CdBioEngineDnaController:Update");
    }
  }

  async JGet(req: Request, res: Response) {
    try {
      await this.service.jGet(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "CdBioEngineDnaController:Get");
    }
  }
}