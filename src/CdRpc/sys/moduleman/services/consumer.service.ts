/**
 * Entity that consumes corpdesk services is refered to as consumer
 * Resources that the consumer has subscribed to are consumerResources
 * An entity can consume resources are root, developer, user etc. These are managed by consumerTypes
 */
import { Request, Response } from "express";
import { cloneDeep } from "lodash";
import { BaseService } from "../../base/base.service";
import { CdService } from "../../base/cd.service";
import { SessionService } from "../../user/services/session.service";
import { UserService } from "../../user/services/user.service";
// import { ModuleModel } from '../models/module.model';
import {
  CdFxReturn,
  ICdResponse,
  IExtServiceInput,
  IQuery,
  IRespInfo,
  IServiceInput,
  IUser,
  JSDPInstruction,
} from "../../base/i-base";
import {
  ConsumerModel,
  consumerProfileDefault,
  IConsumerProfile,
  IConsumerShellConfig,
} from "../models/consumer.model";
// import { ModuleViewModel } from '../models/module-view.model';
import { ConsumerViewModel } from "../models/consumer-view.model";
import { ConsumerTypeModel } from "../models/consumer-type.model";
import { Observable } from "rxjs";
import { ConsumerResourceViewModel } from "../models/consumer-resource-view.model";
import { CompanyViewModel } from "../models/company-view.model";
import { CompanyModel } from "../models/company.model";
import { CompanyService } from "./company.service";
import { Logging } from "../../base/winston.log";
import { ProfileServiceHelper } from "../../utils/profile-service-helper";
import { inspect } from "util";
import { GenericService } from "../../base/generic-service";
import { SessionModel } from "../../user/models/session.model";
import { UpdateResult } from "typeorm";
import { UserModel } from "../../user/models/user.model";
// import { ConsumerViewModel } from '../models/consumer-view.model';

// export class ConsumerService extends CdService<ConsumerModel> {
export class ConsumerService extends GenericService<ConsumerModel> {
  logger!: Logging;
  b: any; // instance of BaseService
  cdToken: string = "";
  srvSess!: SessionService;
  srvUser!: UserService;
  user!: IUser;
  serviceModel = ConsumerModel;
  sessModel!: SessionModel;
  // moduleModel: ModuleModel;
  company!: CompanyModel;

  docName: string = "";

  /*
   * create rules
   */
  cRules: any = {
    required: ["companyId"],
    noDuplicate: ["companyId"],
  };
  uRules: any[] = [];
  dRules: any[] = [];

  constructor() {
    super(ConsumerModel);
    this.b = new BaseService();
    this.logger = new Logging();
    // this.serviceModel = new ConsumerModel();
    // this.moduleModel = new ModuleModel();
  }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Consumer",
  //         "a": "Create",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "data": {
  //                         "consumerGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
  //                     }
  //                 }
  //             ],
  //             "token": "3ffd785f-e885-4d37-addf-0e24379af338"
  //         },
  //         "args": {}
  //     }
  //  * @param req
  //  * @param res
  //  */
  async create(req: Request, res: Response) {
    this.logger.logInfo("ConsumerServices/create::validateCreate()/01");
    const svSess = new SessionService();
    if (await this.validateCreate(req, res)) {
      await this.beforeCreate(req, res);
      const serviceInput = {
        serviceModel: ConsumerModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create consumer",
        dSource: 1,
      };
      this.logger.logInfo(
        "ConsumerService::create()/serviceInput:",
        serviceInput,
      );
      const respData = await this.b.create(
        req as any,
        res as any,
        serviceInput,
      );
      this.b.i.app_msg = "new consumer created";
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = await respData;
      const r = await this.b.respond(req, res);
    } else {
      this.logger.logInfo("moduleman/create::validateCreate()/02");
      const r = await this.b.respond(req, res);
    }
  }

