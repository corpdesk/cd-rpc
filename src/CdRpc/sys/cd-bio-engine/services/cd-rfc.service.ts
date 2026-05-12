import { Request, Response } from "express";
import { CdService } from "../../base/cd.service";
import { BaseService } from "../../base/base.service";
import { CdRfcModel, ICdRfc } from "../models/cd-rfc.model";
import { SessionService } from "../../user/services/session.service";
import { GenericService } from "../../base/generic-service";
import { IExtServiceInput, IQuery, IServiceInput } from "../../base/i-base";

// export class CdRfcService extends CdService {
export class CdRfcService extends GenericService<CdRfcModel> {
  cdToken!: string;
  serviceModel = CdRfcModel;
  docName = "CdRfcService";

  constructor() {
    super(CdRfcModel);
    this.b = new BaseService();
  }

  async create(req: Request, res: Response) {
    console.log("moduleman/create::validateCreate()/01");
    const svSess = new SessionService();
    if (await this.validateCreate(req, res)) {
      await this.beforeCreate(req, res);
      const serviceInput = {
        serviceModel: CdRfcModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create company",
        dSource: 1,
      };
      console.log("CdRfcService::create()/serviceInput:", serviceInput);
      const respData = await this.b.create(
        req as any,
        res as any,
        serviceInput,
      );
      this.b.i.app_msg = "new company created";
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = await respData;
      const r = await this.b.respond(req, res);
    } else {
      console.log("moduleman/create::validateCreate()/02");
      const r = await this.b.respond(req, res);
    }
  }

  async createI(
      req: Request,
      res: Response,
      serviceInputExt: IExtServiceInput<CdRfcModel>,
    ): Promise<CdRfcModel | boolean> {
      serviceInputExt.entityData.cdRfcGuid = this.b.getGuid();
      return await this.b.createI(req, res, serviceInputExt);
    }

  async getRfcContext(req: Request, res: Response, q: IQuery): Promise<ICdRfc[]> {
    const serviceInput = {
      serviceModel: CdRfcModel,
      docName: "CdRfcService::getRfcContext",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };

    const data = await this.b.read(req, res, serviceInput);

    return (data || []).map((r: any) => this.parseRfc(r));
  }

  parseRfc(r: CdRfcModel): ICdRfc {
    return {
      ref: r.ref,
      rfcId: r.rfcId,
      version: r.version,
      rules: JSON.parse(r.rules || "[]"),
      expressions: JSON.parse(r.expressions || "[]"),
      policies: JSON.parse(r.policies || "[]"),
    };
  }

  /**
   * Use BaseService for simple search
   * @param req
   * @param res
   */
  async read(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    return await this.b.read(req, res, serviceInput);
  }

  async update(req: Request, res: Response) {
    // this.logger.logDebug('UserService::update()/01');
    let q = this.b.getQuery(req);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: CdRfcModel,
      docName: "CdRfcService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    // this.logger.logDebug('UserService::update()/02')
    this.b.update$(req, res, serviceInput).subscribe((ret: any) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  beforeUpdate(q: any): any {
    if (q.update.userEnabled === "") {
      q.update.userEnabled = null;
    }
    return q;
  }
}
