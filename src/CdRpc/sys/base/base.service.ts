import { DataSource, Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as Lá from "lodash";
import { instanceToPlain } from "class-transformer";
import {
  IExtServiceInput,
  ICdRequest,
  ICdResponse,
  IQuery,
  IRespInfo,
  IServiceInput,
  ISessResp,
  ObjectItem,
  CacheData,
  IQbInput,
  JSDPInstruction,
  RunMode,
  CdResponseState,
  HttpState,
  ValidationRules,
  AbstractBaseService,
  CdFxReturn,
  ICdWireOptions,
  DEFAULT_RESPONSE,
} from "./i-base";
import { EntityMetadata, ObjectLiteral, UpdateResult } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Observable, from, throwError } from "rxjs";
import moment from "moment";
import { createClient } from "redis";
import { DocModel } from "../moduleman/models/doc.model";
import { SessionService } from "../user/services/session.service";
import { SessionModel } from "../user/models/session.model";
import { DocService } from "../moduleman/services/doc.service";
import config from "../../../config";
import { getDataSource } from "./data-source";
import { Logging } from "./winston.log";
import { RedisService } from "./redis-service";
import { QueryBuilderHelper } from "../utils/query-builder-helper";
import { EntityAdapter } from "../utils/entity-adapter";
import { TypeOrmDatasource } from "./type-orm-connect";
import { CdLogger } from "../utils/cd-logger";
import { JsonHelper } from "../utils/json-helper";
import { inspect } from "util";
import chalk from "chalk";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { toKebabCase } from "../utils/cd-naming.util";
import { RuntimeContextService } from "./runtime-context.service";
import { pathToFileURL } from "url";
// import { CdModelController} from "../../app/app-craft/controllers/cd-model.controller";

const USER_ANON = 1000;
const INVALID_REQUEST = "invalid request";

interface A {
  member: string;
}

// export class BaseService {
export class BaseService<
  T extends ObjectLiteral,
