import { BaseService } from "../../base/base.service";
import { Request, Response } from "express";
import { CdService } from "../../base/cd.service";
import { SessionService } from "../../user/services/session.service";
import { UserService } from "../../user/services/user.service";
import {
  IExtServiceInput,
  IQuery,
  IServiceInput,
  IUser,
} from "../../base/i-base";
import { CompanyModel } from "../models/company.model";
import { CompanyViewModel } from "../models/company-view.model";
import { CompanyTypeModel } from "../models/company-type.model";
import { safeStringify } from "../../utils/safe-stringify";
import { SessionModel } from "../../user/models/session.model";
import { GenericService } from "../../base/generic-service";
import { siGet } from "../../base/base.model";

// export class CompanyService extends CdService {
export class CompanyService extends GenericService<CompanyModel> {
  b: any; // instance of BaseService
  cdToken: string = "";
  srvSess!: SessionService;
  srvUser!: UserService;
  user!: IUser;
  serviceModel = CompanyModel;
  docName: string = "";
  sessModel!: SessionModel;
  // moduleModel: ModuleModel;

  /*
   * create rules
   */
  cRules: any = {
    required: ["companyName", "email", "searchTags", "companyTypeGuid"],
    noDuplicate: ["companyName", "email"],
  };
  uRules: any[] = [];
  dRules: any[] = [];

  constructor() {
    super(CompanyModel);
    this.b = new BaseService();
  }

