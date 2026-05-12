import { Request, Response } from "express";
import {
  Observable,
  from,
  map,
  mergeMap,
  of,
  distinct,
  bufferCount,
  share,
  forkJoin,
} from "rxjs";
import { GroupMemberService } from "../../user/services/group-member.service";
import { BaseService } from "../../base/base.service";
import { AclModel, siGet } from "../models/acl.model";
import { DocModel } from "../models/doc.model";
import {
  IExtServiceInput,
  IAclCtx,
  ICdRequest,
  IQuery,
  IServiceInput,
  ISessionDataExt,
} from "../../base/i-base";
import { ModuleService } from "./module.service";
import { SessionService } from "../../user/services/session.service";
import { ConsumerService } from "./consumer.service";
import { AclUserViewModel } from "../models/acluserview.model";
import { AclModuleViewModel } from "../models/acl-module-view.model";
import { AclModuleMemberViewModel } from "../models/acl-module-member-view.model";
import { Logging } from "../../base/winston.log";
import { safeStringify } from "../../utils/safe-stringify";
import { AclTypeModel } from "../models/acl-type.model";
import { GenericController } from "../../base/generic-controller";
import { GenericService } from "../../base/generic-service";
import { Base } from "../../base/Base";
import { ModuleModel } from "../models/module.model";

/**
 * AclService is used by Corpdesk api to manage privilege access to modules.
 * Modules use MenuModel as handles to its facilities. So menus are also subject to AclService
 */
// export class AclService {
export class AclService extends GenericService<AclModel> {
  cdToken!: string;
  logger: Logging;
  // b: BaseService;
  serviceModel = AclModel;
  docName: string = "AclService";
  nestedMembers = [];
  aclRet: any;
  cuid: string = "";
  arrDoc: any;
  moduleIndexName: string = "";
  staticModel: any;
  validated: boolean = false;
  aclCtx!: IAclCtx;
  currentModule: any;
  srvSess;
  srvConsumer;
  consumerGuid!: string;
  consumer: any;
  isPublicModule = (m: any) => m.moduleIsPublic;
  trimmedModule = (m: any) => {
    return {
      moduleGuid: m.moduleGuid,
      moduleEnabled: m.moduleEnabled,
      moduleIsPublic: m.moduleIsPublic,
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      isSysModule: m.isSysModule,
      moduleTypeId: m.moduleTypeId,
      groupGuid: m.groupGuid,
    };
  };

  /*
   * create rules
   */
  cRules: any = {
    required: ["aclName", "email", "searchTags", "aclTypeGuid"],
    noDuplicate: ["aclName", "email"],
  };
  uRules: any[] = [];
  dRules: any[] = [];