> extends AbstractBaseService<T> {
  cdToken!: string;
  cdResp: ICdResponse = DEFAULT_RESPONSE; // cd response
  cls!: string;
  err: string[] = []; // error messages
  db: any;
  // sqliteDb;
  sqliteConn: any;
  cuid = USER_ANON;
  consumerGuid!: string;
  debug = true;
  pl: any;
  svSess!: SessionService;
  sess!: SessionModel[];
  // sessDataExt: ISessionDataExt;
  i: IRespInfo = {
    messages: [],
    code: "",
    app_msg: "",
    respState: {
      cdLevel: CdResponseState.UNDEFINED,
      cdDescription: undefined,
      httpCode: HttpState.NO_CONTENT,
      httpDescription: "",
    },
  };
  isInvalidFields: string[] = [];
  isRegRequest = false;
  redisClient: any;
  svRedis: RedisService;
  logger: Logging;
  // cdLog: CdLogger;
  entityAdapter: EntityAdapter;

  constructor() {
    super();
    // this.redisInit();
    this.entityAdapter = new EntityAdapter();
    this.cdResp = this.initCdResp();
    this.logger = new Logging();
    this.svRedis = new RedisService();
  }
  models = [];
  sqliteModels = [];

  repo: any;
  private docRepository: any;
  ds: any = null;

  async init() {
    this.logger.logDebug("BaseService::init()/01:");
    try {
      if (!this.db) {
        this.logger.logDebug("BaseService::init()/02:");
        this.db = new TypeOrmDatasource();
        this.ds = await this.db.getConnection(); // ✅ Store DataSource
      }
      this.logger.logDebug("BaseService::init()/this.models:", this.models);
    } catch (e: any) {
      this.logger.logDebug("BaseService::init()/03:");
      this.logger.logDebug(
        `BaseService::init() failed:${(e as Error).message}`,
      );
      this.err.push(`BaseService::init() failed:${(e as Error).message}`);
    }
  }

  async initSqlite(req: Request, res: Response) {
    const iMax = 5;
    const i = 1;
    try {
      this.logger.logDebug("BaseService::initSqlite()/01");
      if (this.sqliteConn) {
        this.logger.logDebug("BaseService::initSqlite()/02");
      } else {
        this.logger.logDebug("BaseService::initSqlite()/03");
        // await this.setSLConn(i)
        this.sqliteConn = await this.db;
      }
    } catch (e: any) {
      this.logger.logDebug("BaseService::initSqlite()/04");
      this.logger.logDebug("initSqlite()/Error:", e);
      // const p = e.toString().search('AlreadyHasActiveConnectionError');
      // if (p === -1 && i < iMax) {
      //     i++;
      //     await this.setSLConn(i);
      // }
      this.err.push(e.toString());
    }
  }

  async setSLConn(i: any) {
    // const slConfig: ConnectionOptions = await sqliteConfigFx(
    //   `sqlite${i.toString()}`
    // );
    try {
      await this.db.getConnection(`sqlite${i.toString()}`);
      this.sqliteConn = await this.db
        .getConnection(`sqlite${i.toString()}`)
        .connect();
    } catch (error) {
      // this.sqliteConn = await createConnection(slConfig);
    }
  }

  connSLClose() {
    if (this.sqliteConn) {
      this.sqliteConn.close();
    }
  }

  /**
   * resolve the class that is being called
   * via module, controller(class) and action(method)
   * @param req
   * @param res
   * @param clsCtx
   * @returns
   */
  // async resolveCls(req: Request, res: Response, clsCtx: any) {
  //   const svSess = new SessionService();

  //   try {
  //     this.logger.logDebug("BaseService::resolveCls()/01:");
  //     this.logger.logDebug("BaseService::resolveCls/clsCtx.path:", clsCtx.path);

  //     // 1. Import controller module safely
  //     let eImport: any;
  //     try {
  //       eImport = await import(clsCtx.path);
  //     } catch (err) {
  //       this.logger.logDebug("BaseService::resolveCls()/02:");
  //       const eCode = "BaseService:resolveCls";
  //       const i = {
  //         messages: [
  //           `Controller file not found at path: ${clsCtx.path};Error:${(err as Error).toString()}`,
  //         ],
  //         code: eCode,
  //         app_msg: `Error at ${eCode}: Error:${(err as Error).toString()}`,
  //       };
  //       await this.setAppState(false, i, svSess.sessResp);
  //       return await this.respond(req, res);
  //     }

  //     this.logger.logDebug("BaseService::resolveCls()/03:");

  //     // 2. Validate controller class
  //     const eCls = eImport[clsCtx.clsName];
  //     if (!eCls) {
  //       this.logger.logDebug("BaseService::resolveCls()/04:");
  //       const eCode = "BaseService:resolveCls";
  //       const i = {
  //         messages: [
  //           `Controller class '${clsCtx.clsName}' not found in ${clsCtx.path}`,
  //         ],
  //         code: eCode,
  //         app_msg: `Error at ${eCode}: Invalid controller class.`,
  //       };
  //       await this.setAppState(false, i, svSess.sessResp);
  //       return await this.respond(req, res);
  //     }

  //     this.logger.logDebug("BaseService::resolveCls()/05:");

  //     // 3. Instantiate controller
  //     const cls = new eCls();
  //     this.ds = clsCtx.dataSource;

  //     this.logger.logDebug(
  //       `BaseService::resolveCls()/(req as any).post:${inspect((req as any).post)}`,
  //     );
  //     this.logger.logDebug("BaseService::resolveCls()/06:");

  //     // 4. Add session data if available
  //     if (this.sess) {
  //       (req as any).post.sessData = this.sess;
  //     }

  //     // 5. Validate action existence
  //     if (typeof cls[clsCtx.action] !== "function") {
  //       this.logger.logDebug("BaseService::resolveCls()/07:");
  //       const eCode = "BaseService:resolveCls";
  //       const i = {
  //         messages: [
  //           `Action '${clsCtx.action}' not found in controller '${clsCtx.clsName}'`,
  //         ],
  //         code: eCode,
  //         app_msg: `Error at ${eCode}: Invalid controller action.`,
  //       };
  //       await this.setAppState(false, i, svSess.sessResp);
  //       return await this.respond(req, res);
  //     }
  //     this.logger.logDebug("BaseService::resolveCls()/08:");
  //     // 6. Execute controller action
  //     await cls[clsCtx.action](req, res);
  //   } catch (e: any) {
  //     await this.serviceErr(req, res, e, "BaseService:resolveCls");
  //   }
  // }
  async resolveCls(req: Request, res: Response, clsCtx: any) {
    try {
      const svSess = new SessionService();

      // Testing if we are able to extract the cd execution context from the request.
      // This context is expected to be set by the API Gateway and should contain information
      // about the request that is relevant for the execution of the CD logic, such as requestId, user info, etc.
      let cdCtx = RuntimeContextService.get();
      this.logger.logDebug(
        `BaseService::resolveCls()/ cdCtx.requestId:${cdCtx.requestId}`,
      );

      /////////////////////////////////////////////////////////////
      // Resolve controller module
      /////////////////////////////////////////////////////////////

      let importedModule: any;

      try {
        this.logger.logDebug(
          `BaseService::resolveCls()/ clsCtx.path:${clsCtx.path}`,
        );
        importedModule = await import(clsCtx.path);
      } catch (e: any) {
        this.logger.logError(
          `BaseService::resolveCls()/ Error1:${(e as Error).message}`,
        );
        const eCode = "BaseService:resolveCls:Import";

        await this.setAppState(
          false,
          {
            messages: [
              `Controller import failed`,
              `path:${clsCtx.path}`,
              `error:${(e as Error).message}`,
            ],
            code: eCode,
            app_msg: (e as Error).message,
          },
          svSess.sessResp,
        );

        return await this.respond(req, res);
      }

      /////////////////////////////////////////////////////////////
      // Resolve controller class
      /////////////////////////////////////////////////////////////

      const ControllerClass = importedModule[clsCtx.clsName];

      if (!ControllerClass) {
        this.logger.logError(
          `BaseService::resolveCls()/ Error2: Controller class '${clsCtx.clsName}' not found in ${clsCtx.path}`,
        );
        const eCode = "BaseService:resolveCls:Controller";

        await this.setAppState(
          false,
          {
            messages: [`Controller class not found`, `class:${clsCtx.clsName}`],
            code: eCode,
            app_msg: "Invalid controller class",
          },
          svSess.sessResp,
        );

        return await this.respond(req, res);
      }

      /////////////////////////////////////////////////////////////
      // Instantiate controller
      /////////////////////////////////////////////////////////////

      const controller = new ControllerClass();

      this.ds = clsCtx.dataSource;

      /////////////////////////////////////////////////////////////
      // Backward compatibility
      /////////////////////////////////////////////////////////////

      if (this.sess) {
        (req as any).post.sessData = this.sess;
      }

      /////////////////////////////////////////////////////////////
      // Inject runtime context
      /////////////////////////////////////////////////////////////

      if (cdCtx) {
        this.logger.logDebug(
          `BaseService::resolveCls()/ Starting to inject runtime context into controller...`,
        );
        this.logger.logDebug(
          `BaseService::resolveCls()/ this.cdResp.app_state:${this.cdResp.app_state}`,
        );
        cdCtx.response = this.cdResp;
        cdCtx.response.app_state = this.cdResp.app_state;

        // RuntimeContextService.set(cdCtx);
        RuntimeContextService.update(cdCtx);

        // legacy bridge
        (req as any).cdCtx = cdCtx;

        // optional controller injection
        controller.cdCtx = cdCtx;
      }

      /////////////////////////////////////////////////////////////
      // Validate action
      /////////////////////////////////////////////////////////////

      const action = controller[clsCtx.action];
      this.logger.logDebug(`BaseService::resolveCls()/ action:${action}`);

      if (typeof action !== "function") {
        this.logger.logDebug(
          `BaseService::resolveCls()/ Error3: Action '${clsCtx.action}' not found in controller '${clsCtx.clsName}'`,
        );
        const eCode = "BaseService:resolveCls:Action";

        await this.setAppState(
          false,
          {
            messages: [
              `Controller action not found`,
              `action:${clsCtx.action}`,
            ],
            code: eCode,
            app_msg: "Invalid controller action",
          },
          svSess.sessResp,
        );

        return await this.respond(req, res);
      }

      /////////////////////////////////////////////////////////////
      // Execute action
      /////////////////////////////////////////////////////////////

      this.logger.logDebug(
        `BaseService::resolveCls()/executing action:${clsCtx.action}`,
      );

      /**
       * Backward compatible invocation
       *
       * OLD:
       *   action(req,res)
       *
       * FUTURE:
       *   action(req,res,cdCtx)
       */

      let ret: any;
      if (action.length >= 3) {
        // await controller[clsCtx.action](req, res, cdCtx);
        await action.call(controller, req, res, cdCtx);
      } else {
        // await controller[clsCtx.action](req, res);
        await action.call(controller, req, res);
      }

      // this.cdResp.data = ret;
      // await this.respond(req, res);

      // this.logger.logDebug(
      //   `BaseService::resolveCls()/completed requestId:${cdCtx?.requestId}`,
      // );
    } catch (e: any) {
      return await this.serviceErr(req, res, e, "BaseService:resolveCls");
    } finally {
      /////////////////////////////////////////////////////////////
      // Cleanup runtime context
      /////////////////////////////////////////////////////////////

      RuntimeContextService.destroy();
    }
  }

  private async respondWithError(
    req: Request,
    res: Response,
    svSess: SessionService,
    code: string,
    message: string,
  ) {
    const i = {
      messages: [message],
      code,
      app_msg: message,
    };

    await this.setAppState(false, i, svSess.sessResp);

    return await this.respond(req, res);
  }

  async invokeCdRequest<T = any>(
    cdRequest?: ICdRequest,
    options?: ICdWireOptions,
  ): Promise<CdFxReturn<T>> {
    this.logger.logDebug(
      "BaseService::invokeCdRequest() → Starting dispatch...",
    );

    if (!cdRequest) {
      return { state: false, message: "cdRequest is undefined or null." };
    }

    this.logger.logDebug(
      `BaseService::invokeCdRequest() → cdRequest received: ${inspect(cdRequest, { depth: 5 })}`,
    );

    const { ctx, m, c, a, args, dat } = cdRequest;

    try {
      const contextRoot = ctx.toLowerCase() === "sys" ? "sys" : "app";
      // const moduleName = `${m}`;
      const controllerName = `${c}Controller`;
      const controllerkebab = toKebabCase(c);
      const modulePath = `../../${contextRoot}/${m}/controllers/${controllerkebab}.controller.js`;

      this.logger.logDebug(
        `BaseService::invokeCdRequest() → Importing: ${modulePath}`,
      );

      const importedModule = await import(modulePath);
      const ControllerClass = importedModule?.[controllerName];

      if (!ControllerClass) {
        return {
          state: false,
          message: `Controller not found: ${controllerName} at ${modulePath}`,
        };
      }

      const controllerInstance = new ControllerClass();

      if (typeof controllerInstance[a] !== "function") {
        return { state: false, message: `Action method not found: ${a}` };
      }

      const result = await controllerInstance[a](
        ...(args ? Object.values(args) : []),
        dat,
      );

      if (!result?.state) {
        this.logger.logError(
          `BaseService::invokeCdRequest() → Task failed: ${result.message}`,
        );
        return result;
      }

      return result as CdFxReturn<T>;
    } catch (err: any) {
      const message = `Error executing cdRequest: ${err.message}`;
      this.logger.logError(`BaseService::invokeCdRequest() → ${message}`);
      return {
        state: false,
        message,
      };
    }
  }

  async serviceErr(
    req: Request,
    res: Response,
    e: any,
    eCode: any,
    lineNumber?: any,
  ) {
    const svSess = new SessionService();
    try {
      svSess.sessResp.cd_token = (req as any).post.dat.token;
    } catch (er) {
      svSess.sessResp.cd_token = "";
      this.err.push(e.toString(er));
    }

    svSess.sessResp.ttl = svSess.getTtl();
    this.setAppState(true, this.i, svSess.sessResp);
    this.err.push(e.toString());
    const i = {
      messages: await this.err,
      code: eCode,
      app_msg: `Error at ${eCode}: ${e.toString()}`,
    };
    await this.setAppState(false, i, svSess.sessResp);
    this.cdResp.data = [];
    return await this.respond(req, res);
  }

  async serviceErrI(e: any, eCode: any, lineNumber?: any) {
    const svSess = new SessionService();
    try {
      svSess.sessResp.cd_token = this.cdToken;
    } catch (er) {
      svSess.sessResp.cd_token = "";
      this.err.push(e.toString(er));
    }

    svSess.sessResp.ttl = svSess.getTtl();
    this.setAppState(true, this.i, svSess.sessResp);
    this.err.push(e.toString());
    const i = {
      messages: await this.err,
      code: eCode,
      app_msg: `Error at ${eCode}: ${e.toString()}`,
    };
    await this.setAppState(false, i, svSess.sessResp);
    this.cdResp.data = [];
  }

  async returnErr(req: Request, res: Response, i: IRespInfo) {
    const sess = this.getSess(req, res);
    await this.setAppState(false, i, sess);
    return await this.respond(req, res);
  }

  entryPath(pl: ICdRequest) {
    this.logger.logDebug("BaseService::entryPath/pl:", pl);
    const ret = `../../${pl.ctx.toLowerCase()}/${this.toCdName(
      pl.m,
    )}/controllers/${this.toCdName(pl.c)}.controller`;
    this.logger.logDebug("BaseService::entryPath()/ret:", ret);
    return ret;
  }

  // from camel to hyphen seperated then to lower case
  toCdName(camel: string) {
    this.logger.logDebug("BaseService::entryPath/camel:", camel);
    const ret = camel.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    this.logger.logDebug("BaseService::toCdName()/ret:", ret);
    return ret;
  }

  /**
   * Validate request
   * @param req
   * @param res
   * @returns
   */
  async valid(req: Request, res: Response): Promise<boolean> {
    const svSess = new SessionService();
    const pl = (req as any).post as ICdRequest;
    this.logger.logDebug(
      `BaseService::valid()(req as any).post: ${inspect(pl, { depth: 3 })}`,
    );
    this.pl = pl;
    if (await this.noToken(req, res)) {
      return true;
    } else {
      this.logger.logDebug(
        `BaseService::valid(): This request requires token validation.`,
      );
      /**
       * Confirm that the token in the payload is valid.
       */
      const tokenIsValid = await svSess.validateToken(req);
      if (tokenIsValid) {
        this.cdToken = (req as any).post.dat.token;
        return true;
      }

      if (!this.cdToken) {
        await this.setSess(req, res);
      }
      if (!this.instanceOfCdResponse(pl)) {
        return false;
      }
      if (!this.validFields(req, res)) {
        return false;
      }
    }
    return true;
  }

  async noToken(req: Request, res: Response) {
    this.logger.logDebug("BaseService::noToken()/01");
    this.logger.logDebug("BaseService::noToken()/(req as any).post:", {
      pl: JSON.stringify((req as any).post),
    });
    const pl = (req as any).post;
    const ctx = pl.ctx;
    const m = pl.m;
    const c = pl.c;
    const a = pl.a;
    let ret: boolean = false;
    if (!ctx || !m || !c || !a) {
      this.setInvalidRequest(req, res, "BaseService:noTocken:01");
    }

    /**
     * conditions that are allowed without token requirement
     */
    if (
      m === "User" &&
      (a === "Login" || a === "Register" || a === "ActivateUser")
    ) {
      this.logger.logDebug("BaseService::noToken()/02");
      if (m === "User" && a === "Register") {
        this.logger.logDebug("BaseService::noToken()/03");
        this.isRegRequest = true;
      }
      ret = true;
    }
    // exempt reading list of consumers. Required during registration when token is not set yet
    if (m === "Moduleman" && c === "Consumer" && a === "GetAll") {
      ret = true;
    }
    // exempt anon menu calls
    if (m === "Moduleman" && c === "Modules" && a === "GetAll") {
      ret = true;
    }

    // exempt websocket initialization calls
    if (m === "CdPush" && c === "Websocket" && a === "Create") {
      ret = true;
    }

    // exampt mpesa call backs
    if ("MSISDN" in pl) {
      ret = true;
    }
    this.logger.logDebug("BaseService::noToken()/returning ret:", {
      return: ret,
    });
    return ret;
  }

  isRegisterRequest() {
    return this.isRegRequest;
  }

  /**
   * implement validation of fields
   * @param req
   * @param res
   * @returns
   */
  validFields(req: Request, res: Response) {
    /**
     * 1. deduce model directory from the (req as any).post
     * 2. import model
     * 3. verify if fields exists
     */
    return true;
  }

  instanceOfCdResponse(object: any): boolean {
    return (
      "ctx" in object &&
      "m" in object &&
      "c" in object &&
      "a" in object &&
      "dat" in object &&
      "args" in object
    );
  }

  /**
   * for setting up response details
   * @param Success
   * @param Info
   * @param Sess
   */
  // async setAppState(succ: boolean, i: IRespInfo | null, ss:? ISessResp) {
  //   const sess = new SessionService();
  //   if (succ === false) {
  //     this.cdResp.data = [];
  //   }

  //   this.cdResp.app_state = {
  //     success: succ,
  //     info: i,
  //     sess: ss,
  //     cache: {},
  //     sConfig: {
  //       usePush: config.usePolling,
  //       usePolling: config.usePush,
  //       useCacheStore: config.useCacheStore,
  //     },
  //   };
  // }
  async setAppState(
    succ: boolean,
    i: IRespInfo = this.i,
    ss: ISessResp | null = null,
  ) {
    this.logger.logDebug("BaseService::setAppState()/01");

    if (succ === false) {
      this.logger.logDebug("BaseService::setAppState()/02");
      i.messages = this.err;
      this.cdResp.data = [];
    }
    // if(this.sess){
    //   this.setClientId(ss, this.sess[0]);
    // } else {
    //   this.logger.logDebug('BaseService::setAppState()/03')
    //   CdLogger.warn('session is not set')
    // }

    const sess = ss ?? this.cdResp.app_state.sess;

    this.logger.logDebug(
      `BaseService::setAppState()/ss: ${inspect(ss, { depth: 2 })}`,
    );
    this.cdResp.app_state = {
      success: succ,
      info: i,
      sess,
      cache: {},
      sConfig: {
        usePush: config.usePolling,
        usePolling: config.usePush,
        useCacheStore: config.useCacheStore,
      },
    };
  }

  /**
   * Under selected modes, client ip may be necessary as part of response
   * @param ss
   */
  getClientId(clientId: any) {
    this.logger.logDebug("BaseService::setClientId()/01");
    const allowedModes = [
      RunMode.UNRESTRICTED_DEVELOPER_MODE,
      RunMode.VERBOSE_MONITORING,
      RunMode.DIAGNOSTIC_TRACE,
      RunMode.MAINTENANCE_MODE,
    ];

    if (allowedModes.includes(config.runMode)) {
      this.logger.logDebug("BaseService::setClientId()/02");
      this.logger.logDebug("BaseService::setClientId()/clientId:", clientId);
      return clientId;
    } else {
      this.logger.logDebug("BaseService::setClientId()/03");
      CdLogger.warn("clientId is not allowed at this time");
      return null;
    }
  }

  setInvalidRequest(req: Request, res: Response, eCode: string) {
    this.err.push(INVALID_REQUEST);
    const i: IRespInfo = {
      messages: this.err,
      code: eCode,
      app_msg: "",
    };
    const sess = this.getSess(req, res);
    this.setAppState(false, i, sess);
    res.status(200).json(this.cdResp);
  }

  getSess(req: Request, res: Response) {
    return null; // yet to implement
  }

  initCdResp(): ICdResponse {
    return {
      app_state: {
        success: false,
        info: {
          messages: [],
          code: "",
          app_msg: "",
          respState: {
            cdLevel: CdResponseState.UNDEFINED,
            cdDescription: "",
            httpCode: HttpState.NO_CONTENT,
            httpDescription: "",
          },
        },
        sess: {
          cd_token: this.getGuid(),
          jwt: null,
          ttl: 0,
        },
        cache: {},
        sConfig: {
          usePush: config.usePolling,
          usePolling: config.usePush,
          useCacheStore: config.useCacheStore,
        },
      },
      data: {},
    };
  }

  async respond(req: Request, res: Response) {
    this.logger.logDebug("**********starting respond(res)*********");
    let ret;
    try {
      this.logger.logDebug("BaseService::respond(res)/this.pl:", {
        post: (req as any).post,
      });
      this.logger.logDebug("BaseService::respond(res)/this.cdResp:", {
        cdResp: this.cdResp,
      });

      const finalResp = await this.preFlight(req, res);
      ret = res.status(200).json(finalResp);
    } catch (e: any) {
      this.err.push(e.toString());
    }
    return ret;
  }

  async preFlight(req: Request, res: Response) {
    this.logger.logDebug("**********starting preFlight(res)*********");
    this.logger.logDebug(
      `BaseService::preFlight()/this.cdResp:`,
      JSON.stringify(this.cdResp),
    );

    // Step 1: Sanitize the cdResp data safely
    const sanitizedCdResp = this.deepSanitize(this.cdResp);
    // Step 2: Safely stringify the sanitized response
    let safeResp = JsonHelper.safeStringify(sanitizedCdResp);
    // Step 3: Detect if [Circular] marker exists
    if (safeResp.includes("[Circular]")) {
      try {
        safeResp = this.setCircularError(safeResp);
      } catch (e: any) {
        this.logger.logWarn("An attempt to set error condition failed");
        this.logger.logError(e.toString());
      }
    }
    this.logger.logDebug(`BaseService::preFlight()/15`);

    // Return the final response (JSON parsed again)
    return JSON.parse(safeResp);
  }

  setCircularError(safeResp: string) {
    this.logger.logDebug(`BaseService::setCircularError()/01`);
    const warningMsg =
      "[WARNING]: This response had circular anomaly and has been truncated. See areas marked with [Circular].";

    // Parse the response and add the warning message
    let safeRespJson: ICdResponse = JSON.parse(safeResp);
    // Ensure the app_msg and messages properties exist
    const appStateInfo = safeRespJson.app_state?.info;
    if (!appStateInfo.app_msg) {
      appStateInfo.app_msg = "";
    }
    if (!Array.isArray(appStateInfo.messages)) {
      appStateInfo.messages = [];
    }
    // Ensure respState exists
    if (!appStateInfo.respState) {
      appStateInfo.respState = {
        cdLevel: CdResponseState.UNDEFINED,
        cdDescription: "",
        httpCode: HttpState.NO_CONTENT,
        httpDescription: "",
      };
    }
    // Accumulate the warning messages
    appStateInfo.app_msg += `; ${warningMsg}`;
    appStateInfo.messages.push(warningMsg);
    appStateInfo.respState.cdLevel = CdResponseState.WARNING;
    appStateInfo.respState.httpCode = HttpState.ACCEPTED;
    // Update the response object
    safeRespJson.app_state.info = appStateInfo;
    // Stringify the modified object
    safeResp = JSON.stringify(safeRespJson);
    // Log the warning
    this.logger.logWarn(warningMsg);
    return safeResp;
  }

  private deepSanitize(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepSanitize(item));
    } else if (obj !== null && typeof obj === "object") {
      // If it's a TypeORM entity or a class instance, transform it
      if (
        typeof obj.constructor === "function" &&
        obj.constructor.name !== "Object"
      ) {
        try {
          return instanceToPlain(obj);
        } catch (e: any) {
          // If instanceToPlain fails for some reason, fallback to copying plain properties
          const plainObj: Record<string, any> = {};
          for (const key in obj) {
            plainObj[key] = this.deepSanitize(obj[key]);
          }
          return plainObj;
        }
      } else {
        // Pure JSON object (not an instance), process normally
        const newObj: Record<string, any> = {};
        for (const key in obj) {
          newObj[key] = this.deepSanitize(obj[key]);
        }
        return newObj;
      }
    } else {
      // Primitive (string, number, boolean, null, undefined)
      return obj;
    }
  }

  /**
   *
   * @param req
   * @param res
   * @param result
   * @param iCode
   */
  successResponse(req: Request, res: Response, result: any, appMsg?: string) {
    if (appMsg) {
      this.i.app_msg = appMsg;
    }
    const svSess = new SessionService();
    svSess.sessResp.cd_token = (req as any).post.dat.token;
    svSess.sessResp.ttl = svSess.getTtl();
    this.setAppState(true, this.i, svSess.sessResp);
    this.cdResp.data = result;
    this.respond(req, res);
  }

  /**
   *
   * @param req
   * @param extData // used to target any property of 'f_vals' other than 'data'
   * @param fValsIndex // used if f_val items are multiple
   * @returns
   */
  getPlData(
    req: Request,
    extData: string | null = null,
    fValsIndex: number | null = null,
  ) {
    this.logger.logDebug("BaseService::getPlData()/01");
    this.logger.logDebug(`BaseService::getPlData()/extData1:${extData}`);
    let ret = null;
    const svSess = new SessionService();
    if (this.validatePlData(req, extData)) {
      try {
        if (extData) {
          this.logger.logDebug("BaseService::getPlData()/02");
          this.logger.logDebug(
            `BaseService::getPlData()/fValsIndex:${fValsIndex}`,
          );
          this.logger.logDebug(
            `BaseService::getPlData()/(req as any).post.dat.f_vals[0]:${JSON.stringify(
              (req as any).post.dat.f_vals[0],
            )}`,
          );
          if (fValsIndex) {
            ret = (req as any).post.dat.f_vals[fValsIndex][extData];
          } else {
            ret = (req as any).post.dat.f_vals[0][extData];
          }
        } else {
          this.logger.logDebug("BaseService::getPlData()/03");
          if (fValsIndex) {
            ret = (req as any).post.dat.f_vals[fValsIndex].data;
          } else {
            ret = (req as any).post.dat.f_vals[0].data;
          }
        }
        this.logger.logDebug("BaseService::getPlData()/04");
        this.logger.logDebug("BaseService::getData()/ret:", ret);
        return ret;
      } catch (e: any) {
        this.setAlertMessage(e.toString(), svSess, false);
        return {};
      }
    } else {
      this.setAlertMessage("invalid validation request", svSess, false);
      return {};
    }
  }

  getPlQuery(
    req: Request,
    extData: string | null = null,
    fValsIndex: number | null = null,
  ) {
    this.logger.logDebug("BaseService::getPlQuery()/01");
    let ret = null;
    const svSess = new SessionService();
    if (this.validatePlData(req, extData)) {
      try {
        if (extData) {
          this.logger.logDebug("BaseService::getPlQuery()/02");
          if (fValsIndex) {
            ret = (req as any).post.dat.f_vals[fValsIndex][extData];
          } else {
            ret = (req as any).post.dat.f_vals[0][extData];
          }
        } else {
          this.logger.logDebug("BaseService::getPlQuery()/03");
          if (fValsIndex) {
            ret = (req as any).post.dat.f_vals[fValsIndex].query;
          } else {
            ret = (req as any).post.dat.f_vals[0].query;
          }
        }
        this.logger.logDebug("BaseService::getPlQuery()/04");
        this.logger.logDebug("BaseService::getQuery()/ret:", ret);
        return ret;
      } catch (e: any) {
        this.setAlertMessage(e.toString(), svSess, false);
        return {};
      }
    } else {
      this.setAlertMessage("invalid validation request", svSess, false);
      return {};
    }
  }

  /**
   *
   * @param req
   * @param extData // used to target any property of 'f_vals' other than 'data'
   * @param fValsIndex // used if f_val items are multiple
   * @returns
   */
  async getPlArgs(req: Request): Promise<any> {
    const svSess = new SessionService();
    this.logger.logDebug("BaseService::getPlArgs()/01");
    let ret = null;
    const request = (req as any).post as ICdRequest;
    this.logger.logDebug(
      `BaseService::getPlArgs()/(req as any).post: ${inspect(request.args, { depth: 2 })}`,
    );
    try {
      ret = request.args;
      this.logger.logDebug(
        `BaseService::getPlArgs()/ret: ${inspect(ret, { depth: 2 })}`,
      );
      return ret;
    } catch (e: any) {
      this.logger.logError("BaseService::getPlArgs()/error:", e);
      this.setAlertMessage(e.toString(), svSess, false);
      return {};
    }
  }

  async setPlData(
    req: Request,
    item: ObjectItem,
    extData?: string,
  ): Promise<void> {
    this.logger.logDebug("BaseService::setPlData()/item:", item);
    if (extData) {
      this.logger.logDebug("BaseService::setPlData()/extData:", {
        extData: extData,
      });
      this.logger.logDebug(
        "BaseService::setPlData()/(req as any).post.dat.f_vals[0][extData]:",
        (req as any).post.dat.f_vals[0][extData],
      );
      (req as any).post.dat.f_vals[0][extData][item.key] = item.value;
    } else {
      (req as any).post.dat.f_vals[0].data[item.key] = item.value;
    }
    this.logger.logDebug(
      "BaseService::setPlData()/(req as any).post.dat.f_vals[0]:",
      (req as any).post.dat.f_vals[0],
    );
  }

  /**
   *
   * @param req
   * @param item
   * @param extData
   */
  async setPlDataM(
    req: Request,
    data: any,
    item: ObjectItem,
    extData?: string,
  ): Promise<void> {
    this.logger.logDebug("BaseService::setPlDataM()/item:", item);
    if (extData) {
      this.logger.logDebug("BaseService::setPlDataM()/extData:", {
        context: extData,
      });
      this.logger.logDebug("BaseService::setPlDataM()/data:", data[extData]);
      data[extData][item.key] = item.value;
    }
    this.logger.logDebug("BaseService::setPlDataM()/data:", data);
  }

  /**
   * prevent a situation where either
   * 'data' property is missing or
   * extData property is missing
   * @param req
   * @param res
   * @param extData
   */
  validatePlData(req: Request, extData: any): boolean {
    const svSess = new SessionService();
    let ret = false;
    if (extData) {
      if (extData in (req as any).post.dat.f_vals[0]) {
        ret = true;
      } else {
        void this.setAlertMessage(
          "BaseService::validatePlData/requested property is missing",
          svSess,
          false,
        );
      }
    } else {
      if ("data" in (req as any).post.dat.f_vals[0]) {
        ret = true;
      } else {
        void this.setAlertMessage(
          "BaseService::validatePlData/requested property is missing",
          svSess,
          false,
        );
      }
    }
    return ret;
  }

  getReqToken(req: Request) {
    const r: ICdRequest = (req as any).post;
    return r.dat.token;
  }

  // getPlQuery(req, extData = null): Promise<any> {
  //     if (extData) {
  //         return (req as any).post.dat.f_vals[0][extData];
  //     } else {
  //         return (req as any).post.dat.f_vals[0].data;
  //     }
  // }

  async setCreateIData(
    req: Request,
    entityData: ICdRequest,
    item: ObjectItem,
  ): Promise<ICdRequest> {
    (entityData as any)[item.key] = item.value;
    // this.logger.logDebug('BaseService::setCreateIData()/entityData(2):', entityData);
    return await entityData;
  }

  getQuery(req: Request) {
    this.logger.logDebug("BaseService::getQuery()/01");
    this.logger.logDebug(
      `BaseService::getQuery()/(req as any).post.dat.f_vals[0].query:${JSON.stringify(
        (req as any).post.dat.f_vals[0].query,
      )}`,
    );
    const q = (req as any).post.dat.f_vals[0].query;
    this.logger.logDebug(`BaseService::getQuery()/q:${q}`);
    this.pl = (req as any).post;
    if (q) {
      return q;
    } else {
      return {};
    }
  }

  async getEntityPropertyMap(req: Request, res: Response, model: any) {
    await this.init();
    // this.logger.logDebug('BaseService::getEntityPropertyMap()/model:', model)
    const entityMetadata: EntityMetadata = await this.ds.getMetadata(model);
    // this.logger.logDebug('BaseService::getEntityPropertyMap()/entityMetadata:', entityMetadata)
    const cols = await entityMetadata.columns;
    const colsFiltd = await cols.map(async (col) => {
      return await {
        propertyAliasName: col.propertyAliasName,
        databaseNameWithoutPrefixes: col.databaseNameWithoutPrefixes,
        type: col.type,
      };
    });
    return colsFiltd;
  }

  async getEntityPropertyMapSL(req: Request, res: Response, model: any) {
    await this.initSqlite(req, res);
    const entityMetadata: EntityMetadata = await this.ds.getMetadata(model);
    const cols = await entityMetadata.columns;
    // this.logger.logDebug('BaseService::getEntityPropertyMapSL()/cols:', cols)
    const colsFiltdArr: any = [];
    const colsFiltd = await cols.map(async (col) => {
      const ret = {
        propertyAliasName: await col.propertyAliasName,
        databaseNameWithoutPrefixes: await col.databaseNameWithoutPrefixes,
        type: await col.type,
      };
      // this.logger.logDebug('getEntityPropertyMapSL()/ret:', {ret: JSON.stringify(ret: any)});
      colsFiltdArr.push(ret);
      return ret;
    });
    // this.logger.logDebug('BaseService::getEntityPropertyMapSL()/colsFiltd:', await colsFiltd)
    // this.logger.logDebug('BaseService::getEntityPropertyMapSL()/colsFiltdArr:', await colsFiltdArr)
    return colsFiltdArr;
  }

  async validateUnique(req: Request, res: Response, params: any) {
    this.logger.logDebug("BaseService::validateUnique()/01");
    this.logger.logDebug("BaseService::validateUnique()/(req as any).post:", {
      reqPost: JSON.stringify((req as any).post),
    });
    // this.logger.logDebug('BaseService::validateUnique()/(req as any).post.dat.f_vals[0]:', (req as any).post.dat.f_vals[0])
    this.logger.logDebug("BaseService::validateUnique()/params:", params);
    await this.init();
    // assign payload data to this.userModel
    //** */ params.controllerInstance.userModel = this.getPlData(req);
    // set connection
    // const baseRepository = this.db.getConnection().getRepository(params.model);
    const baseRepository = this.ds.getRepository(params.model);
    this.logger.logDebug("BaseService::validateUnique()/repo/model:", {
      model: params.model,
    });
    // const baseRepository: any = await this.repo(req, res, params.model)
    // const baseRepository: any = await this.repo
    // get model properties
    const propMap = await this.getEntityPropertyMap(
      req,
      res,
      params.model,
    ).then((result) => {
      // this.logger.logDebug('validateUnique()/result:', result)
      return result;
    });
    // this.logger.logDebug('validateUnique()/propMap:', await propMap)
    // const strQueryItems = await this.getQueryItems(req, propMap, params)
    const strQueryItems = await this.getQueryItems(req, params);
    this.logger.logDebug(
      "BaseService::validateUnique()/strQueryItems:",
      strQueryItems,
    );
    // convert the string items into JSON objects
    // const arrQueryItems = await strQueryItems.map(async (item) => {
    //     this.logger.logDebug('validateUnique()/item:', await item)
    //     return await JSON.parse(item);
    // });

    // this.logger.logDebug('validateUnique()/arrQueryItems:', arrQueryItems)
    // const filterItems = await JSON.parse(strQueryItems)
    const filterItems = await strQueryItems;
    this.logger.logDebug(
      "BaseService::validateUnique()/filterItems:",
      filterItems,
    );
    // execute the query
    const results = await baseRepository.count({
      where: await filterItems,
    });
    this.logger.logDebug(
      `BaseService::validateUnique()/results:${inspect(results, { depth: 2 })}`,
    );
    // return boolean result
    let ret = false;
    if (results === 0) {
      ret = true;
    } else {
      this.err.push("duplicate not allowed");
      // this.logger.logDebug('BaseService::create()/Error:', e.toString())
      const i = {
        messages: this.err,
        code: "BaseService:validateUnique",
        app_msg: "",
      };
      await this.setAppState(false, i, null);
    }
    this.logger.logDebug("BaseService::validateUnique()/ret:", { return: ret });
    return ret;
  }

  // async getQueryItems(req, propMap: any[], params: any) {
  async getQueryItems(req: Request, params: any, fields = null) {
    this.logger.logDebug("BaseService::getQueryItems()/01");
    ////////////////////////////////////////////////
    this.logger.logDebug("BaseService::getQueryItems()/params:", params);
    this.logger.logDebug(
      "BaseService::getQueryItems()/(req as any).post.dat.f_vals[0].data:",
      (req as any).post.dat.f_vals[0].data,
    );
    this.logger.logDebug("BaseService::getQueryItems()/02");
    if (fields === null) {
      fields = (req as any).post.dat.f_vals[0].data;
    }
    this.logger.logDebug("BaseService::getQueryItems()/03");
    const entries = Object.entries(fields as any);
    this.logger.logDebug("BaseService::getQueryItems()/04");
    this.logger.logDebug("getQueryItems()/entries:", entries);
    const entryObjArr = entries.map((e) => {
      this.logger.logDebug("getQueryItems()/e:", e);
      const k = e[0];
      const v = e[1];
      const ret = JSON.parse(
        `[{"key":"${k}","val":"${v}","obj":{"${k}":"${v}"}}]`,
      );
      this.logger.logDebug("getQueryItems()/ret:", ret);
      return ret;
    });
    this.logger.logDebug("getQueryItems()/entryObjArr:", entryObjArr);
    const cRules: string[] = params.controllerInstance.cRules.noDuplicate;
    const qItems = entryObjArr.filter((f) =>
      this.isNoDuplicate(f, cRules as any),
    );
    this.logger.logDebug("getQueryItems()/qItems:", qItems);
    const result: any = {};
    qItems.forEach(async (f: any) => {
      result[f[0].key] = f[0].val;
    });
    return await result;
  }

  /**
   * filter mapping for no-duplicate-fields
   * - the result is used in validateUnique(req: Request, res: Response, q: IQuery)
   * to query existence of duplicate entries
   * @param name
   * @param alias
   * @param cRules
   * @returns
   */
  async isNoDuplicateField(name: string, alias: any, cRules: any) {
    const ndFieldNames = cRules.noDuplicate as object[];
    const noDuplicateField = ndFieldNames.filter(
      (fieldName) => alias === fieldName,
    );
    let ret = false;
    if (noDuplicateField.length > 0) {
      ret = true;
    } else {
      ret = false;
    }
    return ret;
  }

  isNoDuplicate(fData: any, cRules = []) {
    // this.logger.logDebug('isNoDuplicate()/cRules:', cRules)
    // this.logger.logDebug('isNoDuplicate()/fData:', fData)
    return cRules.filter((fieldName) => fieldName === fData[0].key).length > 0;
    // this.logger.logDebug('isNoDuplicate()/field:', dupFields)
    // let ret = false;
    // if (dupFields.length > 0) {
    //     ret = true;
    // } else {
    //     ret = false;
    // }
    // return ret;
  }

  async validateRequired(req: Request, res: Response, cRules: any) {
    this.logger.logDebug(
      "BaseService::validateRequired()/cRules:",
      JSON.stringify(cRules),
    );
    const svSess = new SessionService();
    await this.init();
    const rqFieldNames = cRules.required as string[];
    this.logger.logDebug(
      "BaseService::validateRequired()/rqFieldNames:",
      JSON.stringify(rqFieldNames),
    );
    this.isInvalidFields = await rqFieldNames.filter((fieldName) => {
      this.logger.logDebug(
        "BaseService::validateRequired()/fieldName:",
        fieldName,
      );
      this.logger.logDebug(
        "BaseService::validateRequired()/this.getPlData(req):",
        JSON.stringify(this.getPlData(req)),
      );
      if (!(fieldName in this.getPlData(req))) {
        // required field is missing
        return fieldName;
      }
    });
    if (this.isInvalidFields.length > 0) {
      // this.logger.logDebug('BaseService::validateRequired()/cRules:', JSON.stringify(cRules))
      // this.logger.logDebug('BaseService::validateRequired()/isInvalid:', JSON.stringify(this.isInvalidFields))
      this.i.app_msg = `the required fields ${this.isInvalidFields.join(
        ", ",
      )} is missing`;
      this.i.messages.push(this.i.app_msg);
      this.setAppState(false, this.i, svSess.sessResp);
      return false;
    } else {
      return true;
    }
  }

  async validateRequiredI(
    req: Request,
    res: Response,
    params: IExtServiceInput<any>,
  ) {
    const cRules = params.serviceInput.serviceInstance.cRules;
    this.logger.logDebug(
      "BaseService::validateRequired()/cRules:",
      JSON.stringify(cRules),
    );
    const svSess = new SessionService();
    await this.init();
    const rqFieldNames = cRules.required as string[];
    this.logger.logDebug(
      "BaseService::validateRequired()/rqFieldNames:",
      JSON.stringify(rqFieldNames),
    );
    this.isInvalidFields = await rqFieldNames.filter((fieldName) => {
      this.logger.logDebug(
        "BaseService::validateRequired()/fieldName:",
        fieldName,
      );
      this.logger.logDebug(
        "BaseService::validateRequired()/params.entityData:",
        JSON.stringify(params.entityData),
      );
      if (!(fieldName in params.entityData)) {
        // required field is missing
        return fieldName;
      }
    });
    if (this.isInvalidFields.length > 0) {
      // this.logger.logDebug('BaseService::validateRequired()/cRules:', JSON.stringify(cRules))
      // this.logger.logDebug('BaseService::validateRequired()/isInvalid:', JSON.stringify(this.isInvalidFields))
      this.i.app_msg = `the required fields ${this.isInvalidFields.join(
        ", ",
      )} is missing`;
      this.i.messages.push(this.i.app_msg);
      this.setAppState(false, this.i, svSess.sessResp);
      return false;
    } else {
      return true;
    }
  }

  async validateUniqueI(
    req: Request,
    res: Response,
    params: IExtServiceInput<any>,
  ) {
    this.logger.logDebug("BaseService::validateUniqueI()/01");
    this.logger.logDebug(
      "BaseService::validateUniqueI()/(req as any).post:",
      (req as any).post,
    );
    this.logger.logDebug(
      "BaseService::validateUniqueI()/(req as any).post.dat.f_vals[0]:",
      (req as any).post.dat.f_vals[0],
    );
    this.logger.logDebug("BaseService::validateUniqueI()/params:", params);
    await this.init();
    // assign payload data to this.userModel
    //** */ params.controllerInstance.userModel = this.getPlData(req);
    // set connection
    const baseRepository = this.ds.getRepository(
      params.serviceInput.serviceModel,
    );
    this.logger.logDebug("BaseService::validateUniqueI()/repo/model:", {
      model: params.serviceInput.serviceModel,
    });

    this.logger.logDebug(
      "BaseService::validateUniqueI()/params.serviceInput:",
      params.serviceInput,
    );
    // const filterItems = await JSON.parse(strQueryItems)
    const filterItems = await this.duplicateFilter(
      params.entityData,
      params.serviceInput.serviceInstance.cRules.noDuplicate,
    );
    this.logger.logDebug(
      "BaseService::validateUniqueI()/filterItems:",
      filterItems,
    );
    // execute the query
    const results = await baseRepository.count({
      where: await filterItems,
    });
    this.logger.logDebug("BaseService::validateUniqueI()/results:", results);
    // return boolean result
    let ret = false;
    if (results === 0) {
      ret = true;
    } else {
      this.err.push("duplicate not allowed");
      // this.logger.logDebug('BaseService::create()/Error:', e.toString())
      const i = {
        messages: this.err,
        code: "BaseService:validateUniqueI",
        app_msg: "",
      };
      await this.setAppState(false, i, null);
    }
    this.logger.logDebug("BaseService::validateUniqueI()/ret:", {
      return: ret,
    });
    return ret;
  }

  async duplicateFilter<T extends Record<string, any>>(
    entityData: T,
    noDuplicate: string[],
  ): Promise<Partial<T>> {
    this.logger.logDebug(
      "BaseService::duplicateFilter()/entityData:",
      entityData,
    );
    this.logger.logDebug(
      "BaseService::duplicateFilter()/noDuplicate:",
      noDuplicate,
    );
    const filteredData = {} as Partial<T>;

    for (const field of noDuplicate) {
      if (Object.prototype.hasOwnProperty.call(entityData, field)) {
        (filteredData as Record<string, any>)[field] = entityData[field];
      }
    }

    return filteredData;
  }

  /**
   * 1. create new doc
   * 2. use docId to complete create
   * 3. for any error, save the error using serviceErr()
   *    process is expected to return the encountered errors back to requesting entity
   * 4. Returning data is encpsulated in corpdesk http request object this.cdResp.
   *
   * used where create is called remotely
   * Note that both create() and createI(), are processed together with
   * doc data: containing dates, user and other application information
   * used in document tracking
   * @param req
   * @param res
   * @param serviceInput
   * @returns
   */
  async create(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    this.logger.logInfo("BaseService::create()/01");
    /**
     * Initialize the repo
     */
    await this.init();
    this.logger.logInfo("BaseService::create()/02");
    await this.setRepo(serviceInput);
    this.logger.logInfo("BaseService::create()/03");

    /**
     * Doc is the component that saves meta data of create tranaction
     * Create a Doc associated with this insertion
     */
    let newDocData;
    try {
      this.logger.logInfo("BaseService::create()/04");
      newDocData = await this.saveDoc(req, res, serviceInput);
      this.logger.logInfo(
        `BaseService::create()/newDocData:${JSON.stringify(newDocData)}`,
      );
      this.logger.logInfo("BaseService::create()/05");
    } catch (e: any) {
      this.serviceErr(req, res, e, "BaseService:create/savDoc");
    }

    /**
     * pass this.repo to serviceRepository
     */
    let serviceRepository = null;
    try {
      this.logger.logInfo("BaseService::create()/06");
      serviceRepository = await this.repo;
      this.logger.logInfo("BaseService::create()/07");
    } catch (e: any) {
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:create/getConnection",
        app_msg: "",
      };
      await this.serviceErr(req, res, e, "BaseService:create");
      return this.cdResp;
    }

    /**
     * use the Doc data to create a new object based on the model
     */
    try {
      this.logger.logInfo("BaseService::create()/08");
      // let modelInstance = serviceInput.serviceModelInstance;
      // Use the factory helper to ensure modelInstance is NEVER undefined
      let modelInstance = this.getModelInstance(serviceInput);
      if ("dSource" in serviceInput) {
        this.logger.logInfo("BaseService::create()/09");
        if (serviceInput.dSource === 1) {
          this.logger.logInfo("BaseService::create()/10");
          this.logger.logInfo("BaseService::newDocData.docId:", newDocData);
          await this.setPlData(req, {
            key: "docId",
            value: await newDocData.docId,
          }); // set docId
          this.logger.logInfo("BaseService::create()/11");
          const serviceData = await this.getServiceData(req, serviceInput);
          this.logger.logInfo("BaseService::create()/12");
          this.logger.logInfo(
            "BaseService::create()/serviceInput:",
            serviceInput,
          );
          this.logger.logInfo(
            "BaseService::create()/serviceData:",
            serviceData,
          );
          modelInstance = await this.setEntity(
            req,
            res,
            serviceInput,
            serviceData,
          );
          this.logger.logDebug("BaseService::create()/13");
          return await serviceRepository.save(await modelInstance);
        }
      }
    } catch (e: any) {
      this.logger.logError("BaseService::create()/14");
      this.logger.logError(
        "BaseService::create()/Failed to create new record:",
        e.toString(),
      );
      const i = {
        messages: this.err,
        code: "BaseService:create",
        app_msg: "",
      };
      await this.setAppState(false, i, null);
      await this.serviceErr(req, res, e, "BaseService:create");
    }
  }

  async createSL(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ) {
    try {
      const repo: any = await this.sqliteConn.getRepository(
        serviceInput.serviceModel,
      );
      const pl = this.getPlData(req);
      return await repo.save(pl);
    } catch (e: any) {
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BillService:create",
        app_msg: "",
      };
      await this.serviceErr(req, res, e, "BillService:create");
      return this.cdResp;
    }
  }

  /**
   * similar to create() but
   * used where create is called internally
   * Note that both create and createI, are tagged with
   * doc data which has dates, user and other application information
   * used in document tracking
   * @param req
   * @param res
   * @param serviceInputExt
   */
  async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<any>,
  ): Promise<any> {
    this.logger.logDebug("BaseService::createI()/01");
    await this.init();
    let newDocData;
    let ret: any;
    try {
      this.logger.logDebug("BaseService::createI()/02");
      newDocData = await this.saveDoc(
        req as any,
        res as any,
        serviceInputExt.serviceInput,
      );
      // this.logger.logDebug('BaseService::createI()/newDocData:', newDocData)
    } catch (e: any) {
      this.logger.logDebug("BaseService::createI()/03");
      this.serviceErr(
        req as any,
        res as any,
        e,
        "BaseService:createI()/savDoc",
      );
    }
    let serviceRepository = null;
    try {
      this.logger.logDebug("BaseService::createI()/04");
      serviceRepository = await this.ds.getRepository(
        serviceInputExt.serviceInput.serviceModel,
      );
      this.logger.logDebug(
        "BaseService::createI()/repo/model:",
        serviceInputExt.serviceInput.serviceModel,
      );
    } catch (e: any) {
      this.logger.logDebug("BaseService::createI()/05");
      this.logger.logDebug("BaseService::createI()/Error/01");
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:create/getConnection",
        app_msg: "problem creating connection",
      };
      this.logger.logDebug("BaseService::createI()/06");
      await this.serviceErr(req, res, e, "BaseService:create/getConnection");
      return this.cdResp;
    }

    try {
      this.logger.logDebug("BaseService::createI()/07");
      let modelInstance = serviceInputExt.serviceInput.serviceModelInstance;
      if ("dSource" in serviceInputExt.serviceInput) {
        this.logger.logDebug("BaseService::createI()/08");
        if (serviceInputExt.serviceInput.dSource === 1) {
          this.logger.logDebug("BaseService::createI()/09");
          this.logger.logDebug(
            "BaseService::createI()/newDocData:",
            newDocData,
          );
          this.logger.logDebug(
            "BaseService::createI()/serviceInputExt:",
            serviceInputExt,
          );
          this.logger.logDebug(
            "BaseService::createI()/serviceInputExt.entityData:",
            serviceInputExt.entityData,
          );
          serviceInputExt.entityData = await this.setCreateIData(
            req,
            serviceInputExt.entityData,
            { key: "docId", value: await newDocData.docId },
          );
          this.logger.logDebug("BaseService::createI()/091");
          const serviceData = serviceInputExt.entityData;
          this.logger.logDebug("BaseService::createI()/092");
          modelInstance = await this.setEntity(
            req,
            res,
            serviceInputExt.serviceInput,
            serviceData,
          );
          // modelInstance = serviceInputExt.serviceInput.serviceModelInstance
          this.logger.logDebug("BaseService::createI()/093");
          // serviceRepository = await this.repo
          this.logger.logDebug("BaseService::createI()/094");
          ret = await serviceRepository.save(await modelInstance);
        }
      }
    } catch (e: any) {
      this.logger.logDebug("BaseService::createI()/10");
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:createI",
        app_msg: "problem saving data",
      };
      await this.serviceErr(req, res, e, "BaseService:createI");
      ret = false;
    }
    this.logger.logDebug("BaseService::createI()/11");
    return await ret;
  }

  async saveDoc(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    await this.init();

    this.logger.logDebug("BaseService::saveDoc()/01");
    // const docRepository: any = await this.ds.getRepository(DocModel);
    this.logger.logDebug("BaseService::saveDoc()/repo/model:", DocModel);
    // const docRepository: any = await this.repo(req, res, DocModel)

    this.logger.logDebug("BaseService::saveDoc()/02");
    const doc = await this.setDoc(req, res, serviceInput);
    this.logger.logDebug("BaseService::saveDoc()/03/dod:", doc);
    this.logger.logDebug("BaseService::saveDoc()/doc:", doc);
    // await this.setRepo(serviceInput)

    // const docRepository: any = this.repo
    return await this.docRepository.save(doc);
  }

  private getModelInstance(serviceInput: IServiceInput<T>): T {
    // 1. If the instance was already provided, use it.
    if (serviceInput.serviceModelInstance) {
      return serviceInput.serviceModelInstance;
    }

    // 2. If no instance exists, but we have the Class (serviceModel), create it.
    if (serviceInput.serviceModel) {
      this.logger.logDebug(
        `BaseService::getModelInstance() - Creating new instance of ${serviceInput.serviceModel.name}`,
      );
      return new serviceInput.serviceModel();
    }

    // 3. Fallback/Error if neither is available
    throw new Error(
      "BaseService: Unable to resolve model instance. Both serviceModel and serviceModelInstance are missing.",
    );
  }

  async addParam(req: Request, param: any) {
    return { ...(req as any).post.dat.f_vals[0].data, ...param }; // merge objects
  }

  async setDoc(req: Request, res: Response, serviceInput: any) {
    this.logger.logDebug("BaseService::setDoc()/01");
    if (!this.cdToken) {
      this.logger.logDebug("BaseService::setDoc()/02");
      await this.setSess(req, res);
    }
    this.logger.logDebug("BaseService::setDoc()/03");
    const dm: DocModel = new DocModel();
    const iDoc = new DocService();
    dm.docFrom = this.cuid;
    dm.docName = serviceInput.docName;
    this.logger.logDebug("BaseService::setDoc()/04");
    dm.docTypeId = await iDoc.getDocTypeId(req, res);
    this.logger.logDebug("BaseService::setDoc()/05");
    dm.docDate = await this.mysqlNow();
    this.logger.logDebug("BaseService::setDoc()/06");
    const AppDataSource = await getDataSource();
    this.docRepository = AppDataSource.getRepository(DocModel);
    return await dm;
  }

  async setSess(req: Request, res: Response) {
    this.logger.logDebug("BaseService::setSess()/01");
    this.svSess = new SessionService();
    if (await !this.cdToken) {
      this.logger.logDebug("BaseService::setSess()/02");
      try {
        this.logger.logDebug(
          "BaseService::setSess()/(req as any).post:",
          (req as any).post,
        );
        if ("sessData" in (req as any).post) {
          this.logger.logDebug("BaseService::setSess()/021");
          this.logger.logDebug(
            "BaseService::setSess()/(req as any).post.sessData:",
            (req as any).post.sessData,
          );
          this.sess = [(req as any).post.sessData];
        } else {
          this.logger.logDebug("BaseService::setSess()/022");
          this.sess = await this.svSess.getSession(req, res);
        }
        this.logger.logDebug("BaseService::setSess()/03");
        this.logger.logDebug("BaseService::setSess()/this.sess:", this.sess);
        if (this.sess) {
          this.logger.logDebug("BaseService::setSess()/04");
          if (this.sess.length > 0) {
            this.logger.logDebug("BaseService::setSess()/05");
            this.logger.logDebug("this.sess:", this.sess);
            this.setCuid(this.sess[0].currentUserId as number);
            this.cdToken = (await this.sess[0].cdToken) as string;
          } else {
            this.logger.logDebug("BaseService::setSess()/06");
            const noToken = await this.noToken(req, res);
            this.logger.logDebug("BaseService::setSess()/noToken:", {
              noToken: noToken,
            });
            if (noToken === false) {
              this.i = {
                messages: this.err,
                code: "BaseService:setSess1",
                app_msg: "invalid session",
              };
              // do not report 'invalid session' if the session is 'noToken' required.
              await this.serviceErr(req, res, this.i.app_msg, this.i.code);
              // this.respond(req, res);
            }
          }
        } else {
          this.logger.logDebug("BaseService::setSess()/07");
          this.i = {
            messages: this.err,
            code: "BaseService:setSess2",
            app_msg: "invalid session",
          };
          await this.serviceErr(req, res, this.i.app_msg, this.i.code);
          this.respond(req, res);
        }
      } catch (e: any) {
        this.logger.logDebug("BaseService::setSess()/08");
        this.i = {
          messages: this.err,
          code: "BaseService:setSess3",
          app_msg: e.toString(),
        };
        // await this.serviceErr(req, res, this.i.app_msg, this.i.code)
        await this.setAlertMessage(e.toString(), this.svSess, false);
        // this.respond(req, res);
      }
    }
  }

  async getServiceData(req: Request, serviceInput: IServiceInput<any>) {
    if (serviceInput.data) {
      return await serviceInput.data;
    } else {
      return await this.getPlData(req);
    }
  }

  async setPropertyMapArr(req: Request, res: Response, serviceInput: any) {
    this.logger.logDebug("BaseService::setPropertyMapArr()/01");
    const propMap = await this.getEntityPropertyMap(
      req,
      res,
      serviceInput.serviceModel,
    );
    this.logger.logDebug("BaseService::setPropertyMapArr()/propMap:", propMap);
    const propMapArr: any = [];
    await propMap.forEach(async (field: any) => {
      // this.logger.logDebug('BaseService::setPropertyMapArr()/forEach/field:', field)
      const f = await field;
      const aName = f.propertyAliasName;
      // this.logger.logDebug('BaseService::setPropertyMapArr()/forEach/aName:', aName)
      const rName = f.databaseNameWithoutPrefixes;
      // this.logger.logDebug('BaseService::setPropertyMapArr()/forEach/rName:', rName)
      propMapArr.push({ alias: aName, fieldName: rName });
    });
    return propMapArr;
  }

  async setEntity(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
    serviceData: any,
  ): Promise<any> {
    this.logger.logDebug(
      "BaseService::setEntity()/serviceInput:",
      serviceInput,
    );
    this.logger.logDebug(
      `BaseService::setEntity()/serviceData:${inspect(serviceData, { depth: 2 })}`,
    );
    this.logger.logDebug(
      `BaseService::setEntity()/serviceInput:${inspect(serviceInput, { depth: 2 })}`,
    );
    try {
      const propMapArr = await this.setPropertyMapArr(req, res, serviceInput);
      this.logger.logDebug("BaseService::setEntity()/propMapArr:", propMapArr);
      // const serviceInstance = serviceInput.serviceModelInstance;
      let serviceInstance = this.getModelInstance(serviceInput);
      this.logger.logDebug(
        "BaseService::setEntity()/serviceInstance1:",
        serviceInstance,
      );
      propMapArr.forEach(async (field: any, i: number) => {
        // this.logger.logDebug("BaseService::setEntity()/forEach/field:", field);
        this.logger.logDebug(
          `BaseService::setEntity()/field:${inspect(field, { depth: 2 })}`,
        );
        (serviceInstance as any)[field.alias] = serviceData[field.alias];
      });
      this.logger.logDebug(
        "BaseService::setEntity()/serviceInstance2:",
        serviceInstance,
      );
      return await serviceInstance;
    } catch (e) {
      this.logger.logError(
        "BaseService::setEntity()/Error:",
        (e as Error).message,
      );
      await this.setAlertMessage((e as Error).message, this.svSess, false);
      return null;
    }
  }

  async mysqlNow(): Promise<string> {
    this.logger.logDebug("BaseService::mysqlNow()/01");
    let ret: any = null;
    try {
      const now = new Date();
      const date = await moment(now, "ddd MMM DD YYYY HH:mm:ss");
      this.logger.logDebug("BaseService::mysqlNow()/date:", date);
      this.logger.logDebug("BaseService::mysqlNow()/02");
      ret = await date.format("YYYY-MM-DD HH:mm:ss"); // convert to mysql date
      this.logger.logDebug("BaseService::mysqlNow()/03");
      return ret;
    } catch (e) {
      this.logger.logDebug(
        "BaseService::mysqlNow()/Error:",
        (e as Error).message,
      );
      await this.setAlertMessage((e as Error).message, this.svSess, false);
    }

    return await ret;
  }

  getGuid() {
    return uuidv4();
  }

  getCuid(req: Request) {
    return (req as any).post.sessData[0].currentUserId;
  }

  setCuid(cuid: number) {
    this.cuid = cuid;
  }

  async read(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<T>,
  ): Promise<any> {
    this.logger.logDebug("BaseService::read()/01");
    await this.init();
    this.logger.logDebug("BaseService::read()/02");
    this.logger.logDebug(
      "BaseService::read()/serviceInput:",
      inspect(serviceInput, { depth: 2 }),
    );
    // const repo: any = await this.repo(req, res, serviceInput.serviceModel);

    await this.setRepo(serviceInput);

    this.logger.logDebug("BaseService::read()/03");
    let r: any = null;
    switch (serviceInput.cmd?.action) {
      case "find":
        try {
          this.logger.logDebug("BaseService::read()/031");
          this.logger.logDebug(
            "BaseService::read()/04/serviceInput.serviceModel:",
            serviceInput.serviceModel,
          );
          this.logger.logDebug(
            "BaseService::read()/04/serviceInput.modelName:",
            {
              modelName: serviceInput.modelName,
            },
          );
          // await this.init();
          // await this.setRepo(serviceInput);
          this.logger.logDebug("BaseService::read()/041");
          this.logger.logDebug(
            "BaseService::read()/this.repo:",
            inspect(this.repo, { depth: 2 }),
          );
          r = await this.repo.find(serviceInput.cmd?.query);
          this.logger.logDebug(
            `BaseService::read()/04/r:${inspect(r, { depth: 2 })}`,
          );
          if (serviceInput.extraInfo) {
            this.logger.logDebug("BaseService::read()/05");
            return {
              result: r,
              fieldMap: await this.feildMap(serviceInput),
            };
          } else {
            this.logger.logDebug("BaseService::read()/06");
            return await r;
          }
        } catch (err) {
          this.logger.logDebug("BaseService::read()/07");
          return await this.serviceErr(req, res, err, "BaseService:read");
        }
        break;
      case "count":
        try {
          r = await this.repo.count(serviceInput.cmd?.query);
          this.logger.logDebug("BaseService::read()/r:", r);
          return r;
        } catch (err) {
          return await this.serviceErr(req, res, err, "BaseService:read");
        }
        break;
    }

    // this.serviceErr(res, err, 'BaseService:read');
  }

  async readI(
    serviceInput: IServiceInput<T>,
  ): Promise<T[] | { result: T[]; fieldMap: any } | number> {
    this.logger.logDebug("BaseService::read()/01");
    await this.init();
    this.logger.logDebug("BaseService::read()/02");
    this.logger.logDebug(
      "BaseService::read()/serviceInput:",
      inspect(serviceInput, { depth: 2 }),
    );
    // const repo: any = await this.repo(req, res, serviceInput.serviceModel);

    await this.setRepo(serviceInput);

    this.logger.logDebug("BaseService::read()/03");
    let r: any = null;
    switch (serviceInput.cmd?.action) {
      case "find":
        try {
          this.logger.logDebug("BaseService::read()/031");
          this.logger.logDebug(
            "BaseService::read()/04/serviceInput.serviceModel:",
            serviceInput.serviceModel,
          );
          this.logger.logDebug(
            "BaseService::read()/04/serviceInput.modelName:",
            {
              modelName: serviceInput.modelName,
            },
          );
          // await this.init();
          // await this.setRepo(serviceInput);
          this.logger.logDebug("BaseService::read()/041");
          this.logger.logDebug(
            "BaseService::read()/this.repo:",
            inspect(this.repo, { depth: 2 }),
          );
          r = await this.repo.find(serviceInput.cmd?.query);
          this.logger.logDebug(
            `BaseService::read()/04/r:${inspect(r, { depth: 2 })}`,
          );
          if (serviceInput.extraInfo) {
            this.logger.logDebug("BaseService::read()/05");
            return {
              result: r,
              fieldMap: await this.feildMap(serviceInput),
            };
          } else {
            this.logger.logDebug("BaseService::read()/06");
            return await r;
          }
        } catch (err) {
          this.logger.logDebug("BaseService::read()/07");
          await this.serviceErrI(err, "BaseService:read");
          return [];
        }
        break;
      case "count":
        try {
          r = await this.repo.count(serviceInput.cmd?.query);
          this.logger.logDebug("BaseService::read()/r:", r);
          return r;
        } catch (err) {
          await this.serviceErrI(err, "BaseService:read");
          return 0;
        }
        break;
    }

    // this.serviceErr(res, err, 'BaseService:read');
  }

  //////////////////////////////////////////////////////////////////////////////////////////////
  // Read method
  async read2(
    req: Request,
    res: Response,
    si: IServiceInput<any>,
  ): Promise<any> {
    await this.init();
    // const repo = this.getRepository(si.serviceModel);
    await this.setRepo(si);
    let result;

    switch (si.cmd?.action) {
      case "find":
        result = await this.repo.find(si.cmd.query);
        break;
      case "findOne":
        result = await this.repo.findOne(si.cmd.query);
        break;
      case "queryBuilder":
        const qb = this.repo.createQueryBuilder();
        if (si.cmd.query) {
          // Apply`IQbInput`-style conditions to QueryBuilder
          const { select, where, take, skip } = si.cmd.query as any;
          qb.select(select).where(where);
          if (take) qb.take(take);
          if (skip) qb.skip(skip);
        }
        result = await qb.getMany();
        break;
      default:
        throw new Error(`Unknown action: ${si.cmd?.action}`);
    }

    return result;
  }

  //////////////////////////////////////////////////////////////////////////////

  read$(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Observable<any> {
    return from(this.read(req, res, serviceInput));
  }

  async readCount(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    await this.init();
    this.logger.logDebug(
      "BaseService::readCount()/repo/model:",
      serviceInput.serviceModel,
    );
    this.logger.logDebug(
      `BaseService::readCount()/repo/model:${serviceInput.serviceModel}`,
    );
    await this.setRepo(serviceInput);
    const repo: any = this.repo;
    try {
      const q: any = this.getQuery(req);
      this.logger.logDebug(`BaseService::readCount()/q:`, q);
      const [result, total] = await repo.findAndCount(q);
      return {
        items: result,
        count: total,
      };
    } catch (err) {
      return await this.serviceErr(req, res, err, "BaseService:readCount");
    }
  }

  readCount$(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Observable<any> {
    this.logger.logDebug(
      "BaseService::readCount$()/serviceInput:",
      serviceInput,
    );
    return from(this.readCount(req, res, serviceInput));
  }

  async readQB(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    await this.init();

    this.logger.logDebug(
      "BaseService::readQB()/repo/model:",
      serviceInput.serviceModel,
    );
    await this.setRepo(serviceInput);

    // Ensure the mapping is registered
    await this.entityAdapter.registerMappingFromEntity(
      serviceInput.serviceModel,
    );

    // Create the helper instance
    const queryBuilderHelper = new QueryBuilderHelper(this.repo);
    const repo: any = this.repo;

    try {
      const queryBuilder =
        await queryBuilderHelper.createQueryBuilder(serviceInput);
      this.logger.logDebug("BaseService::readQB/sql:", queryBuilder.getSql());

      let items = await queryBuilder.getRawMany();
      this.logger.logDebug("BaseService::readQB()/items:", items);

      const entityName = await this.entityAdapter.getEntityName(
        serviceInput.serviceModel,
      );
      items = this.entityAdapter.mapRawToEntity(entityName, items);

      this.logger.logDebug("BaseService::readQB()/Fetched-Items:", items);

      const count = await queryBuilder.getCount();
      this.logger.logDebug("Fetched Count:", count);

      return {
        items,
        count,
      };
    } catch (err) {
      console.error("Error in readQB:", err);
      return await this.serviceErr(req, res, err, "BaseService:readQB");
    }
  }

  readQB$(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Observable<any> {
    this.logger.logDebug("BaseService::readQB$()/serviceInput:", serviceInput);
    return from(this.readQB(req, res, serviceInput));
  }

  /**
   * For validating JSDPInstruction array
   * @param jsonUpdate
   * @param rootInterface
   * @returns
   */
  validateJsonUpdate<T>(
    jsonUpdate: JSDPInstruction[],
    rootInterface: T,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    function traversePath(
      currentPath: string[],
      currentInterface: any,
    ): boolean {
      // If no path left to validate, return true
      if (currentPath.length === 0) return true;

      const [currentKey, ...remainingPath] = currentPath;

      if (Array.isArray(currentInterface) && currentKey === "[0]") {
        // Check if the interface is an array and the key indicates an index
        return traversePath(remainingPath, currentInterface[0]);
      } else if (currentInterface && typeof currentInterface === "object") {
        // Check if the key exists in the interface
        if (!(currentKey in currentInterface)) {
          errors.push(
            `Invalid path key '${currentKey}' at '${currentPath.join(".")}'`,
          );
          return false;
        }
        // Continue traversing the remaining path
        return traversePath(remainingPath, currentInterface[currentKey]);
      } else {
        // If the structure doesn't match, log an error
        errors.push(
          `Unexpected type at '${currentPath.join(
            ".",
          )}'. Expected object or array.`,
        );
        return false;
      }
    }

    // Validate each update item
    jsonUpdate.forEach((update) => {
      if (!update.modelField || update.modelField !== "cdDevProjectData") {
        errors.push(`Invalid modelField: '${update.modelField}'`);
        return;
      }

      const { path } = update;
      if (!Array.isArray(path) || path.length === 0) {
        errors.push(`Invalid path: '${JSON.stringify(path)}'`);
        return;
      }

      // Start traversal from the root interface
      traversePath(path as string[], rootInterface);
    });

    return { valid: errors.length === 0, errors };
  }

  updateJsonData(jsonUpdate: JSDPInstruction, jsonData: any): any {
    this.logger.logDebug(
      "BaseService::updateJsonData()/jsonUpdate1:",
      jsonUpdate,
    );
    this.logger.logDebug("BaseService::updateJsonData()/jsonData1:", jsonData);

    try {
      // Validate `jsonUpdate` structure
      if (!jsonUpdate || typeof jsonUpdate !== "object") {
        this.err.push("Invalid jsonUpdate object.");
        return null;
      }
      if (!Array.isArray(jsonUpdate.path) || jsonUpdate.path.length === 0) {
        this.err.push("Invalid jsonUpdate path: Must be a non-empty array.");
        return null;
      }

      // Validate `jsonData`
      if (typeof jsonData !== "object" || jsonData === null) {
        this.err.push("Invalid jsonData: Must be a non-null object.");
        return null;
      }

      // Traverse the path to reach the target node
      let target = jsonData;
      const pathLength = jsonUpdate.path.length;

      for (let i = 0; i < pathLength - 1; i++) {
        const key = jsonUpdate.path[i] as string;
        this.logger.logDebug("BaseService::updateJsonData()/key0:", key);

        if (key.startsWith("[") && key.endsWith("]")) {
          this.logger.logDebug("BaseService::updateJsonData()/key1:", key);
          // Handle array index
          const index = parseInt(key.slice(1, -1), 10);
          if (isNaN(index) || !Array.isArray(target)) {
            this.err.push(
              `Invalid path at '${key}': Expected a valid array index in an array.`,
            );
            return null;
          }
          target = target[index];
        } else {
          // Handle object key
          this.logger.logDebug("BaseService::updateJsonData()/key2:", key);
          this.logger.logDebug("BaseService::updateJsonData()/target:", target);
          if (!Object.prototype.hasOwnProperty.call(target, key)) {
            this.err.push(`Path error: Key '${key}' does not exist.`);
            return null;
          }
          target = target[key];
        }
      }

      // Set the value at the target node
      const finalKey = jsonUpdate.path[pathLength - 1] as string;
      this.logger.logDebug(
        "BaseService::updateJsonData()/finalKey1:",
        finalKey,
      );
      if (finalKey.startsWith("[") && finalKey.endsWith("]")) {
        this.logger.logDebug(
          "BaseService::updateJsonData()/finalKey2:",
          finalKey,
        );
        const index = parseInt(finalKey.slice(1, -1), 10);
        if (isNaN(index) || !Array.isArray(target)) {
          this.err.push(
            `Invalid path at final key '${finalKey}': Expected a valid array index in an array.`,
          );
          return null;
        }
        this.logger.logDebug("BaseService::updateJsonData()/target2:", target);
        target[index] = jsonUpdate.value; // Update the value at the specified index
      } else {
        this.logger.logDebug(
          "BaseService::updateJsonData()/jsonUpdate.value:",
          jsonUpdate.value,
        );
        this.logger.logDebug("BaseService::updateJsonData()/target3:", target);
        this.logger.logDebug(
          "BaseService::updateJsonData()/finalKey3:",
          finalKey,
        );
        target[finalKey] = jsonUpdate.value; // Update the value at the specified key
      }

      this.logger.logDebug(
        "BaseService::updateJsonData()/jsonData3:",
        jsonData,
      );
      return jsonData; // Return the updated JSON data
    } catch (e: any) {
      // Catch unexpected errors and log them
      this.err.push(e.toString());
      return null;
    }
  }

  async readJSONColumnQB(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
    jsonField: string,
    keys: string[],
  ): Promise<any> {
    await this.init();
    this.logger.logDebug(
      "BaseService::readJSONColumnQB()/repo/model:",
      serviceInput.serviceModel,
    );
    await this.setRepo(serviceInput);

    const queryBuilderHelper = new QueryBuilderHelper(this.repo);
    const queryBuilder =
      await queryBuilderHelper.createQueryBuilder(serviceInput);

    // Use MySQL JSON_EXTRACT to extract specific fields from the JSON column
    keys.forEach((key) => {
      queryBuilder.addSelect(
        `JSON_UNQUOTE(JSON_EXTRACT(${jsonField}, '$.${key}'))`,
        key,
      );
    });

    try {
      const items = await queryBuilder.getRawMany();
      const entityName = await this.entityAdapter.getEntityName(
        serviceInput.serviceModel,
      );
      const processedItems = this.entityAdapter.mapRawToEntity(
        entityName,
        items,
      );

      return {
        items: processedItems,
        count: await queryBuilder.getCount(),
      };
    } catch (err) {
      return await this.serviceErr(
        req,
        res,
        err,
        "BaseService:readJSONColumnQB",
      );
    }
  }

  async updateJSONColumnQB(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
    jsonField: string,
    updates: Record<string, any>,
  ): Promise<any> {
    await this.init();
    this.logger.logDebug(
      "BaseService::updateJSONColumnQB()/repo/model:",
      serviceInput.serviceModel,
    );
    await this.setRepo(serviceInput);

    const buildJsonSetPaths = (
      jsonField: string,
      obj: any,
      prefix: string = "",
    ): string[] => {
      return Object.keys(obj)
        .map((key) => {
          const path = `${prefix}${prefix ? "." : ""}${key}`;
          if (typeof obj[key] === "object" && obj[key] !== null) {
            // Recursively handle nested objects
            return buildJsonSetPaths(jsonField, obj[key], path).join(", ");
          } else {
            // Use COALESCE to ensure JSON is initialized if null
            return `JSON_SET(COALESCE(${jsonField}, '{}'), '$.${path}', '${obj[key]}')`;
          }
        })
        .filter(Boolean);
    };

    // Generate the JSON_SET update query for the jsonField
    const updateFields = buildJsonSetPaths(jsonField, updates).join(", ");

    this.logger.logDebug(
      "BaseService::updateJSONColumnQB()/updates:",
      JSON.stringify(updates),
    );
    this.logger.logDebug(
      "BaseService::updateJSONColumnQB()/updateFields:",
      JSON.stringify(updateFields),
    );

    // Start building the query using the input provided in serviceInput.cmd?.query
    const queryBuilder = this.repo
      .createQueryBuilder()
      .update(serviceInput.serviceModel);

    // Handle dynamic update fields using the update property from QueryInput
    if (serviceInput.cmd?.query.update) {
      queryBuilder.set(serviceInput.cmd?.query.update);
    } else {
      // Fallback: use the JSON field update if no generic update is provided
      queryBuilder.set({ [jsonField]: () => updateFields });
    }

    const where = serviceInput.cmd?.query?.where;

    if (where && Object.keys(where).length > 0) {
      Object.keys(where).forEach((key) => {
        queryBuilder.andWhere(`${key} = :${key}`, {
          [key]: where[key],
        });
      });
    } else {
      // Fallback: Use the primary key based on the service model's convention <controller>_id
      const entityMetadata = this.ds.getMetadata(serviceInput.serviceModel);
      const primaryKey = entityMetadata.primaryColumns[0]?.propertyName;
      if (!primaryKey) {
        throw new Error(
          `No primary key found for model ${serviceInput.serviceModel.name}`,
        );
      }
      if (!serviceInput.cmd || !serviceInput.cmd?.query) {
        throw new Error(
          `serviceInput.cmd or serviceInput.cmd?.query is undefined`,
        );
      }
      queryBuilder.where(`${primaryKey} = :${primaryKey}`, {
        [primaryKey]: (serviceInput.cmd?.query as any)[primaryKey],
      });
    }

    try {
      // Execute the query
      return await queryBuilder.execute();
    } catch (err) {
      return await this.serviceErr(
        req,
        res,
        err,
        "BaseService:updateJSONColumnQB",
      );
    }
  }

  async deleteJSONColumnFieldQB(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
    jsonField: string,
    keys: string[],
  ): Promise<any> {
    await this.init();
    this.logger.logDebug(
      "BaseService::deleteJSONColumnFieldQB()/repo/model:",
      serviceInput.serviceModel,
    );
    await this.setRepo(serviceInput);

    // Generate the JSON_REMOVE query for the keys to remove from the jsonField
    const removeFields = keys
      .map((key) => `JSON_REMOVE(${jsonField}, '$.${key}')`)
      .join(", ");

    // Create the query builder and update the JSON field
    const queryBuilder = this.repo.createQueryBuilder();
    const primaryKey = serviceInput.primaryKey;
    if (!primaryKey) {
      throw new Error(
        "serviceInput.primaryKey is required for deleteJSONColumnFieldQB",
      );
    }
    // queryBuilder
    //   .update(serviceInput.serviceModel)
    //   .set({ [jsonField]: () => removeFields })
    //   .where(`${primaryKey} = :${primaryKey}`, {
    //     [primaryKey]: serviceInput.cmd?.query?.[primaryKey],
    //   });
    queryBuilder
      .update(serviceInput.serviceModel)
      .set({ [jsonField]: () => removeFields })
      .where(`${primaryKey} = :${primaryKey}`, {
        // Cast query to any to bypass the missing index signature check
        [primaryKey]: (serviceInput.cmd?.query as any)?.[primaryKey],
      });

    try {
      // Execute the query
      return await queryBuilder.execute();
    } catch (err) {
      return await this.serviceErr(
        req,
        res,
        err,
        "BaseService:deleteJSONColumnFieldQB",
      );
    }
  }

  // private getPrimaryKey(serviceModel: any): string {
  //     // Assuming the serviceModel's name follows the convention of ending with "Controller"
  //     const modelName = serviceModel.constructor.name.replace('Controller', '').toLowerCase();
  //     return `${modelName}_id`; // e.g., "user_id" for a UserController
  // }

  async readPaged(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    await this.init();
    // const repo = this.ds.getRepository(serviceInput.serviceModel);
    this.logger.logDebug(
      "BaseService::readPaged()/repo/model:",
      serviceInput.serviceModel,
    );
    // const repo: any = await this.repo(req, res, serviceInput.serviceModel)
    await this.setRepo(serviceInput);
    // this.setRepo(serviceInput.serviceModel)
    const repo: any = this.repo;
    try {
      const [result, total] = await repo.findAndCount(this.getQuery(req));
      return {
        items: result,
        count: total,
      };
    } catch (err) {
      return await this.serviceErr(req, res, err, "BaseService:readPaged");
    }
  }

  readPaged$(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Observable<any> {
    return from(this.readPaged(req, res, serviceInput));
  }

  async readCountSL(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    await this.initSqlite(req, res);
    try {
      // const repo = this.sqliteConn.getRepository(serviceInput.serviceModel);
      await this.setRepo(serviceInput);
      // this.setRepo(serviceInput.serviceModel)
      const repo: any = this.repo;
      const meta = await this.getEntityPropertyMapSL(
        req,
        res,
        serviceInput.serviceModel,
      );
      const [result, total] = await repo.findAndCount(this.getQuery(req));
      return {
        metaData: meta,
        items: result,
        count: total,
      };
    } catch (err) {
      return await this.serviceErr(req, res, err, "BaseService:readCount");
    }
  }

  readCountSL$(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Observable<any> {
    return from(this.readCountSL(req, res, serviceInput));
  }

  async feildMap(serviceInput: IServiceInput<any>) {
    const meta = this.ds.getMetadata(serviceInput.serviceModel).columns;
    return await meta.map((c: any) => {
      return {
        propertyPath: c.propertyPath,
        givenDatabaseName: c.givenDatabaseName,
        dType: c.type,
      };
    });
  }

  async feildMapSL(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ) {
    await this.initSqlite(req, res);
    // this.logger.logDebug('BaseService::feildMapSL()/this.sqliteConn:', this.sqliteConn)
    this.logger.logDebug(
      "BaseService::feildMapSL()/serviceInput:",
      serviceInput.serviceModel,
    );
    const meta = await this.ds.getMetadata(serviceInput.serviceModel).columns;
    return await meta.map(async (c: any) => {
      return {
        propertyPath: await c.propertyPath,
        givenDatabaseName: await c.givenDatabaseName,
        dType: await c.type,
      };
    });
  }

  async get(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    this.logger.logDebug("BaseService::get/serviceInput:", serviceInput);
    try {
      return await this.read(req, res, serviceInput);
    } catch (e: any) {
      this.logger.logDebug("BaseService::get()/e:", e);
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:update",
        app_msg: "",
      };
      this.serviceErr(req, res, e, i.code);
      return await new Promise((resolve, reject) => resolve(null));
    }
  }

  get$(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
    q: IQuery,
  ): Observable<any> {
    this.logger.logDebug("BaseService::get$/q:", q);
    // const serviceInput: IServiceInput<any> = {
    //     serviceModel: model,
    //     docName: 'BaseService::get',
    //     cmd: {
    //         action: 'find',
    //         query: q
    //     },
    //     dSource: 1
    // }
    this.logger.logDebug("BaseService::get$/serviceInput:", serviceInput);
    try {
      return this.read$(req, res, serviceInput);
    } catch (e: any) {
      this.logger.logDebug("BaseService::read$()/e:", e);
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:get$",
        app_msg: "",
      };
      this.serviceErr(req, res, e, i.code);
      return throwError(e);
    }
  }

  async readSL(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    try {
      this.initSqlite(req, res);
      // const repo = this.sqliteConn.getRepository(serviceInput.serviceModel);
      await this.setRepo(serviceInput);
      // this.setRepo(serviceInput.serviceModel)
      const repo: any = this.repo;
      const svSess = new SessionService();
      // const billRepository = this.sqliteConn.getRepository(BillModel)
      // const allBills = await billRepository.find()
      // this.logger.logDebug('allBills:', allBills)
      // this.i.app_msg = '';
      // this.setAppState(true, this.i, svSess.sessResp);
      // this.cdResp.data = allBills;
      // const r = await this.respond(req, res);

      let r: any = null;
      switch (serviceInput.cmd?.action) {
        case "find":
          try {
            r = await repo.find(serviceInput.cmd?.query);
            if (serviceInput.extraInfo) {
              return {
                result: r,
                fieldMap: await this.feildMapSL(
                  req as any,
                  res as any,
                  serviceInput,
                ),
              };
            } else {
              return await r;
            }
          } catch (err) {
            return await this.serviceErr(req, res, err, "BillService:read");
          }
          break;
        case "count":
          try {
            r = await repo.count(serviceInput.cmd?.query);
            this.logger.logDebug("BillService::read()/r:", r);
            return r;
          } catch (err) {
            return await this.serviceErr(req, res, err, "BillService:read");
          }
          break;
      }
      // this.serviceErr(res, err, 'BaseService:read');
    } catch (e: any) {
      return await this.serviceErr(req, res, e, "BillService:read");
    }
  }

  readSL$(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Observable<any> {
    return from(this.readSL(req, res, serviceInput));
  }

  async update(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    let ret: any = [];
    try {
      await this.init();
      // await this.setRepo(serviceInput.serviceModel)
      await this.setRepo(serviceInput);
      // const serviceRepository = await this.ds.getRepository(serviceInput.serviceModel);
      this.logger.logDebug(
        "BaseService::update()/repo/model:",
        serviceInput.serviceModel,
      );
      // const serviceRepository: any = await this.repo(req, res, serviceInput.serviceModel)
      const serviceRepository: any = this.repo;
      const result = await serviceRepository.update(
        serviceInput.cmd?.query.where,
        await this.fieldsAdaptor(serviceInput.cmd?.query.update, serviceInput),
      );
      if ("affected" in result) {
        this.cdResp.app_state.success = true;
        this.cdResp.app_state.info.app_msg = `${result.affected} record/s updated`;
        ret = result;
      } else {
        this.cdResp.app_state.success = false;
        this.cdResp.app_state.info.app_msg = `some error occorred`;
        if (this.debug) {
          ret = result;
        }
      }
      return ret;
    } catch (e: any) {
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:update",
        app_msg: "",
      };
      // await this.setAppState(false, i, null);
      await this.serviceErr(req, res, e, i.code);
      return this.cdResp;
    }
  }

  update$(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    return from(this.update(req, res, serviceInput));
  }

  /**
   * For internal use
   * @param req
   * @param res
   * @param serviceInput
   * @returns
   */
  async updateI(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<T>,
  ): Promise<CdFxReturn<UpdateResult> | UpdateResult | ICdResponse> {
    try {
      const repository = this.db.getRepository(serviceInput.serviceModel);

      // Ensure update is cast to the correct TypeORM update type
      const updateData = serviceInput.cmd!.query
        .update as unknown as QueryDeepPartialEntity<T>;

      const updateResult = await repository.update(
        serviceInput.cmd!.query.where,
        updateData,
      );

      if (req) {
        return updateResult;
      } else {
        return {
          data: updateResult,
          state: true,
          message: "Updated successfully",
        };
      }
    } catch (e: any) {
      await this.serviceErr(req, res, e, "BaseService:updateI");
      if (req) {
        return this.cdResp;
      } else {
        return { state: false, data: null, message: (e as Error).toString() };
      }
    }
  }

  async updateSL(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<void> {
    this.logger.logDebug("BillService::updateSL()/01");
    await this.initSqlite(req, res);
    const svSess = new SessionService();
    // const repo: any = await this.sqliteConn.getRepository(serviceInput.serviceModel);
    // this.setRepo(serviceInput.serviceModel)
    await this.setRepo(serviceInput);
    const repo: any = this.repo;
    const result = await repo.update(
      serviceInput.cmd?.query.where,
      await this.fieldsAdaptorSL(
        req,
        res,
        serviceInput.cmd?.query.update,
        serviceInput,
      ),
    );
    this.logger.logDebug("result:", result);
    // this.cdResp.data = ret;
    svSess.sessResp.ttl = svSess.getTtl();
    this.setAppState(true, this.i, svSess.sessResp);
    this.cdResp.data = result;
    this.respond(req, res);
  }

  updateSL$(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    return from(this.updateSL(req, res, serviceInput));
  }

  /**
   * this method is used to modify values as desired for
   * acceptance to db.
   * @param fieldsData
   * @param serviceInput
   * @returns
   */
  async fieldsAdaptor(fieldsData: any, serviceInput: IServiceInput<any>) {
    // get model properties
    const propMap = await this.feildMap(serviceInput);
    for (const fieldName in fieldsData) {
      if (fieldName) {
        const fieldMapData: any = propMap.filter(
          (f: any) => f.propertyPath === fieldName,
        );

        /**
         * adapt boolean values as desired
         * in the current case, typeorm rejects 1, "1" as boolean so
         * we convert them as desired;
         */
        if (fieldMapData[0]) {
          if (this.fieldIsBoolean(fieldMapData[0].dType)) {
            if (this.isTrueish(fieldsData[fieldName])) {
              fieldsData[fieldName] = true;
            } else {
              fieldsData[fieldName] = false;
            }
          }
        }
      }
    }
    return fieldsData;
  }

  async fieldsAdaptorSL(
    req: Request,
    res: Response,
    fieldsData: any,
    serviceInput: IServiceInput<any>,
  ) {
    // get model properties
    const propMap = await this.feildMapSL(req, res, serviceInput);
    for (const fieldName in fieldsData) {
      if (fieldName) {
        const fieldMapData: any = propMap.filter(
          (f: any) => f.propertyPath === fieldName,
        );

        /**
         * adapt boolean values as desired
         * in the current case, typeorm rejects 1, "1" as boolean so
         * we convert them as desired;
         */
        if (fieldMapData[0]) {
          if (this.fieldIsBoolean(fieldMapData[0].dType)) {
            if (this.isTrueish(fieldsData[fieldName])) {
              fieldsData[fieldName] = true;
            } else {
              fieldsData[fieldName] = false;
            }
          }
        }
      }
    }
    return fieldsData;
  }

  fieldIsBoolean(fieldType: any): boolean {
    return fieldType.toString() === "function Boolean() { [native code] }";
  }

  isTrueish(val: any) {
    let ret = false;
    switch (val) {
      case true:
        ret = true;
        break;
      case "true":
        ret = true;
        break;
      case 1:
        ret = true;
        break;
      case "1":
        ret = true;
        break;
    }
    return ret;
  }

  async delete(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    this.logger.logDebug("BaseService::delete()/01");
    let ret: any = [];
    await this.init();
    await this.setRepo(serviceInput);
    // await this.setRepo(serviceInput.serviceModel)
    // const serviceRepository = await this.ds.getRepository(serviceInput.serviceModel);
    this.logger.logDebug(
      "BaseService::delete()/repo/model:",
      serviceInput.serviceModel,
    );
    // const serviceRepository: any = await this.repo(req, res, serviceInput.serviceModel)
    const serviceRepository: any = this.repo;
    const result = await serviceRepository.delete(
      serviceInput.cmd?.query.where,
    );

    if ("affected" in result) {
      this.cdResp.app_state.success = true;
      this.cdResp.app_state.info.app_msg = `${result.affected} record/s deleted`;
      ret = result;
    } else {
      this.cdResp.app_state.success = false;
      this.cdResp.app_state.info.app_msg = `some error occorred`;
      if (this.debug) {
        ret = result;
      }
    }
    return ret;
  }

  delete$(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    return from(this.delete(req, res, serviceInput));
  }

  async deleteSL(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ) {
    this.logger.logDebug("BillService::updateSL()/01");
    let ret: any = [];
    await this.initSqlite(req, res);
    const repo = await this.sqliteConn.getRepository(serviceInput.serviceModel);
    const result = await repo.delete(serviceInput.cmd?.query.where);
    this.logger.logDebug("BaseService::deleteSL()/result:", result);
    if ("affected" in result) {
      this.cdResp.app_state.success = true;
      this.cdResp.app_state.info.app_msg = `${result.affected} record/s deleted`;
      ret = result;
    } else {
      this.cdResp.app_state.success = false;
      this.cdResp.app_state.info.app_msg = `some error occorred`;
      if (this.debug) {
        ret = result;
      }
    }
    return ret;
  }

  deleteSL$(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    return from(this.deleteSL(req, res, serviceInput));
  }

  //////////////////////////
  // TEST JSON MYSQL QUERY:

  /**
     * 
         {
            "ctx": "Sys",
            "m": "InteRact",
            "c": "InteRactPub",
            "a": "TestJsonQuery",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "select": [
                                "inte_ract_pub_id",
                                "inte_ract_pub_name",
                                "inte_ract_pub_description",
                                "inte_ract_pub_guid",
                                "doc_id",
                                "inte_ract_pub_type_id",
                                "public",
                                "m",
                                "c",
                                "j_val"
                            ],
                            "where": [
                                {
                                    "conjType": "",
                                    "dataType":"json",
                                    "field": "j_val",
                                    "jPath": "'$.domain.group.doc_id'",
                                    "operator": "=",
                                    "val": 11091
                                },
                                {
                                    "field": "doc_id",
                                    "fieldType": "json",
                                    "operator": "=",
                                    "val": 11121,
                                    "conjType": "and" 
                                }
                            ]
                        }
                    }
                ],
                "token": "fc735ce6-b52f-4293-9332-0181a49231c4"
            },
            "args": {}
        }
    * @param filter 
    */
  // type orm query json column
  // this.repo.query('SELECT some-column->"$.email_verification.token" as `token`  FROM `user` WHERE some-column->"$.email_verification.token" = "some-token";');

  // getManager().getRepository(User)
  //     .createQueryBuilder('user')
  //     .select()
  //     .where(`user.address ::jsonb @> \'{"state":"${query.location}"}\'`)

  async readJSON(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    this.logger.logDebug("BaseService::readJSON()/01");
    await this.init();
    // await this.setRepo(serviceInput.serviceModel)
    await this.setRepo(serviceInput);
    this.logger.logDebug("BaseService::readJSON()/02");
    this.logger.logDebug("BaseService::readJSON()/repo/model:", {
      serviceModel: serviceInput.serviceModel,
    });
    // const repo: any = await this.repo(req, res, serviceInput.serviceModel);
    const repo: any = this.repo;
    this.logger.logDebug("BaseService::readJSON()/03");
    let r: any = null;
    const q = serviceInput.cmd?.query;
    switch (serviceInput.cmd?.action) {
      case "find":
        try {
          this.logger.logDebug("BaseService::readJSON()/031");
          // r = await repo.find(serviceInput.cmd?.query);
          this.logger.logDebug("BaseService::readJSON()/q:", q);
          // working- option 1:
          // r = await repo.query('SELECT * FROM `inte_ract_pub` WHERE j_val->"$.domain.group.doc_id" = 11091;');

          // working-option 2:
          r = await repo
            .createQueryBuilder("inte_ract_pub")
            /**
             * at the moment any effort to query selected fields
             * have not worked. No error but returns []
             * below options have been tested
             * .select(q.select) with q.select as array of fields
             * .select(['inte_ract_pub.inte_ract_pub_id'])
             * NB: When config is set with logs on, the same sql generated retrieves data but
             * when used here, there is and empry [] as result.
             */
            .select()
            .where(`${this.getQbFilter(<IQbInput<any>>q)}`)
            .getMany();
          this.logger.logDebug("BaseService::readJSON()/04");
          if (serviceInput.extraInfo) {
            this.logger.logDebug("BaseService::readJSON()/05");
            return {
              result: r,
              fieldMap: await this.feildMap(serviceInput),
            };
          } else {
            this.logger.logDebug("BaseService::readJSON()/06");
            return await r;
          }
        } catch (err) {
          this.logger.logDebug("BaseService::readJSON()/07");
          return await this.serviceErr(req, res, err, "BaseService:read");
        }
        break;
      case "count":
        try {
          r = await repo.count(serviceInput.cmd?.query);
          this.logger.logDebug("BaseService::readJSON()/r:", r);
          return r;
        } catch (err) {
          return await this.serviceErr(req, res, err, "BaseService:readJSON");
        }
        break;
    }

    // this.serviceErr(res, err, 'BaseService:read');
  }

  readJSON$(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Observable<any> {
    return from(this.readJSON(req, res, serviceInput));
  }

  /**
   * Resolve rows using semantic JSON lookup instructions (JSDP).
   *
   * Purpose:
   * - Search JSON columns semantically
   * - Keep JSON lookup responsibility OUTSIDE IQuery.where
   * - Translate JSDP -> SQL JSON predicates
   *
   * Current implementation:
   * - MySQL/MariaDB focused
   * - Supports:
   *    - action = "read"
   *    - op = "eq"
   *
   * Future evolution:
   * - contains
   * - startsWith
   * - regex
   * - nested array traversal
   * - PostgreSQL JSONB
   * - Mongo semantic adapter
   */
  async findByJSDPInstruction(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
    instruction: JSDPInstruction,
  ): Promise<any[]> {
    try {
      await this.init();

      this.logger.logDebug(
        `[BaseService][findByJSDPInstruction] instruction: ${inspect(instruction, { depth: 3 })}`,
      );

      /**
       * Validate service model
       */
      if (!serviceInput?.serviceModel) {
        throw new Error("serviceInput.serviceModel is required");
      }

      /**
       * Validate instruction
       */
      if (!instruction) {
        throw new Error("JSDPInstruction is required");
      }

      if (instruction.action !== "read") {
        throw new Error(`Unsupported JSDP action: ${instruction.action}`);
      }

      if (!Array.isArray(instruction.path) || instruction.path.length < 2) {
        throw new Error("JSDP path must contain at least [jsonField, key]");
      }

      /**
       * Set repository
       */
      await this.setRepo(serviceInput);

      const repo: any = this.repo;

      /**
       * Path semantics:
       *
       * [
       *   "cdBioEngineDnaSrc",
       *   "url"
       * ]
       *
       * =>
       *
       * jsonField = cdBioEngineDnaSrc
       * jsonPath  = $.url
       */
      const [jsonField, ...jsonPathParts] = instruction.path as string[];

      const jsonPath = `$.${jsonPathParts.join(".")}`;

      /**
       * Normalize value
       */
      let value = instruction.value;

      /**
       * Handle accidentally stringified payloads
       */
      if (
        typeof value === "string" &&
        (value.startsWith('"') || value.startsWith("'"))
      ) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // keep original value
        }
      }

      this.logger.logDebug(
        "[BaseService][findByJSDPInstruction] jsonField:",
        jsonField,
      );

      this.logger.logDebug(
        "[BaseService][findByJSDPInstruction] jsonPath:",
        jsonPath,
      );

      this.logger.logDebug(
        "[BaseService][findByJSDPInstruction] value:",
        value,
      );

      /**
       * Build query
       */
      const qb = repo.createQueryBuilder("entity");

      /**
       * Operator support
       *
       * Currently:
       * - eq
       *
       * Future:
       * - contains
       * - regex
       * - gt
       * - lt
       * - startsWith
       */
      const op = (instruction as any).op || "eq";

      this.logger.logDebug("[BaseService][findByJSDPInstruction] op:", op);

      switch (op) {
        case "eq":
          qb.andWhere(
            `
          JSON_UNQUOTE(
            JSON_EXTRACT(
              entity.${jsonField},
              :jsonPath
            )
          ) = :value
          `,
            {
              jsonPath,
              value,
            },
          );

          break;

        default:
          throw new Error(`Unsupported JSDP operator: ${op}`);
      }

      /**
       * Debug generated SQL
       */
      this.logger.logDebug(
        "[BaseService][findByJSDPInstruction] sql:",
        qb.getSql(),
      );

      /**
       * Execute query
       */
      const rows = await qb.getMany();

      this.logger.logDebug(
        `[BaseService][findByJSDPInstruction] rows: ${inspect(rows, { depth: 3 })}`,
      );

      return rows;
    } catch (e: any) {
      this.logger.logDebug("[BaseService][findByJSDPInstruction] error:", e);

      await this.serviceErr(req, res, e, "BaseService:findByJSDPInstruction");

      return [];
    }
  }

  getQbFilter(q: IQbInput<any>) {
    let ret = "";
    q.where.forEach((qItem: any) => {
      let conjType = "";
      if (qItem.conjType) {
        conjType = qItem.conjType;
      }
      if (qItem.dataType === "json") {
        ret += ` ${conjType} JSON_EXTRACT(${qItem.field}, ${qItem.jPath}) ${qItem.operator} ${qItem.val} `;
      } else {
        ret += ` ${conjType} ${qItem.field} ${qItem.operator} ${qItem.val} `;
      }
    });
    return ret;
  }
  /////////////////////////
  // Redis stuff

  async redisInit(req: Request, res: Response) {
    this.redisClient = createClient();
    this.redisClient.on("error", async (err: any) => {
      this.logger.logDebug("BaseService::redisCreate()/02");
      this.err.push((err as Error).toString());
      const i = {
        messages: this.err,
        code: "BaseService:redisCreate",
        app_msg: "",
      };
      await this.serviceErr(req, res, this.err, "BaseService:redisCreate");
      return this.cdResp;
    });

    await this.redisClient.connect();
  }

  async wsRedisInit() {
    this.logger.logDebug("BaseService::wsRedisInit()/01");
    this.redisClient = createClient();
    this.logger.logDebug(
      "BaseService::wsRedisInit()/this.redisClient:",
      this.redisClient,
    );
    this.redisClient.on("error", async (err: any) => {
      this.logger.logDebug("BaseService::redisCreate()/err:", err);
      this.err.push((err as Error).toString());
      const i = {
        messages: this.err,
        code: "BaseService:redisCreate",
        app_msg: "",
      };
      await this.wsServiceErr(this.err, "BaseService:redisCreate");
      return this.cdResp;
    });
    await this.redisClient.connect();
  }

  async redisCreate(req: Request, res: Response) {
    await this.redisInit(req, res);
    this.logger.logDebug("BaseService::redisCreate()/01");
    const pl: CacheData = await this.getPlData(req);
    this.logger.logDebug("BaseService::redisCreate()/pl:", pl);
    try {
      const setRet = await this.redisClient.set(pl.key, pl.value);
      this.logger.logDebug("BaseService::redisCreate()/setRet:", setRet);
      const readBack = await this.redisClient.get(pl.key);
      this.logger.logDebug("BaseService::redisCreate()/readBack:", readBack);
      return {
        status: setRet,
        saved: readBack,
      };
    } catch (e: any) {
      this.logger.logDebug("BaseService::redisCreate()/04");
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:redisCreate",
        app_msg: "",
      };
      await this.serviceErr(req, res, this.err, "BaseService:redisCreate");
      return this.cdResp;
    }
  }

  async wsRedisCreate(k: any, v: any) {
    await this.wsRedisInit();
    try {
      const setRet = await this.redisClient.set(k, v);
      this.logger.logDebug(
        `BaseService::wsRedisCreate()/setRet:${JSON.stringify(setRet)}`,
      );
      const readBack = await this.redisClient.get(k);
      this.logger.logDebug(
        `BaseService::wsRedisCreate()/readBack:${JSON.stringify(readBack)}`,
      );
      return {
        status: setRet,
        saved: readBack,
      };
    } catch (e: any) {
      this.logger.logDebug("BaseService::wsRedisCreate()/04");
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:wsRedisCreate",
        app_msg: "",
      };
      await this.wsServiceErr(this.err, "BaseService:redisCreate");
      return this.cdResp;
    }
  }

  async redisRead(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ) {
    this.logger.logDebug("BaseService::redisRead()/01");
    await this.redisInit(req, res);
    this.logger.logDebug("BaseService::redisRead()/02");
    const pl: CacheData = await this.getPlData(req);
    this.logger.logDebug("BaseService::redisRead()/pl:", pl);
    try {
      const getRet = await this.redisClient.get(pl.key);
      this.logger.logDebug("BaseService::redisRead()/getRet:", getRet);
      return getRet;
    } catch (e: any) {
      this.logger.logDebug("BaseService::redisRead()/04");
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:redisRead",
        app_msg: "",
      };
      await this.serviceErr(req, res, this.err, "BaseService:redisRead");
      return this.cdResp;
    }
  }

  async wsRedisRead(k: any) {
    this.logger.logDebug("BaseService::wsRedisRead()/k:", k);
    const ret = {
      r: "",
      error: null,
    };
    // await this.wsRedisInit();
    try {
      // const getRet = await this.redisClient.get(k);
      ret.r = (await this.svRedis.get(k)) as string;
      this.logger.logDebug("BaseService::redisRead()/ret:", { result: ret });
      return ret;
    } catch (e: any) {
      this.logger.logDebug("BaseService::redisRead()/04");
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:redisRead",
        app_msg: "",
      };
      await this.wsServiceErr(this.err, "BaseService:redisRead");
      // return this.cdResp;
      ret.error = e.toString();
      return ret;
    }
  }

  redisDelete(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    this.redisClient.del("foo", (err: Error, reply: any) => {
      if (err) throw err;
      this.logger.logDebug(reply);
    });
  }

  async redisAsyncRead(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ) {
    return new Promise((resolve, reject) => {
      this.redisClient.get("myhash", (err: Error, data: any) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }

  async wsServiceErr(e: string[], eCode: any, cdToken?: string) {
    this.logger.logDebug(
      `Error as BaseService::wsServiceErr, e: ${e.toString()} `,
    );
    const svSess = new SessionService();
    svSess.sessResp.cd_token = cdToken;
    svSess.sessResp.ttl = svSess.getTtl();
    this.setAppState(true, this.i, svSess.sessResp);
    this.err.push(e.toString());
    const i = {
      messages: await this.err,
      code: eCode,
      app_msg: `Error at ${eCode}: ${e.toString()}`,
    };
    await this.setAppState(false, i, svSess.sessResp);
    this.cdResp.data = [];
  }

  async bFetch(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    try {
      this.logger.logDebug("BaseService::fetch()/01");

      if (
        !serviceInput.fetchInput ||
        !serviceInput.fetchInput.url ||
        !serviceInput.fetchInput.options
      ) {
        throw new Error(
          "fetchInput or its properties are not defined in serviceInput",
        );
      }

      const response = await fetch(
        serviceInput.fetchInput.url,
        serviceInput.fetchInput.options,
      );
      const data = await response.json();
      // this.logger.logDebug(JSON.stringify(data, null, 2));
      return data;
    } catch (e: any) {
      this.err.push(e.toString());
      const i = {
        messages: this.err,
        code: "BaseService:update",
        app_msg: "",
      };
      // await this.setAppState(false, i, null);
      await this.serviceErr(req, res, e, i.code);
      return this.cdResp;
    }
  }

  // the modified query is a collection of filters that are based
  // on several parameters. When applied against some models, some parameters may not be compatible
  // validateQuery() removes parameters that are not valid for given models
  /**
   * Validates the `where` clause of a query object by removing fields that do not match properties in the model.
   * Supports both conjunction (AND) and disjunction (OR) queries.
   * @param q - The query object with a `where` clause.
   * @param model - The model object containing valid database fields.
   * @returns The validated query object.
   */
  async validateQuery<T>(
    q: { where: Record<string, any> | Record<string, any>[] },
    model: T,
  ): Promise<{ where: Record<string, any> | Record<string, any>[] }> {
    if (!q.where || (typeof q.where !== "object" && !Array.isArray(q.where))) {
      console.warn("Invalid 'where' clause in query object.");
      return q;
    }

    // Extract model keys using `Object.keys` directly on the model instance
    const modelKeys = new Set(Object.keys(model as any));

    // Helper function to filter a single `where` object
    const filterWhere = (whereClause: Record<string, any>) => {
      return Object.keys(whereClause)
        .filter((key) => modelKeys.has(key))
        .reduce(
          (acc, key) => {
            acc[key] = whereClause[key];
            return acc;
          },
          {} as Record<string, any>,
        );
    };

    // Handle `where` as an array (OR query)
    if (Array.isArray(q.where)) {
      q.where = q.where.map((whereClause) => filterWhere(whereClause));
    } else {
      // Handle `where` as an object (AND query)
      q.where = filterWhere(q.where);
    }

    return q;
  }

  //////////////////////////////////////////////////

  async validateInputRefernce(
    msg: string,
    validationResponse: any[],
    svSess: SessionService,
  ): Promise<boolean> {
    if (validationResponse.length > 0) {
      this.logger.logDebug("BaseService::validateCreate()/1");
      return true;
    } else {
      // this.logger.logDebug('BaseService::validateCreate()/2')
      // this.i.app_msg = `${validationItem} reference is invalid`;
      // this.err.push(this.i.app_msg);
      // this.setAppState(false, this.i, svSess.sessResp);
      this.setAlertMessage(msg, svSess, false);
      return false;
    }
  }

  async setAlertMessage(msg: string, svSess: SessionService, success: boolean) {
    this.i.app_msg = msg;
    this.err.push(this.i.app_msg);
    await this.setAppState(success, this.i, svSess.sessResp);
  }

  logTimeStamp(msg?: string) {
    const first_parameter = arguments[0];
    const other_parameters = Array.prototype.slice.call(arguments, 1);

    function formatConsoleDate(date: Date) {
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const milliseconds = date.getMilliseconds();

      return (
        "[" +
        (hour < 10 ? "0" + hour : hour) +
        ":" +
        (minutes < 10 ? "0" + minutes : minutes) +
        ":" +
        (seconds < 10 ? "0" + seconds : seconds) +
        "." +
        ("00" + milliseconds).slice(-3) +
        "] : " +
        msg
      );
    }

    console.log.apply(
      console,
      [formatConsoleDate(new Date()) + first_parameter].concat(
        other_parameters,
      ),
    );
  }

  controllerCreate(req: Request, res: Response) {
    return 1;
  }

  controllerUpdate(req: Request, res: Response) {
    return 1;
  }

  controllerDelete(req: Request, res: Response) {
    return 1;
  }

  intersect(arrA: any, arrB: any, intersectionField: any) {
    return Lá.intersectionBy(arrA, arrB, intersectionField);
  }

  intersectionLegacy = (arr1: any, arr2: any) => {
    const res = [];
    // for(let i = 0; i < arr1.length; i++){
    for (const i of arr1) {
      if (!arr2.includes(i)) {
        continue;
      }
      res.push(i);
    }
    return res;
  };

  intersectMany = (...arrs: any[]) => {
    let res = arrs[0].slice();
    for (let i = 1; i < arrs.length; i++) {
      res = this.intersectionLegacy(res, arrs[i]);
    }
    return res;
  };

  isEmpty(value: any) {
    return value == null || value.length === 0;
  }

  /**
   *
   * The type K is constrained to be a value computed from the keyof operator on
   * type T. Remember that the keyof operator will return a string literal type that is made
   * up of the properties of an object, so K will be constrained to the property names of
   * the type T.
   *
   * @param object
   * @param key
   */
  getProperty<T, K extends keyof T>(object: T, key: K) {
    const propertyValue = object[key];
  }

  ///////////////////////

  createClassInstance<T>(arg1: new () => T): T {
    return new arg1();
  }

  // new crude base after upgrading typeorm
  // 31 oct 2023
  /////////////////////

  async setRepo(serviceInput: IServiceInput<any>) {
    // const AppDataSource = await getDataSource();
    // this.repo = AppDataSource.getRepository(serviceInput.serviceModel);
    this.repo = this.ds.getRepository(serviceInput.serviceModel);
  }

  async all(request: Request, response: Response, next: NextFunction) {
    return this.repo.find();
  }

  async one(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.userId as string);

    const user = await this.repo.findOne({
      where: { userId: id },
    });

    if (!user) {
      return "unregistered user";
    }
    return user;
  }

  async save(
    request: Request,
    response: Response,
    serviceInput: IServiceInput<any>,
    next: NextFunction,
  ) {
    const item = Object.assign(serviceInput.serviceInstance, serviceInput.data);
    return this.repo.save(item);
  }

  async remove(request: Request, response: Response, next: NextFunction) {
    const id = parseInt(request.params.id as string);

    let userToRemove = await this.repo.findOneBy({ userId: id });

    if (!userToRemove) {
      return "this user not exist";
    }

    await this.repo.remove(userToRemove);

    return "user has been removed";
  }

  //////////////////////////////////////////////////////////////

  isEmptyObject(obj: any): boolean {
    return Object.keys(obj).length === 0;
  }

  /**
   * @deprecated
   * This method was an early helper to construct IServiceInput for read/find operations.
   * Use `serviceInputGet()` instead, which follows clearer naming conventions.
   *
   * @param q - The IQuery object defining filters, pagination, etc.
   * @param dn - A human-readable docName for logging/debugging (e.g., 'Get Members')
   * @param model - The model constructor to query (e.g., CoopMemberModel)
   * @returns IServiceInput - A well-structured input object for BaseService read methods
   */
  siGet<T>(q: IQuery, dn: string, model: new () => T): IServiceInput<any> {
    return {
      serviceModel: model,
      docName: dn,
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
  }

  /**
   * Constructs a standardized IServiceInput object for read operations.
   *
   * Recommended replacement for the deprecated `siGet()` method.
   * Used when performing actions like find, list, or fetch with filters.
   *
   * @param query - IQuery object (filter, take, skip, select, etc.)
   * @param docName - Descriptive name for tracing/debugging/logging purposes
   * @param model - The model class (constructor function) to be used in the query
   * @returns IServiceInput object for use with read operations
   */
  serviceInputGet<T>(
    query: IQuery,
    docName: string,
    model: new () => T,
  ): IServiceInput<any> {
    return {
      serviceModel: model,
      docName,
      cmd: {
        action: "find",
        query,
      },
      dSource: 1,
    };
  }

  /**
   * Constructs a standardized IServiceInput object for Create, Update, or Delete operations.
   *
   * Includes reference to the service instance, its model, and metadata such as docName.
   * This method is intended for general use across all non-read (CRUD) operations.
   *
   * @param serviceInstance - The active service instance (e.g., `this`)
   * @param docName - Optional descriptive name; defaults to "CRUD <ModelName>" if not provided
   * @returns IServiceInput object suitable for create/update/delete operations
   */
  serviceInputCRUD(serviceInstance: any): IServiceInput<any> {
    const modelName =
      serviceInstance.modelName ||
      (serviceInstance.serviceModel?.constructor?.name ?? "UnknownModel");
    const methodName = this.getCallerFunctionName();
    const className = serviceInstance.constructor?.name || "UnknownService";

    return {
      serviceInstance,
      serviceModel: serviceInstance.serviceModel.constructor, // ✅ FIXED
      modelName,
      serviceModelInstance: serviceInstance.serviceModel,
      docName: `${methodName} ${className}`,
      dSource: 1,
    };
  }

  /**
   * Logs structured debug information with timestamp, class/method context, and data.
   * Automatically resolves the calling method name and supports rich data inspection.
   *
   * @param thisArg - The calling class instance (usually `this`)
   * @param message - A message to include in the log
   * @param data - Optional data to be logged alongside
   * @param level - Optional log level (default is "debug")
   */
  async logWithContext(
    thisArg: any,
    message: string,
    data?: any,
    level: "debug" | "info" | "warn" | "error" = "debug",
  ) {
    // const chalk = await import("chalk");
    const caller = this.getCallerInfo(4); // customizable stack depth
    const className = thisArg.constructor?.name || "UnknownClass";
    const timestamp = new Date().toLocaleString("en-KE", {
      timeZone: process.env.TZ || "Africa/Nairobi",
    });

    const prefix = `[${timestamp}] [${className}::${caller.method}():${caller.line}]`;

    const logMsg = data
      ? `${prefix}: ${message} — ${inspect(data, { depth: 3, colors: true })}`
      : `${prefix}: ${message}`;

    switch (level) {
      case "info":
        console.log(chalk.green(logMsg));
        break;
      case "warn":
        console.warn(chalk.yellow(logMsg));
        break;
      case "error":
        console.error(chalk.red(logMsg));
        break;
      default:
        console.debug(chalk.blueBright(logMsg));
        break;
    }
  }

  /**
   * Returns the method name and line number of the calling function.
   * Useful for contextual logging.
   *
   * @param depth - Stack depth to resolve the actual caller
   * @returns An object with method and line
   */
  getCallerInfo(depth = 3): { method: string; line: string } {
    const stack = new Error().stack?.split("\n") || [];
    const targetLine = stack[depth] || "";

    const methodMatch = targetLine.match(/at (\w+)/);
    const method = methodMatch?.[1] || "unknownMethod";

    const lineMatch = targetLine.match(/:(\d+):\d+\)?$/);
    const line = lineMatch?.[1] || "??";

    return { method, line };
  }

  /**
   * Utility to get the name of the function that called the current method.
   * This uses stack trace introspection — may vary slightly by environment.
   */
  /**
   * Extracts the name of the caller function from the stack trace.
   * @param depth - Optional depth in the call stack. Default is 3.
   *                Increase it if more stack frames are involved.
   */
  private getCallerFunctionName(depth: number = 3): string {
    const err = new Error();
    const stack = err.stack?.split("\n") || [];

    // Example:
    // [0] Error
    // [1] at getCallerFunctionName...
    // [2] at logWithContext...
    // [3] at create...  <-- default
    const callerLine = stack[depth] || "";
    const match = callerLine.match(/at (\w+)/);
    return match?.[1] ?? "unknownMethod";
  }

  async beforeCreateGeneric(
    req: Request,
    fieldMap: Record<string, any>,
  ): Promise<boolean> {
    for (const [key, value] of Object.entries(fieldMap)) {
      const finalValue = value === "GUID" ? this.getGuid() : value;
      this.setPlData(req, { key, value: finalValue });
    }
    return true;
  }

  getPlValue(req: any, key: string, fValsIndex: number | null = null): any {
    const data = this.getPlData(req, null, fValsIndex);
    return data?.[key];
  }

  async exists<T>(
    req: Request,
    res: Response,
    field: string,
    model: any,
    value: any,
  ): Promise<boolean> {
    const svSess = new SessionService();

    if (value === undefined || value === null) {
      this.i.app_msg = `${field} is required for existence check`;
      this.err.push(this.i.app_msg);
      await this.setAppState(false, this.i, svSess.sessResp);
      return false;
    }

    const serviceInput = {
      serviceModel: model,
      docName: `BaseService::exists(${field})`,
      cmd: { action: "find", query: { where: { [field]: value } } },
      dSource: 1,
    };

    try {
      const result = await this.read(req, res, serviceInput);

      // If result is a plain array
      if (Array.isArray(result)) {
        return result.length > 0;
      }

      // If result is a CdFxReturn or ICdResponse with array data
      if ("data" in result && Array.isArray(result.data)) {
        return result.data.length > 0;
      }

      // If none match, treat as no results
      return false;
    } catch (error: any) {
      this.logger.logError(`BaseService::exists() - Error: ${error.message}`);
      this.i.app_msg = `Existence check failed for ${field}`;
      this.err.push(this.i.app_msg);
      await this.setAppState(false, this.i, svSess.sessResp);
      return false;
    }
  }

  async validateCreateGeneric(
    req: Request,
    res: Response,
    rules: ValidationRules,
    existenceMap: { [field: string]: any }, // field: Model
    validationCreateParams: any, // same as your existing usage
  ): Promise<boolean> {
    const svSess = new SessionService();
    this.logger.logDebug(
      `BaseService::validateCreateGeneric()/rules: ${inspect(rules, {
        depth: 3,
      })}`,
    );
    // Check required fields
    for (let field of rules.required || []) {
      const value = this.getPlValue(req, field);
      if (!value) {
        this.i.app_msg = `${field} is required`;
        this.err.push(this.i.app_msg);
        await this.setAppState(false, this.i, svSess.sessResp);
        return false;
      }
    }

    // Validate existence of references
    for (let field of Object.keys(existenceMap)) {
      this.logger.logDebug(
        `BaseService::validateCreateGeneric()/existenceMap: ${inspect(
          existenceMap,
          { depth: 2 },
        )}`,
      );
      const model = existenceMap[field];
      const value = this.getPlValue(req, field);
      this.logger.logDebug(
        `BaseService::validateCreateGeneric()/Validating existence for ${field} with value ${value}`,
      );
      const found = await this.exists(req, res, field, model, value);
      this.logger.logDebug(
        `BaseService::validateCreateGeneric()/Existence check for ${field} returned: ${found}`,
      );
      if (!found) return false;
    }

    // Perform duplication + required field logic
    if (await this.validateUnique(req, res, validationCreateParams)) {
      if (await this.validateRequired(req, res, rules)) {
        return true;
      } else {
        this.setAlertMessage(
          `Missing required fields: ${this.isInvalidFields.join(", ")}`,
          svSess,
          true,
        );
        return false;
      }
    } else {
      this.setAlertMessage(
        `Duplicate entry for ${rules.noDuplicate?.join(", ")}`,
        svSess,
        false,
      );
      return false;
    }
  }
}