  /**
     * {
            "ctx": "Sys",
            "m": "Moduleman",
            "c": "Company",
            "a": "Create",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "companyName": "/src/CdApi/sys/moduleman",
                            "companyTypeGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
                            "parentModuleGuid": "00e7c6a8-83e4-40e2-bd27-51fcff9ce63b"
                        }
                    }
                ],
                "token": "3ffd785f-e885-4d37-addf-0e24379af338"
            },
            "args": {}
        }
     * @param req
     * @param res
     */
  async create(req: Request, res: Response) {
    console.log("moduleman/create::validateCreate()/01");
    const svSess = new SessionService();
    if (await this.validateCreate(req, res)) {
      await this.beforeCreate(req, res);
      const serviceInput = {
        serviceModel: CompanyModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create company",
        dSource: 1,
      };
      console.log("CompanyService::create()/serviceInput:", serviceInput);
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

  async createSL(req: Request, res: Response) {
    const svSess = new SessionService();
    await this.b.initSqlite(req, res);
    if (await this.validateCreateSL(req, res)) {
      await this.beforeCreateSL(req, res);
      const serviceInput = {
        serviceInstance: this,
        serviceModel: CompanyModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create Company",
        dSource: 1,
      };
      const result = await this.b.createSL(
        req as any,
        res as any,
        serviceInput,
      );
      this.b.connSLClose();
      this.b.i.app_msg = "";
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = result;
      const r = await this.b.respond(req, res);
    } else {
      const r = await this.b.respond(req, res);
    }
  }

  async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<any>,
  ): Promise<CompanyModel | boolean> {
    return await this.b.createI(req, res, serviceInputExt);
  }

  async companyExists(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<CompanyModel>,
  ): Promise<boolean> {
    // const serviceInput: IServiceInput<any> = {
    //   serviceInstance: this,
    //   serviceModel: CompanyModel,
    //   docName: "CompanyService::companyExists",
    //   cmd: {
    //     action: "find",
    //     query: q,
    //   },
    //   dSource: 1,
    // };
    return this.b.read(req, res, serviceInput);
  }

  async beforeCreate(req: Request, res: Response): Promise<any> {
    this.b.setPlData(req, { key: "companyGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "companyEnabled", value: true });
    return true;
  }

  async beforeCreateSL(req: Request, res: Response): Promise<any> {
    this.b.setPlData(req, { key: "companyGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "companyEnabled", value: true });
    return true;
  }

  async read(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    //
  }

  async readSL(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    await this.b.initSqlite(req, res);
    const q = this.b.getQuery(req);
    console.log("CompanyService::getCompany/q:", q);
    try {
      this.b
        .readSL$(req, res, serviceInput)
        .subscribe((r: CompanyTypeModel) => {
          // console.log('CompanyService::read$()/r:', r)
          this.b.i.code = "CompanyService::Get";
          const svSess = new SessionService();
          svSess.sessResp.cd_token = (req as any).post.dat.token;
          svSess.sessResp.ttl = svSess.getTtl();
          this.b.setAppState(true, this.b.i, svSess.sessResp);
          this.b.cdResp.data = r;
          this.b.connSLClose();
          this.b.respond(req, res);
        });
    } catch (e: any) {
      console.log("CompanyService::read$()/e:", e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: "CompanyService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  // update(req: Request, res: Response) {
  //   // console.log('CompanyService::update()/01');
  //   let q = this.b.getQuery(req);
  //   q = this.beforeUpdate(q);
  //   const serviceInput = {
  //     serviceModel: CompanyModel,
  //     docName: "CompanyService::update",
  //     cmd: {
  //       action: "update",
  //       query: q,
  //     },
  //     dSource: 1,
  //   };
  //   // console.log('CompanyService::update()/02')
  //   this.b.update$(req, res, serviceInput).subscribe((ret: any) => {
  //     this.b.cdResp.data = ret;
  //     this.b.respond(req, res);
  //   });
  // }
  async update(req: Request, res: Response): Promise<void> {
    // this.logger.logDebug('CompanyService::update()/01');
    let q = this.b.getQuery(req as any);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: CompanyModel,
      docName: "CompanyService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    // this.logger.logDebug('CompanyService::update()/02')
    this.b.update$(req, res, serviceInput).subscribe((ret: any) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  updateSL(req: Request, res: Response) {
    console.log("CompanyService::update()/01");
    let q = this.b.getQuery(req);
    q = this.beforeUpdateSL(q);
    const serviceInput = {
      serviceModel: CompanyModel,
      docName: "CompanyService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    console.log("CompanyService::update()/02");
    this.b
      .updateSL$(req, res, serviceInput)
      .subscribe((ret: any) => {
        this.b.cdResp.data = ret;
        this.b.connSLClose();
        this.b.respond(req, res);
      });
  }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  beforeUpdate(q: any) {
    if (q.update.companyEnabled === "") {
      q.update.companyEnabled = null;
    }
    return q;
  }

  beforeUpdateSL(q: any) {
    if (q.update.billEnabled === "") {
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
    console.log("moduleman/CompanyService::validateCreate()/01");
    const svSess = new SessionService();
    ///////////////////////////////////////////////////////////////////
    // 1. Validate against duplication
    const params = {
      controllerInstance: this,
      model: CompanyModel,
    };
    this.b.i.code = "CompanyService::validateCreate";
    await this.setCoopType(req, res);
    let ret = false;
    if (await this.b.validateUnique(req, res, params)) {
      console.log("moduleman/CompanyService::validateCreate()/02");
      if (await this.b.validateRequired(req, res, this.cRules)) {
        console.log("moduleman/CompanyService::validateCreate()/03");
        ret = true;
      } else {
        console.log("moduleman/CompanyService::validateCreate()/04");
        ret = false;
        this.b.i.app_msg = `the required fields ${this.b.isInvalidFields.join(", ")} is missing`;
        this.b.err.push(this.b.i.app_msg);
        this.b.setAppState(false, this.b.i, svSess.sessResp);
      }
    } else {
      console.log("moduleman/CompanyService::validateCreate()/05");
      ret = false;
      this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(", ")} is not allowed`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
    }
    console.log("moduleman/CompanyService::validateCreate()/06");
    ///////////////////////////////////////////////////////////////////
    // 2. confirm the companyTypeGuid referenced exists
    const pl: CompanyModel = this.b.getPlData(req);
    if ("companyTypeGuid" in pl) {
      console.log("moduleman/CompanyService::validateCreate()/07");
      console.log("moduleman/CompanyService::validateCreate()/pl:", pl);
      const serviceInput = {
        serviceModel: CompanyTypeModel,
        docName: "CompanyService::validateCreate",
        cmd: {
          action: "find",
          query: { where: { companyTypeGuid: pl.companyTypeGuid } },
        },
        dSource: 1,
      };
      console.log(
        "moduleman/CompanyService::validateCreate()/serviceInput:",
        JSON.stringify(serviceInput),
      );
      const r: any = await this.b.read(req, res, serviceInput);
      console.log("moduleman/CompanyService::validateCreate()/r:", r);
      if (r.length > 0) {
        console.log("moduleman/CompanyService::validateCreate()/08");
        ret = true;
      } else {
        console.log("moduleman/CompanyService::validateCreate()/10");
        ret = false;
        this.b.i.app_msg = `company type reference is invalid`;
        this.b.err.push(this.b.i.app_msg);
        this.b.setAppState(false, this.b.i, svSess.sessResp);
      }
    } else {
      console.log("moduleman/CompanyService::validateCreate()/11");
      // this.b.i.app_msg = `parentModuleGuid is missing in payload`;
      // this.b.err.push(this.b.i.app_msg);
      //////////////////
      this.b.i.app_msg = `companyTypeGuid is missing in payload`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
    }
    console.log("CompanyService::getCompany/12");
    if (this.b.err.length > 0) {
      console.log("moduleman/CompanyService::validateCreate()/13");
      ret = false;
    }
    return ret;
  }

  async setCoopType(req: Request, res: Response) {
    // get payload
    const pl: CompanyModel = this.b.getPlData(req);

    // If companyTypeGuid is provided but companyTypeId is missing or falsy
    if (pl.companyTypeGuid && !pl.companyTypeId) {
      const q = { where: { companyTypeGuid: pl.companyTypeGuid } };
      const compResp: CompanyTypeModel[] = await this.getCompanyTypeI(
        req,
        res,
        q,
      );

      if (compResp.length > 0) {
        // Set companyTypeId in payload
        this.b.setPlData(req, {
          key: "companyTypeId",
          value: compResp[0].companyTypeId,
        });
      }
    }

    // If companyTypeId is provided but companyTypeGuid is missing or falsy
    if (pl.companyTypeId && !pl.companyTypeGuid) {
      const q = { where: { companyTypeId: pl.companyTypeId } };
      const compResp: CompanyTypeModel[] = await this.getCompanyTypeI(
        req,
        res,
        q,
      );

      if (compResp.length > 0) {
        // Set companyTypeGuid in payload
        this.b.setPlData(req, {
          key: "companyTypeGuid",
          value: compResp[0].companyTypeGuid,
        });
      }
    }
  }

  async validateCreateSL(req: Request, res: Response) {
    return true;
  }

  async getCompany(
    req: Request,
    res: Response,
    q: IQuery | null = null,
  ): Promise<any> {
    const serviceInput: IServiceInput<CompanyModel> = {
      serviceModel: CompanyModel,
      modelName: "CompanyModel",
      docName: "CompanyService::get",
      cmd: {
        action: "find",
        query: {} as IQuery,
      },
      dSource: 1,
    };
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("CompanyService::getCompany/f:", q);
    (serviceInput.cmd as any).query = q;

    try {
      const r = await this.b.read(req, res, serviceInput);
      this.b.successResponse(req, res, r);
    } catch (e: any) {
      console.log("CompanyService::read$()/e:", e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  async getCompanyI(
    req: Request,
    res: Response,
    q: IQuery | null = null,
  ): Promise<any> {
    const serviceInput: IServiceInput<CompanyModel> = {
      serviceModel: CompanyModel,
      modelName: "CompanyModel",
      docName: "CompanyService::get",
      cmd: {
        action: "find",
        query: {} as IQuery,
      },
      dSource: 1,
    };
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("CompanyService::getCompany/f:", q);
    (serviceInput.cmd as any).query = q;
    try {
      return await this.b.read(req, res, serviceInput);
    } catch (e: any) {
      console.log("CompanyService::read$()/e:", e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      return [];
    }
  }

  async getCompanySL(req: Request, res: Response) {
    await this.b.initSqlite(req, res);
    const q = this.b.getQuery(req);
    console.log("CompanyService::getCompany/q:", q);
    const serviceInput = siGet(q as any, this);
    try {
      this.b
        .readSL$(req, res, serviceInput)
        .subscribe((r: CompanyModel) => {
          // console.log('CompanyService::read$()/r:', r)
          this.b.i.code = "CompanyService::Get";
          const svSess = new SessionService();
          svSess.sessResp.cd_token = (req as any).post.dat.token;
          svSess.sessResp.ttl = svSess.getTtl();
          this.b.setAppState(true, this.b.i, svSess.sessResp);
          this.b.cdResp.data = r;
          this.b.connSLClose();
          this.b.respond(req, res);
        });
    } catch (e: any) {
      console.log("CompanyService::read$()/e:", e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: "CompanyService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  getCompanyType(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("CompanyService::getCompany/f:", q);
    const serviceInput = {
      serviceModel: CompanyTypeModel,
      docName: "CompanyService::getCompanyType$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b
        .read$(req, res, serviceInput)
        .subscribe((r: CompanyTypeModel) => {
          // console.log('CompanyService::read$()/r:', r)
          this.b.i.code = "CompanyController::Get";
          const svSess = new SessionService();
          svSess.sessResp.cd_token = (req as any).post.dat.token;
          svSess.sessResp.ttl = svSess.getTtl();
          this.b.setAppState(true, this.b.i, svSess.sessResp);
          this.b.cdResp.data = r;
          this.b.respond(req, res);
        });
    } catch (e: any) {
      console.log("CompanyService::read$()/e:", e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
    }
  }

  getCompanyTypeI(
    req: Request,
    res: Response,
    q: IQuery | null = null,
  ): CompanyTypeModel[] {
    if (!q) {
      q = this.b.getQuery(req);
    }
    console.log("CompanyService::getCompanyTypeI/f:", q);
    const serviceInput = {
      serviceModel: CompanyTypeModel,
      docName: "CompanyService::getCompanyTypeI$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      return this.b.read(req, res, serviceInput);
    } catch (e: any) {
      console.log("CompanyService::getCompanyTypeI$()/e:", e);
      this.b.err.push((e as Error).toString());
      const i = {
        messages: this.b.err,
        code: "CompanyService:getCompanyTypeI",
        app_msg: "",
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
      return [];
    }
  }

  getCompanyCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("CompanyService::getCompanyCount/q:", q);
    const serviceInput = {
      serviceModel: CompanyViewModel,
      docName: "CompanyService::getCompanyCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b
      .readCount$(req, res, serviceInput)
      .subscribe((r: number) => {
        this.b.i.code = "CompanyController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
  }

  getCompanyQB(req: Request, res: Response) {
    console.log("CompanyService::getCompanyQB()/1");
    this.b.entityAdapter.registerMappingFromEntity(CompanyViewModel);
    const q = this.b.getQuery(req);
    // console.log('MenuService::getModuleCount/q:', q);
    const serviceInput = {
      serviceModel: CompanyViewModel,
      docName: "CompanyService::getCompanyQB",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };

    this.b
      .readQB$(req, res, serviceInput)
      .subscribe((r: CompanyViewModel) => {
        this.b.i.code = serviceInput.docName;
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
  }

  getPagedSL(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("CompanyService::getCompanyCount()/q:", q);
    const serviceInput = {
      serviceModel: CompanyModel,
      docName: "CompanyService::getCompanyCount",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b
      .readCountSL$(req, res, serviceInput)
      .subscribe((r: number) => {
        this.b.i.code = "CompanyService::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.connSLClose();
        this.b.respond(req, res);
      });
  }

  getCompanyTypeCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("CompanyService::getCompanyCount/q:", q);
    const serviceInput = {
      serviceModel: CompanyTypeModel,
      docName: "CompanyService::getCompanyCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b
      .readCount$(req, res, serviceInput)
      .subscribe((r: number) => {
        this.b.i.code = "CompanyController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const q = this.b.getQuery(req);
    console.log("CompanyService::delete()/q:", q);
    const serviceInput = {
      serviceModel: CompanyModel,
      docName: "CompanyService::delete",
      cmd: {
        action: "delete",
        query: q,
      },
      dSource: 1,
    };

    this.b
      .delete$(req, res, serviceInput)
      .subscribe((ret: any) => {
        this.b.cdResp.data = ret;
        this.b.respond(req, res);
      });
  }

  deleteSL(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("CompanyService::deleteSL()/q:", q);
    const serviceInput = {
      serviceModel: CompanyModel,
      docName: "CompanyService::deleteSL",
      cmd: {
        action: "delete",
        query: q,
      },
      dSource: 1,
    };

    this.b
      .deleteSL$(req, res, serviceInput)
      .subscribe((ret: any) => {
        this.b.cdResp.data = ret;
        this.b.respond(req, res);
      });
  }
}