  constructor() {
    super(AclModel);
    this.logger = new Logging();
    this.srvSess = new SessionService();
    this.srvConsumer = new ConsumerService();
  }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Acl",
  //         "a": "Create",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "data": {
  //                         "aclName": "/src/CdApi/sys/moduleman",
  //                         "aclTypeGuid": "7ae902cd-5bc5-493b-a739-125f10ca0268",
  //                         "parentModuleGuid": "00e7c6a8-83e4-40e2-bd27-51fcff9ce63b"
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
    console.log("moduleman/create::validateCreate()/01");
    const svSess = new SessionService();
    if (await this.validateCreate(req, res)) {
      await this.beforeCreate(req, res);
      const serviceInput = {
        serviceModel: AclModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create acl",
        dSource: 1,
      };
      console.log("AclService::create()/serviceInput:", serviceInput);
      const respData = await this.b.create(req, res, serviceInput);
      this.b.i.app_msg = "new acl created";
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
        serviceModel: AclModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create Acl",
        dSource: 1,
      };
      const result = await this.b.createSL(req, res, serviceInput);
      this.b.connSLClose();
      this.b.i.app_msg = "";
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = result;
      const r = await this.b.respond(req, res);
    } else {
      const r = await this.b.respond(req, res);
    }
  }

  async validateCreateSL(req: Request, res: Response) {
    return true;
  }

  async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<any>
  ): Promise<AclModel | boolean> {
    return await this.b.createI(req, res, serviceInputExt);
  }

  async validateCreate(req: Request, res: Response) {
    console.log("moduleman/AclService::validateCreate()/01");
    const svSess = new SessionService();
    ///////////////////////////////////////////////////////////////////
    // 1. Validate against duplication
    const params = {
      controllerInstance: this,
      model: AclModel,
    };
    this.b.i.code = "AclService::validateCreate";
    // await this.setCoopType(req, res)
    let ret = false;
    if (await this.b.validateUnique(req, res, params)) {
      console.log("moduleman/AclService::validateCreate()/02");
      if (await this.b.validateRequired(req, res, this.cRules)) {
        console.log("moduleman/AclService::validateCreate()/03");
        ret = true;
      } else {
        console.log("moduleman/AclService::validateCreate()/04");
        ret = false;
        this.b.i.app_msg = `the required fields ${this.b.isInvalidFields.join(
          ", "
        )} is missing`;
        this.b.err.push(this.b.i.app_msg);
        this.b.setAppState(false, this.b.i, svSess.sessResp);
      }
    } else {
      console.log("moduleman/AclService::validateCreate()/05");
      ret = false;
      this.b.i.app_msg = `duplicate for ${this.cRules.noDuplicate.join(
        ", "
      )} is not allowed`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
    }
    console.log("moduleman/AclService::validateCreate()/06");
    ///////////////////////////////////////////////////////////////////
    // 2. confirm the aclTypeGuid referenced exists
    const b = new BaseService();
    const pl: AclModel = this.b.getPlData(req);
    if ("aclTypeGuid" in pl) {
      console.log("moduleman/AclService::validateCreate()/07");
      console.log("moduleman/AclService::validateCreate()/pl:", pl);
      const serviceInput = {
        serviceModel: AclTypeModel,
        docName: "AclService::validateCreate",
        cmd: {
          action: "find",
          query: { where: { aclTypeGuid: pl.aclTypeGuid } },
        },
        dSource: 1,
      };
      console.log(
        "moduleman/AclService::validateCreate()/serviceInput:",
        JSON.stringify(serviceInput)
      );
      const r: any = await b.read(req, res, serviceInput);
      console.log("moduleman/AclService::validateCreate()/r:", r);
      if (r.length > 0) {
        console.log("moduleman/AclService::validateCreate()/08");
        ret = true;
      } else {
        console.log("moduleman/AclService::validateCreate()/10");
        ret = false;
        this.b.i.app_msg = `acl type reference is invalid`;
        this.b.err.push(this.b.i.app_msg);
        this.b.setAppState(false, this.b.i, svSess.sessResp);
      }
    } else {
      console.log("moduleman/AclService::validateCreate()/11");
      // this.b.i.app_msg = `parentModuleGuid is missing in payload`;
      // this.b.err.push(this.b.i.app_msg);
      //////////////////
      this.b.i.app_msg = `aclTypeGuid is missing in payload`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
    }
    console.log("AclService::getAcl/12");
    if (this.b.err.length > 0) {
      console.log("moduleman/AclService::validateCreate()/13");
      ret = false;
    }
    return ret;
  }

  async aclExists(req: Request, res: Response, q: IQuery): Promise<boolean> {
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: AclModel,
      docName: "AclService::aclExists",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    return this.b.read(req, res, serviceInput);
  }

  async beforeCreate(req: Request, res: Response): Promise<any> {
    this.b.setPlData(req, { key: "aclGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "aclEnabled", value: true });
    return true;
  }

  async beforeCreateSL(req: Request, res: Response): Promise<any> {
    this.b.setPlData(req, { key: "aclGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "aclEnabled", value: true });
    return true;
  }

  async getAcl(req: Request, res: Response, q?: IQuery): Promise<any> {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("AclService::getAcl/f:", q);
    if(!q) {
      console.log("AclService::getAcl/f/no query, using empty object");
      return [];
    }
    const serviceInput = siGet(q);
    try {
      const r = await this.b.read(req, res, serviceInput);
      this.b.successResponse(req, res, r);
    } catch (e: any) {
      console.log("AclService::read$()/e:", e);
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

  async getAclI(req: Request, res: Response, q?: IQuery): Promise<any> {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("AclService::getAcl/f:", q);
    if(!q) {
      console.log("AclService::getAcl/f/no query, using empty object");
      return [];
    }
    const serviceInput = siGet(q);
    try {
      return await this.b.read(req, res, serviceInput);
    } catch (e: any) {
      console.log("AclService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      return [];
    }
  }

  async getAclSL(req: Request, res: Response) {
    await this.b.initSqlite(req, res);
    const q = this.b.getQuery(req);
    console.log("AclService::getAcl/q:", q);
    const serviceInput = siGet(q);
    try {
      this.b.readSL$(req, res, serviceInput).subscribe((r: any) => {
        // console.log('AclService::read$()/r:', r)
        this.b.i.code = "AclService::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.connSLClose();
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log("AclService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "AclService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  getAclType(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("AclService::getAcl/f:", q);
    const serviceInput = {
      serviceModel: AclTypeModel,
      docName: "AclService::getAclType$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r: any) => {
        // console.log('AclService::read$()/r:', r)
        this.b.i.code = "AclController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log("AclService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
    }
  }

  async getAclTypeI(req: Request, res: Response, q?: IQuery): Promise<AclTypeModel[]> {
    const b = new BaseService();
    if (!q) {
      q = this.b.getQuery(req);
    }
    console.log("AclService::getAclTypeI/f:", q);
    const serviceInput = {
      serviceModel: AclTypeModel,
      docName: "AclService::getAclTypeI$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    } as IServiceInput<AclTypeModel>;
    try {
      return b.read(req, res, serviceInput);
    } catch (e) {
      console.log("AclService::getAclTypeI$()/e:", (e as Error).message);
      this.b.err.push((e as Error).message);
      const i = {
        messages: this.b.err,
        code: "AclService:getAclTypeI",
        app_msg: "",
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
      return [];
    }
  }

  getAclCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("AclService::getAclCount/q:", q);
    const serviceInput = {
      serviceModel: AclModel,
      docName: "AclService::getAclCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = "AclController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  getAclQB(req: Request, res: Response) {
    console.log("AclService::getAclQB()/1");
    this.b.entityAdapter.registerMappingFromEntity(AclModel);
    const q = this.b.getQuery(req);
    // console.log('MenuService::getModuleCount/q:', q);
    const serviceInput = {
      serviceModel: AclModel,
      docName: "AclService::getAclQB",
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

  getPagedSL(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("AclService::getAclCount()/q:", q);
    const serviceInput = {
      serviceModel: AclModel,
      docName: "AclService::getAclCount",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCountSL$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = "AclService::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.connSLClose();
      this.b.respond(req, res);
    });
  }

  getAclTypeCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("AclService::getAclCount/q:", q);
    const serviceInput = {
      serviceModel: AclTypeModel,
      docName: "AclService::getAclCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = "AclController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Acl",
  //         "a": "Update",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "update": {
  //                             "aclName": "/corp-deskv1.2.1.2/system/modules/comm/controllers"
  //                         },
  //                         "where": {
  //                             "aclId": 45762
  //                         }
  //                     }
  //                 }
  //             ],
  //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //         },
  //         "args": {}
  //     }
  //  * @param req
  //  * @param res
  //  */
  async update(req: Request, res: Response) {
    // console.log('AclService::update()/01');
    let q = this.b.getQuery(req);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: AclModel,
      docName: "AclService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    // console.log('AclService::update()/02')
    this.b.update$(req, res, serviceInput).subscribe((ret: any) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  async updateSL(req: Request, res: Response) {
    console.log("AclService::update()/01");
    let q = this.b.getQuery(req);
    q = this.beforeUpdateSL(q);
    const serviceInput = {
      serviceModel: AclModel,
      docName: "AclService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    console.log("AclService::update()/02");
    this.b.updateSL$(req, res, serviceInput).subscribe((ret:any) => {
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
    if (q.update.aclEnabled === "") {
      q.update.aclEnabled = null;
    }
    return q;
  }

  beforeUpdateSL(q: any) {
    if (q.update.billEnabled === "") {
      q.update.billEnabled = null;
    }
    return q;
  }
  async delete(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("AclService::delete()/q:", q);
    const serviceInput = {
      serviceModel: AclModel,
      docName: "AclService::delete",
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

  deleteSL(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("AclService::deleteSL()/q:", q);
    const serviceInput = {
      serviceModel: AclModel,
      docName: "AclService::deleteSL",
      cmd: {
        action: "delete",
        query: q,
      },
      dSource: 1,
    };

    this.b.deleteSL$(req, res, serviceInput).subscribe((ret: any) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  /**
   * Consumer is a acl that is registred as Consumer consumer.
   * All clients are expected to call api in the context of a given consumer.
   * One of the Coprdesk ways of assessing access level is by registering users who have access to a given consumer resources.
   * Consumer resources are managed by ConsumerResourceService and storage managed by ConsumerResourceModel
   *
   * @param req
   * @param res
   * @param params
   */
  async getAclModule(req: Request, res: Response, sessionDataExt: ISessionDataExt) {
    this.b.logTimeStamp(
      `AclService::getAclModule/sessionDataExt:${JSON.stringify(
        sessionDataExt
      )}`
    );
    console.log(
      "AclService::getAclModule(req, res,params)/sessionDataExt:",
      sessionDataExt
    );
    console.log(
      "AclService::getAclModule/this.consumerGuid:",
      this.consumerGuid
    );
    const result$ = of(
      /**
       * query from consumer_resource_view for users who are members of active consumer
       * and in respect of their roles: consumer_root, consumer_user, consumer_tech
       */
      this.aclUser$(req, res, sessionDataExt).pipe(
        map((u) => {
          return { useRoles: u };
        })
      ),
      /**
       * query from consumer_resource_view for modules which are
       *  - members of active consumer and
       *  - modules that are enabled
       */
      this.aclModule$(req, res).pipe(
        map((u) => {
          return { modules: u };
        })
      ),
      /**
       * Get modules where user belongs or has access to:
       * This is queried from acl_module_member_view
       * acl_module_member_view aggregates related group, group_members and modules
       * In essence it implements Access Level policy
       */
      this.aclModuleMembers$(req, res, sessionDataExt).pipe(
        map((u) => {
          return { moduleParents: u };
        })
      )
    ).pipe(
      mergeMap((obs$: any) => obs$),
      bufferCount(3)
    );

    result$.subscribe((r: any) => {
      // console.log(`AclService::getAclModule/subscribe/01`)
      // this.b.logTimeStamp(`AclService::getAclModule/r:${JSON.stringify(r: any)}`)
      // console.log(`AclService::getAclModule/r:${JSON.stringify(r: any)}`)
      const modules = r.filter((m: any) => {
        if (typeof m.modules === "object") {
          return m;
        }
      });

      const moduleParents = r.filter((m: any) => {
        if (typeof m.moduleParents === "object") {
          return m;
        }
      });

      // console.log(`AclService::getAclModule/modules:${JSON.stringify(modules)}`)
      // console.log(`AclService::getAclModule/moduleParents:${JSON.stringify(moduleParents)}`)
      // console.log('modules[0]:', modules[0]);
      // console.log('moduleParents[0]:', moduleParents[0]);
      const matchedObjects = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
      const intersect = modules[0].modules.filter((module: ModuleModel) => {
        return moduleParents[0].moduleParents.filter((mp: ModuleModel) => {
          if (JSON.stringify(mp) === JSON.stringify(module)) {
            return module;
          }
        });
      });
      this.b.cdResp = intersect;
      this.b.respond(req, res);
    });
  }

  /**
   * stream of users based on AclUserViewModel
   * This is based on settings at consumer_resource_types
   * ConsumerResourceTypeMode categorizes user based on roles (consumer root user, regular consumer users etc )
   * This is currently experimental and some data are hard coded for demonstrations of use case.
   * filtered by current consumer relationship and user role
   * @param req
   * @param res
   * @param params
   * @returns
   */
  aclUser$(req: Request, res: Response, sessionDataExt: ISessionDataExt): Observable<any> {
    // this.b.logTimeStamp(`AclService::aclUser$/params:${JSON.stringify(params)}`)
    const b = new BaseService();
    if(sessionDataExt.currentConsumer && sessionDataExt.currentConsumer.consumerGuid) {
      this.consumerGuid = sessionDataExt.currentConsumer.consumerGuid as string;
    } else {
      this.consumerGuid = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx";
    }
    const q: IQuery = { where: {} };
    const serviceInput: IServiceInput<any> = {
      serviceModel: AclUserViewModel,
      modelName: "AclUserViewModel",
      docName: "AclService::aclUser$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    const user$ = from(b.read(req, res, serviceInput)).pipe(
      share() // to avoid repeated db round trips
    );
    const isRoot = (u: any) => u.userId === 1001;
    const isAnon = (u: any) => u.userId === 1000;

    const isConsumerRoot = (u: any) =>
      u.consumerResourceTypeId === 4 &&
      u.consumerGuid === this.consumerGuid &&
      u.objGuid === sessionDataExt.currentUser.userGuid;

    const isConsumerTechie = (u: any) =>
      u.consumerResourceTypeId === 5 &&
      u.consumerGuid === this.consumerGuid &&
      u.objGuid === sessionDataExt.currentUser.userGuid;

    const isConsumerUser = (u: any) =>
      u.consumerResourceTypeId === 6 &&
      u.consumerGuid === this.consumerGuid &&
      u.objGuid === sessionDataExt.currentUser.userGuid;

    const isAnon$ = user$.pipe(
      map((u) => {
        const ret = u.filter(isRoot);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isRoot$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isRoot$]:${JSON.stringify(ret: any)}`)
        return ret;
      }),
      distinct()
    );
    const isRoot$ = user$.pipe(
      map((u) => {
        const ret = u.filter(isRoot);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isRoot$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isRoot$]:${JSON.stringify(ret: any)}`)
        return ret;
      }),
      distinct()
    );

    const isConsumerRoot$ = user$.pipe(
      map((u) => {
        const ret = u.filter(isConsumerRoot);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isConsumerRoot$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isConsumerRoot$]:${JSON.stringify(ret: any)}`)
        return ret;
      }),
      distinct()
    );

    const isConsumerTechie$ = user$.pipe(
      map((u) => {
        const ret = u.filter(isConsumerTechie);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isConsumerTechie$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isConsumerTechie$]:${JSON.stringify(ret: any)}`)
        return ret;
      }),
      distinct()
    );

    const isConsumerUser$ = user$.pipe(
      map((u) => {
        const ret = u.filter(isConsumerUser);
        // this.b.logTimeStamp(`AclService::aclUser$/u[isConsumerUser$]:${JSON.stringify(u)}`)
        // this.b.logTimeStamp(`AclService::aclUser$/ret[isConsumerUser$]:${JSON.stringify(ret: any)}`)
        return ret;
      }),
      distinct()
    );

    return forkJoin({
      isAnon: isAnon$.pipe(
        map((u) => {
          return u;
        })
      ),
      isRoot: isRoot$.pipe(
        map((u) => {
          return u;
        })
      ),
      isConsumerRoot: isConsumerRoot$.pipe(
        map((u) => {
          return u;
        })
      ),
      isConsumerUser: isConsumerUser$.pipe(
        map((u) => {
          return u;
        })
      ),
    });
  }

  /**
   * stream of modules based on AclModuleViewModel and
   * filtered by isEnabled, isPublicModule and isConsumerResource
   * @param req
   * @param res
   * @returns
   */
  aclModule$(req: Request, res: Response) {
    // this.logger.logInfo('AclService::aclModule$()/(req as any).post:', (req as any).post)
    this.logger.logInfo(
      "AclService::aclModule$()/this.consumerGuid:",
      this.consumerGuid
    );
    // console.log('AclService::aclModule$()/01:');
    // this.b.logTimeStamp(':AclService::aclModule$()/01')
    const b = new BaseService();
    const isEnabled = (m: ModuleModel) => m.moduleEnabled;
    const isPublicModule = (m: ModuleModel) => m.moduleIsPublic;
    const isConsumerResource = (m: any) =>
      m.moduleIsPublic || m.consumerGuid === this.consumerGuid;
    const serviceInput: IServiceInput<any> = {
      serviceModel: AclModuleViewModel,
      modelName: "AclModuleViewModel",
      docName: "AclService::aclModule$",
      cmd: {
        action: "find",
        query: { where: { consumerGuid: this.consumerGuid } },
      },
      dSource: 1,
    };
    return from(b.read(req, res, serviceInput))
      .pipe(share())
      .pipe(
        map((m) => {
          // this.b.logTimeStamp(':AclService::aclModule$()/02')
          console.log("AclService::aclModule$()/m1:", m);
          return m.filter(isEnabled);
        }),
        map((m) => {
          console.log("AclService::aclModule$()/m2:", m);
          // console.log('AclService::aclModule$()/03:');
          // this.b.logTimeStamp(':AclService::aclModule$()/03')
          return m.filter(isConsumerResource);
        }),
        distinct()
      )
      .pipe(
        map((modules) => {
          // this.b.logTimeStamp(':AclService::aclModule$()/04')
          // console.log('AclService::aclModule$()/03:');
          console.log("aclModuleMembers/modules3:", modules);
          const mArr: any = [];
          modules.forEach((m: any) => {
            m = {
              moduleGuid: m.moduleGuid,
              moduleEnabled: m.moduleEnabled,
              moduleIsPublic: m.moduleIsPublic,
              moduleId: m.moduleId,
              moduleName: m.moduleName,
              isSysModule: m.isSysModule,
              moduleTypeId: m.moduleTypeId,
              groupGuid: m.groupGuid,
            };
            mArr.push(m);
          });
          // this.b.logTimeStamp(':AclService::aclModule$()/05')
          // console.log('AclService::aclModule$()/04:');
          console.log("AclService::aclModule$/mArr:", mArr);
          return mArr;
        }),
        distinct()
      );
  }

  /**
   * When a module is created, it also creates a corresponding group in GroupModel
   * This logical group is used to save members of Corpdesk cd-objects that have access to this module.
   * Members of groups are managed by GroupMembersModel
   * AclModuleMemberViewModel aggregates related group, group_members and modules
   * In other words one can query which users belong to which module (logical association by grouping)
   *
   * @param req
   * @param res
   * @param params
   * @returns
   */
  aclModuleMembers$(req: Request, res: Response, params: ISessionDataExt): Observable<any> {
    // this.b.logTimeStamp('AclService::aclModuleMembers$/01')
    // console.log('AclService::aclModuleMembers$/01:');
    const b = new BaseService();

    /**
     * define filter for extracting modules where current user belongs
     * @param m
     * @returns
     */
    const isModuleMember = (m: any) => m.memberGuid === params.currentUser.userGuid;

    const serviceInput: IServiceInput<any> = {
      serviceModel: AclModuleMemberViewModel,
      modelName: "AclModuleMemberViewModel",
      docName: "AclService::aclUser$",
      cmd: {
        action: "find",
        /**
         * query for extracting all the modules where current user belongs or has access to
         */
        query: {
          where: [
            {
              memberGuid: params.currentUser.userGuid,
              moduleEnabled: true,
              groupMemberEnabled: true,
            },
            {
              moduleIsPublic: true,
            },
          ],
        },
      },
      dSource: 1,
    };
    const modules$ = from(b.read(req, res, serviceInput)).pipe(
      share() // to avoid repeated db round trips
    );
    return modules$
      .pipe(
        map((m: any) => {
          if (this.isPublicModule(m)) {
            return m; // waive filtering if the module is public
          } else {
            return m.filter(isModuleMember);
          }
        }),
        distinct()
      )
      .pipe(
        map((modules) => {
          // this.b.logTimeStamp('AclService::aclModuleMembers$/02')
          // console.log('AclService::aclModuleMembers$/02:');
          // console.log('aclModuleMembers/modules:', modules);
          const mArr: any = [];
          modules.forEach((m: any) => {
            m = {
              moduleGuid: m.moduleGuid,
              moduleEnabled: m.moduleEnabled,
              moduleIsPublic: m.moduleIsPublic,
              moduleId: m.moduleId,
              moduleName: m.moduleName,
              isSysModule: m.isSysModule,
              moduleTypeId: m.moduleTypeId,
              groupGuid: m.groupGuid,
            };
            mArr.push(m);
          });
          return mArr;
        }),
        distinct()
      );
  }
}