  async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<any>,
  ): Promise<ConsumerModel | boolean> {
    return await this.b.createI(req, res, serviceInputExt);
  }

  async consumerExists(
    req: Request,
    res: Response,
    q: IQuery,
  ): Promise<boolean> {
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: "ConsumerService::consumerExists",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    return this.b.read(req, res, serviceInput);
  }

  async beforeCreate(req: Request, res: Response): Promise<any> {
    const pl: ConsumerModel = this.b.getPlData(req);
    this.logger.logInfo("moduleman/create::beforeCreate()/pl:", pl);
    this.logger.logInfo(
      "moduleman/create::beforeCreate()/this.company:",
      this.company,
    );
    this.b.setPlData(req, {
      key: "consumerName",
      value: this.company.companyName,
    });
    this.b.setPlData(req, {
      key: "companyGuid",
      value: this.company.companyGuid,
    });
    this.b.setPlData(req, { key: "companyId", value: pl.companyId });
    this.b.setPlData(req, { key: "consumerGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "consumerEnabled", value: true });
    return true;
  }

  async getCompanyData(
    req: Request,
    res: Response,
    consGuid: string,
  ): Promise<CompanyModel[]> {
    const svCompany = new CompanyService();
    console.log("moduleman/create::getCompanyData()/coGuid:", consGuid);
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: "CompanyService::getCompanyData",
      cmd: {
        action: "find",
        query: { where: { consumerGuid: consGuid } },
      },
      dSource: 1,
    };
    const consumerData: ConsumerModel[] = await this.b.read(
      req,
      res,
      serviceInput,
    );
    console.log(
      "moduleman/create::getCompanyData()/consumerData:",
      consumerData,
    );
    if (!consumerData || consumerData.length === 0) {
      return [];
    } else {
      return await svCompany.getCompanyI(req, res, {
        where: { companyId: consumerData[0].companyId },
      });
    }
  }

  async read(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    //
  }

  async update(req: Request, res: Response) {
    // this.logger.logInfo('ConsumerService::update()/01');
    let q = this.b.getQuery(req);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: ConsumerModel,
      docName: "ConsumerService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    // this.logger.logInfo('ConsumerService::update()/02')
    this.b.update$(req, res, serviceInput).subscribe((ret: ICdResponse) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  // async updateI(req: Request, res: Response, serviceInput: IServiceInput<any>) {
  //   return await this.b.update(req, res, serviceInput);
  // }
  // async updateI(
  //   req: Request,
  //   res: Response,
  //   serviceInputExt: IExtServiceInput<ConsumerModel>,
  // ): Promise<CdFxReturn<UpdateResult> | UpdateResult | ICdResponse> {
  //   return await this.b.updateI(req, res, serviceInputExt);
  // }

  async updateI(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<ConsumerModel>,
  ): Promise<any> {
    console.log("ConsumerService::updateI()/01");

    // Check if cmd exists before assignment
    if (serviceInput.cmd) {
      serviceInput.cmd.query = this.beforeUpdate(
        serviceInput.cmd.query as IQuery,
      );
    }

    serviceInput = {
      serviceModel: ConsumerModel,
      docName: "ConsumerService::updateI",
      cmd: {
        action: "update",
        query: serviceInput.cmd?.query as IQuery,
      },
      dSource: 1,
    };
    console.log("ConsumerService::updateI()/02");
    return this.b.update(req, res, serviceInput);
  }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  beforeUpdate(q: any) {
    if (q.update.consumerEnabled === "") {
      q.update.consumerEnabled = null;
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
    this.logger.logInfo("moduleman/ConsumerService::validateCreate()/01");
    const svSess = new SessionService();
    ///////////////////////////////////////////////////////////////////
    // 1. Validate against duplication
    const params = {
      controllerInstance: this,
      model: ConsumerModel,
    };
    this.b.i.code = "ConsumerService::validateCreate";
    let ret = false;
    if (await this.b.validateUnique(req, res, params)) {
      this.logger.logInfo("moduleman/ConsumerService::validateCreate()/02");
      if (await this.b.validateRequired(req, res, this.cRules)) {
        this.logger.logInfo("moduleman/ConsumerService::validateCreate()/03");
        ret = true;
      } else {
        this.logger.logInfo("moduleman/ConsumerService::validateCreate()/04");
        ret = false;
        this.b.i.app_msg = `the required fields ${this.b.isInvalidFields.join(
          ", ",
        )} is missing`;
        this.b.err.push(this.b.i.app_msg);
        this.b.setAppState(false, this.b.i, svSess.sessResp);
      }
    } else {
      this.logger.logInfo("moduleman/ConsumerService::validateCreate()/05");
      ret = false;
      this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(
        ", ",
      )} is not allowed`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
    }
    this.logger.logInfo("moduleman/ConsumerService::validateCreate()/06");
    ///////////////////////////////////////////////////////////////////
    // // 2. confirm the consumerTypeGuid referenced exists
    const pl: ConsumerModel = this.b.getPlData(req);
    this.logger.logInfo("moduleman/ConsumerService::validateCreate()/pl:", pl);
    if ("companyId" in pl) {
      this.logger.logInfo("moduleman/ConsumerService::validateCreate()/07");
      this.logger.logInfo(
        "moduleman/ConsumerService::validateCreate()/pl:",
        pl,
      );
      const serviceInput = {
        serviceModel: CompanyModel,
        docName: "ConsumerService::validateCreate",
        cmd: {
          action: "find",
          query: { where: { companyId: pl.companyId } },
        },
        dSource: 1,
      };
      this.logger.logInfo(
        "moduleman/ConsumerService::validateCreate()/serviceInput:",
        serviceInput,
      );
      const r: any = await this.b.read(req, res, serviceInput);
      this.company = r[0];
      this.logger.logInfo("moduleman/ConsumerService::validateCreate()/r:", r);
      if (r.length > 0) {
        this.logger.logInfo("moduleman/ConsumerService::validateCreate()/08");
        ret = true;
      } else {
        this.logger.logInfo("moduleman/ConsumerService::validateCreate()/10");
        ret = false;
        this.b.i.app_msg = `company reference is invalid`;
        this.b.err.push(this.b.i.app_msg);
        this.b.setAppState(false, this.b.i, svSess.sessResp);
      }
    } else {
      this.logger.logInfo("moduleman/ConsumerService::validateCreate()/11");
      // this.b.i.app_msg = `parentModuleGuid is missing in payload`;
      // this.b.err.push(this.b.i.app_msg);
      //////////////////
      this.b.i.app_msg = `companyGuid is missing in payload`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
    }
    this.logger.logInfo("ConsumerService::getConsumer/12");
    if (this.b.err.length > 0) {
      this.logger.logInfo("moduleman/ConsumerService::validateCreate()/13");
      ret = false;
    }
    return ret;
  }

  async getI(req: Request, res: Response, q?: IQuery): Promise<any> {
    if (q == null) {
      q = this.b.getQuery(req);
    }
    this.logger.logDebug("ConsumerService::getI/q:", inspect(q, { depth: 4 }));
    const serviceInput = {
      serviceModel: ConsumerModel,
      docName: "ConsumerService::getI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      return this.b.read(req, res, serviceInput);
    } catch (e: any) {
      this.logger.logDebug("ConsumerService::getI()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "ConsumerService:getI",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  async getConsumer(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("ConsumerService::getConsumer/f:", q);
    const serviceInput = {
      serviceModel: ConsumerViewModel,
      docName: "ConsumerService::getConsumer$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b
        .read$(req, res, serviceInput)
        .subscribe((r: ConsumerModel[]) => {
          this.logger.logInfo("ConsumerService::read$()/r:", r);
          this.b.i.code = "ConsumerController::Get";
          const svSess = new SessionService();
          svSess.sessResp.cd_token = (req as any).post.dat.token;
          svSess.sessResp.ttl = svSess.getTtl();
          this.b.setAppState(true, this.b.i, svSess.sessResp);
          this.b.cdResp.data = r;
          this.b.respond(req, res);
        });
    } catch (e: any) {
      this.logger.logInfo("ConsumerService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  getConsumerI(
    req: Request,
    res: Response,
    q: IQuery,
  ): Promise<ConsumerModel[]> {
    this.logger.logInfo("ConsumerService::getConsumerI()/query:", { query: q });
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: "ConsumerService::getConsumerI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    return this.b.read(req, res, serviceInput);
  }

  async getConsumerType(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("ConsumerService::getConsumer/f:", q);
    const serviceInput = {
      serviceModel: ConsumerTypeModel,
      docName: "ConsumerService::getConsumerType$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b
        .read$(req, res, serviceInput)
        .subscribe((r: ConsumerTypeModel[]) => {
          this.logger.logInfo("ConsumerService::read$()/r:", r);
          this.b.i.code = "ConsumerController::Get";
          const svSess = new SessionService();
          svSess.sessResp.cd_token = (req as any).post.dat.token;
          svSess.sessResp.ttl = svSess.getTtl();
          this.b.setAppState(true, this.b.i, svSess.sessResp);
          this.b.cdResp.data = r;
          this.b.respond(req, res);
        });
    } catch (e: any) {
      this.logger.logInfo("ConsumerService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  getConsumerCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("ConsumerService::getConsumerCount/q:", q);
    const serviceInput = {
      serviceModel: ConsumerViewModel,
      docName: "ConsumerService::getConsumerCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b
      .readCount$(req, res, serviceInput)
      .subscribe((r: any) => {
        this.b.i.code = "ConsumerController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
  }

  getConsumerQB(req: Request, res: Response) {
    console.log("ConsumerService::getConsumerQB()/1");
    this.b.entityAdapter.registerMappingFromEntity(ConsumerViewModel);
    const q = this.b.getQuery(req);
    // console.log('MenuService::getModuleCount/q:', q);
    const serviceInput = {
      serviceModel: ConsumerViewModel,
      docName: "ConsumerService::getConsumerQB",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };

    this.b.readQB$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = serviceInput.docName;
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  getConsumerTypeCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("ConsumerService::getConsumerCount/q:", q);
    const serviceInput = {
      serviceModel: ConsumerTypeModel,
      docName: "ConsumerService::getConsumerCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b
      .readCount$(req, res, serviceInput)
      .subscribe((r: any) => {
        this.b.i.code = "ConsumerController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
  }

  // delete(req: Request, res: Response) {
  //   const q = this.b.getQuery(req);
  //   this.logger.logInfo("ConsumerService::delete()/q:", q);
  //   const serviceInput = {
  //     serviceModel: ConsumerModel,
  //     docName: "ConsumerService::delete",
  //     cmd: {
  //       action: "delete",
  //       query: q,
  //     },
  //     dSource: 1,
  //   };

  //   this.b.delete$(req, res, serviceInput).subscribe((ret: any) => {
  //     this.b.cdResp.data = ret;
  //     this.b.respond(req, res);
  //   });
  // }

  async delete(req: Request, res: Response): Promise<void> {
    const q = this.b.getQuery(req as any);
    this.logger.logDebug("ConsumerService::delete()/q:", q);
    const serviceInput = {
      serviceModel: ConsumerModel,
      docName: "ConsumerService::delete",
      cmd: {
        action: "delete",
        query: q,
      },
      dSource: 1,
    };

    this.b.delete$(req, res, serviceInput).subscribe((ret: any) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  getConsumerByGuid$(
    req: Request,
    res: Response,
    consmGuid: string,
  ): Observable<ConsumerModel[]> {
    // this.logger.logInfo('starting getConsumerByGuid(req, res, consmGuid)');
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: "ConsumerService::getConsumerByGuid",
      cmd: {
        action: "find",
        query: { where: { consumerGuid: consmGuid } },
      },
      dSource: 1,
    };
    return this.b.read$(req, res, serviceInput);
  }

  async getConsumerByGuid(
    req: Request,
    res: Response,
    consmGuid: string,
  ): Promise<any> {
    // this.logger.logInfo('starting getConsumerByGuid(req, res, consmGuid)');
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: "ConsumerService::getConsumerByGuid",
      cmd: {
        action: "find",
        query: { where: { consumerGuid: consmGuid } },
      },
      dSource: 1,
    };
    return this.b.read(req, res, serviceInput);
  }

  async getIDByGuid(consumerGuid: string): Promise<any> {
    return [{}];
  }

  async isConsumerResource(
    req: Request,
    res: Response,
    params: any,
  ): Promise<boolean> {
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: ConsumerResourceViewModel,
      docName: "ConsumerService::isConsumerResource",
      cmd: {
        action: "count",
        query: { where: params },
      },
      dSource: 1,
    };
    const result = await this.b.read(req, res, serviceInput);
    if (result > 0) {
      return true;
    } else {
      return false;
    }
  }

  getConsumerGuid(req: Request): string {
    this.logger.logInfo(
      "ConsumerService::getConsumerGuid()/(req as any).post",
      (req as any).post,
    );
    return (req as any).post.dat.f_vals[0].data.consumerGuid;
  }

  async consumerGuidIsValid(
    req: Request,
    res: Response,
    consumerGuid?: string,
  ): Promise<boolean> {
    this.logger.logInfo("ConsumerService::consumerGuidIsValid()/01");
    const svConsumer = new ConsumerService();
    let consGuid = null;
    if (consumerGuid) {
      this.logger.logInfo("ConsumerService::consumerGuidIsValid()/02");
      const plData = await this.b.getPlData(req);
      consGuid = plData.consumerGuid;
    } else {
      this.logger.logInfo("ConsumerService::consumerGuidIsValid()/03");
      consGuid = this.b.getReqToken(req);
    }
    const consumerData: ConsumerModel[] = await svConsumer.getConsumerByGuid(
      req,
      res,
      consGuid,
    );
    if (consumerData.length > 0) {
      this.logger.logInfo("ConsumerService::consumerGuidIsValid()/04");
      return true;
    } else {
      this.logger.logInfo("ConsumerService::consumerGuidIsValid()/05");
      return false;
    }
  }

  async activeCompany(req: Request, res: Response) {
    //use token to get consumer_guid
    const svConsumer = new ConsumerService();
    const svCompany = new CompanyService();
    const svSess = new SessionService();
    const consumerData: ConsumerModel[] = await this.getConsumerGuidByToken(
      req,
      res,
    );
    this.logger.logInfo(
      "ConsumerService::activeCompany()/consumerData:",
      consumerData,
    );
    let companyData = [];
    let companyGuid = null;
    let coId = null;
    if (consumerData.length > 0) {
      this.logger.logInfo(
        "ConsumerService::activeCompany()/consumerData[0].companyId:",
        { companyId: consumerData[0].companyId },
      );
      coId = consumerData[0].companyId;
      return await svCompany.getCompany(req, res, {
        where: { companyId: coId },
      });
    } else {
      return Promise.resolve([]);
    }
  }

  async activeConsumer(req: Request, res: Response) {
    //use token to get consumer_guid
    const svConsumer = new ConsumerService();
    const svCompany = new CompanyService();
    const svSess = new SessionService();
    const consumerData: ConsumerModel[] = await this.getConsumerGuidByToken(
      req,
      res,
    );
    this.logger.logInfo(
      "ConsumerService::activeCompany()/consumerData:",
      consumerData,
    );
    let companyData = [];
    let companyGuid = null;
    let coId = null;
    if (consumerData.length > 0) {
      this.logger.logInfo(
        "ConsumerService::activeCompany()/consumerData[0].companyId:",
        { companyId: consumerData[0].companyId },
      );
      return consumerData;
    } else {
      return Promise.resolve([]);
    }
  }

  async getConsumerGuidByToken(
    req: Request,
    res: Response,
  ): Promise<ConsumerModel[]> {
    const svSess = new SessionService();
    const sess = await svSess.getSession(req, res);
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: "ConsumerService::getConsumerGuidByToken",
      cmd: {
        action: "find",
        query: { where: { consumerGuid: sess[0].consumerGuid } },
      },
      dSource: 1,
    };
    return await this.b.read(req, res, serviceInput);
  }

  //////////////////////////////////////////////////////////////
  // Consumer profile methods
  //////////////////////////////////////////////////////////////

  /**
   * Orchestrates the update of the consumerProfile JSON field.
   * Pattern: Session -> Fetch -> Validate -> Merge -> Persist
   */
  async updateConsumerProfile(req: Request, res: Response) {
    this.logger.logDebug("[ConsumerService:updateConsumerProfile] start...");
    const svSess = new SessionService();

    // 1. Get session context
    // const sessionDataExt = await svSess.getSessionDataExt(req, res, true);

    // 2. Extract ID and Update instructions from payload
    const consumerId = (req as any).post.dat.f_vals[0].query.where.consumerId;
    const jsonUpdate = (req as any).post.dat.f_vals[0].jsonUpdate;

    // 3. Fetch existing profile string from DB
    const existing: ConsumerModel[] = await this.existingConsumerProfile(
      req,
      res,
      consumerId,
    );
    this.logger.logDebug(
      "[ConsumerService:updateConsumerProfile] existing:",
      inspect(existing, { depth: 2 }),
    );
    let profileToUpdate: IConsumerProfile | string =
      existing[0]?.consumerProfile || (null as any);

    if (existing && existing.length > 0 && existing[0].consumerProfile) {
      if (typeof profileToUpdate === "string") {
        profileToUpdate = JSON.parse(existing[0].consumerProfile);
      } else {
        profileToUpdate = existing[0].consumerProfile;
      }
    } else {
      // Fallback to default if record is new or field is null
      profileToUpdate = cloneDeep(consumerProfileDefault);
    }

    this.logger.logDebug(
      "[ConsumerService:updateConsumerProfile] profileToUpdate:",
      inspect(profileToUpdate, { depth: 4 }),
    );

    // 4. Validate current state
    if (
      await this.validateConsumerProfileData(
        req,
        res,
        profileToUpdate as IConsumerProfile,
      )
    ) {
      // 5. Apply JSON updates via Helper (Path-based merging)
      const updatedProfile = await this.modifyProfile(
        profileToUpdate as IConsumerProfile,
        jsonUpdate,
      );

      this.logger.logDebug(
        "[ConsumerService:updateConsumerProfile] updatedProfile:",
        inspect(updatedProfile, { depth: 4 }),
      );

      // 6. Persist back to DB
      const serviceInput: IServiceInput<any> = {
        serviceInstance: this,
        serviceModel: ConsumerModel,
        docName: "ConsumerService::updateConsumerProfile",
        dSource: 1,
        cmd: {
          action: "update",
          query: {
            where: { consumerId },
            update: {
              consumerProfile: JSON.stringify(updatedProfile),
            },
          },
        },
      };
      const updateRet = await this.updateI(req, res, serviceInput);

      // 7. Re-fetch the newly updated profile for verification and UI sync
      const newProfile = await this.getConsumerProfileI(req, res, consumerId);

      // 8. Final response
      this.b.i.app_msg = "Consumer profile updated successfully";
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = { updateRet, newProfile };
      return await this.b.respond(req, res);
    } else {
      // Validation failure handled within validateConsumerProfileData
      return await this.b.respond(req, res);
    }
  }

  async existingConsumerProfile(
    req: Request,
    res: Response,
    consumerId: number,
  ) {
    const si: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: ConsumerModel,
      docName: "ConsumerService::existingConsumerProfile",
      dSource: 1,
      cmd: {
        action: "find",
        query: {
          select: ["consumerProfile"],
          where: { consumerId },
        },
      },
    };

    return this.b.read(req, res, si);
  }

  async modifyProfile(
    existingData: IConsumerProfile,
    profileConfig: JSDPInstruction[],
  ): Promise<IConsumerProfile> {
    // return ProfileServiceHelper.modifyProfile(existingData, profileConfig);
    return ProfileServiceHelper.modifyProfileExt(existingData, profileConfig);
  }

  async validateConsumerProfileData(
    req: Request,
    res: Response,
    profileData: IConsumerProfile,
  ): Promise<boolean> {
    this.logger.logDebug(
      "[ConsumerService:validateConsumerProfileData] start...",
    );
    const svSess = new SessionService();
    if (!profileData) {
      this.b.i.app_msg = "invalid consumer profile";
      this.b.setAppState(false, this.b.i, svSess.sessResp);
      return false;
    }
    this.logger.logDebug("[ConsumerService:validateConsumerProfileData] 1");

    if (!profileData.fieldPermissions) {
      this.b.i.app_msg = "invalid consumer profile field permission";
      this.b.setAppState(false, this.b.i, svSess.sessResp);
      return false;
    }
    this.logger.logDebug("[ConsumerService:validateConsumerProfileData] 2");
    if (profileData.description && profileData.description.length > 1000) {
      const e = "Consumer description too long";
      this.b.err.push(e);
      await this.b.serviceErr(
        req,
        res,
        e,
        "ConsumerService:validateConsumerProfileData",
      );
      this.logger.logDebug("[ConsumerService:validateConsumerProfileData] 3");
      return false;
    }

    return true;
  }

  /**
   * Fetches the parsed JSON profile, injecting entity data for context.
   */
  async getConsumerProfileI(
    req: Request,
    res: Response,
    consumerId: number,
  ): Promise<IConsumerProfile | null> {
    this.logger.logDebug("[ConsumerService.getConsumerProfileI()] start...");
    const consumer: ConsumerModel[] = await this.getI(req, res, {
      where: { consumerId },
    });

    this.logger.logDebug(
      "[ConsumerService.getConsumerProfileI()] consumer:",
      inspect(consumer, { depth: 4 }),
    );

    if (!consumer || !consumer[0]) return null;

    let profile: IConsumerProfile;
    if (consumer[0].consumerProfile) {
      if (typeof consumer[0].consumerProfile === "string") {
        profile = JSON.parse(consumer[0].consumerProfile);
      } else {
        profile = consumer[0].consumerProfile;
      }
    } else {
      profile = cloneDeep(consumerProfileDefault);
    }

    // Inject base entity data (excluding the profile string itself to avoid recursion)
    const consumerData = cloneDeep(consumer[0]);
    delete consumerData.consumerProfile;
    (profile as any).consumerData = consumerData;
    return profile;
  }
}
