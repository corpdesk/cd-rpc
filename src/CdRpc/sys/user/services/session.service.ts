// https://www.npmjs.com/package/device-detector-js

import DeviceDetector from "device-detector-js";
import { Request, Response } from "express";
import { BaseService } from "../../base/base.service";
import { IServiceInput, ISessionDataExt, ISessResp } from "../../base/i-base";
import { DocModel } from "../../moduleman/models/doc.model";
// import * as dotenv from 'dotenv';
import { defaultSession, SessionModel } from "../models/session.model";
import { IUserProfile, UserModel } from "../models/user.model";
import { UserService } from "./user.service";
import { Logging } from "../../base/winston.log";
import { ConsumerModel } from "../../moduleman/models/consumer.model";
import { CompanyModel } from "../../moduleman/models/company.model";
import { ConsumerService } from "../../moduleman/services/consumer.service";
import { RedisService } from "../../base/redis-service";
import config from "../../../../config";
import { safeStringify } from "../../utils/safe-stringify";
import { GenericService } from "../../base/generic-service";
import { inspect } from "util";
// dotenv.config();

// export class SessionService {
// export class SessionService extends BaseService<SessionModel> {
export class SessionService extends GenericService<SessionModel> {
  logger: Logging;
  // b: BaseService<SessionModel>;
  sessModel = new SessionModel();
  cdToken!: string;

  serviceModel = SessionModel;
  docName = "";

  sessIsSet = false;
  sessData = {
    cuid: 1000,
    cdToken: "",
    consumerGuid: "",
    deviceNetId: null as JSON | null, // Allow JSON or null
    userData: null as UserModel | null, // Allow JSON or null,
  };

  sessResp: ISessResp = {
    cd_token: "",
    jwt: null,
    ttl: 600,
  };
  clientId: any;
  private redisService: RedisService;

  currentUserData!: UserModel;
  currentUserProfile!: IUserProfile;
  currentSessData!: SessionModel[];
  currentConsumerData!: ConsumerModel[];
  currentCompanyData!: CompanyModel[];

  constructor() {
    super(SessionModel);
    // this.b = new BaseService();
    this.logger = new Logging();
    // this.sessModel = new SessionModel();
    // Initialize RedisService
    this.redisService = new RedisService();
  }

  /**
   * We have avoided using the BaseService create method here because this is a special case which returns session data.
   * The standard 'create()' does not return data.
   * 'createSession()' also has a special role in the entire system which then seperates it from standard 'create'.
   * @param req
   * @param res
   * @param guest
   * @returns
   */
  async createSession(
    req: Request,
    res: Response,
    guest: UserModel,
  ): Promise<SessionModel | void> {
    this.logger.logInfo("starting SessionService::create(req, res, guest)");
    try {
      // const session = new SessionModel();
      await this.setSession(req, res, guest);
      const serviceInput: IServiceInput<any> = {
        serviceInstance: this,
        serviceModel: SessionModel,
        serviceModelInstance: this.sessModel,
        dSource: 1,
        docName: "Create Session",
        data: this.sessModel,
      };
      const sessData: SessionModel = await this.b.create(
        req as any,
        res as any,
        serviceInput,
      );
      (req as any).post.dat.token = sessData.cdToken;
      this.logger.logInfo("SessionService::create/02/sessData:", sessData);
      return sessData;
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "SessionService:create");
    }
  }

  // read() {
  //     this.logger.logInfo(`starting SessionService::read()`);
  // }

  // update() {
  //     this.logger.logInfo(`starting SessionService::update()`);
  // }

  remove() {
    this.logger.logInfo(`starting SessionService::remove()`);
  }

  async setSession(req: Request, res: Response, guest: UserModel) {
    this.logger.logInfo(
      `SessionService::setSession()/starting:${inspect({ reqPost: (req as any).post, guest: guest }, { depth: 2 })})`,
    );
    try {
      this.logger.logInfo(`SessionService::setSession()/:001`);
      this.sessData.cuid = guest.userId as number;
      this.logger.logInfo(`SessionService::setSession()/:002`);
      this.sessData.cdToken = this.b.getGuid();
      this.logger.logInfo(`SessionService::setSession()/:003`);
      this.sessData.consumerGuid = (
        req as any
      ).post.dat.f_vals[0].data.consumerGuid;
      this.logger.logInfo(`SessionService::setSession()/:004`);
      this.sessData.deviceNetId = await this.getDeviceNetId(req);
      this.logger.logInfo(`SessionService::setSession()/:005`);
      this.sessData.userData = guest;
      this.logger.logInfo(`SessionService::setSession()/:006`);
      this.sessModel.startTime = await this.b.mysqlNow();
      this.logger.logInfo(`SessionService::setSession()/:007`);
      this.sessModel.cdToken = this.sessData.cdToken;
      this.logger.logInfo(`SessionService::setSession()/:008`);
      this.sessModel.currentUserId = guest.userId;
      this.logger.logInfo(`SessionService::setSession()/:009`);
      this.sessModel.accTime = await this.b.mysqlNow();
      this.logger.logInfo(`SessionService::setSession()/:010`);
      this.sessModel.ttl = this.getTtl();
      this.logger.logInfo(`SessionService::setSession()/:011`);
      this.sessModel.active = true;
      this.logger.logInfo(`SessionService::setSession()/:012`);
      this.sessModel.deviceNetId = this.sessData.deviceNetId;
      this.logger.logInfo(`SessionService::setSession()/:013`);
      this.sessModel.consumerGuid = this.sessData.consumerGuid;
      this.logger.logInfo(`SessionService::setSession()/:014`);
      (req as any).post.sessData = this.sessData;
      this.logger.logInfo(`SessionService::setSession()/:015`);
      this.sessIsSet = true;
      this.logger.logInfo(`SessionService::setSession()/:016`);
      this.logger.logInfo(
        "SessionService::setSession()/this.sessModel:",
        this.sessModel,
      );
    } catch (e) {
      await this.b.serviceErr(req, res, e, "SessionService:setSession");
    }
  }

  async getSession(req: Request, res: Response): Promise<SessionModel[]> {
    this.logger.logDebug("starting SessionService::getSession()");
    this.logger.logDebug("[SessionService][getSession] 01");
    if (this.validateToken(req)) {
      this.logger.logDebug("[SessionService][getSession] 02");
      const serviceInput = {
        serviceInstance: this,
        serviceModel: SessionModel,
        docName: "SessionService::getSession",
        cmd: {
          action: "find",
          query: {
            // get requested user and 'anon' data/ anon data is used in case of failure
            where: [{ cdToken: (req as any).post.dat.token }],
          },
        },
        dSource: 1,
      };
      this.logger.logDebug(
        "SessionService::getSession/(req as any).post.dat.token:",
        (req as any).post.dat.token,
      );
      this.logger.logDebug(
        "SessionService::getSession/serviceInput:",
        serviceInput,
      );
      const ret = await this.b.read(req, res, serviceInput);
      this.logger.logDebug("[SessionService][getSession] 03");
      this.logger.logDebug(`[SessionService][getSession] ret: ${inspect(ret, {depth: 3})}`);
      return ret;
    } else {
      this.logger.logDebug("[SessionService][getSession] 04");
      return await [defaultSession];
    }
  }

  validateToken(req: Request): boolean {
    this.logger.logDebug('[SessionService][validateToken] 01')
    const token = (req as any).post?.dat?.token;
    this.logger.logDebug(`[SessionService][validateToken] token: ${token}`)
    // Check existence
    if (!token) {
      this.logger.logDebug('[SessionService][validateToken] 02')
      this.logger.logWarn("Token missing from request.");
      return false;
    }

    // Check type
    if (typeof token !== "string") {
      this.logger.logDebug('[SessionService][validateToken] 03')
      this.logger.logWarn("Token is not a string.");
      return false;
    }

    // Check length
    if (token.length !== 36) {
      this.logger.logDebug('[SessionService][validateToken] 04')
      this.logger.logWarn("Token does not have a valid length.");
      return false;
    }

    // Check UUID v4 format
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(token)) {
      this.logger.logDebug('[SessionService][validateToken] 05')
      this.logger.logWarn("Token is not a valid UUID v4.");
      return false;
    }

    return true;
  }

  getTtl() {
    return 600;
  }

  // Based on: https://www.npmjs.com/package/device-detector-js
  async getDeviceNetId(req: Request): Promise<JSON> {
    const deviceDetector = new DeviceDetector();
    const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 Safari/537.36`;
    const resultStr = JSON.stringify(deviceDetector.parse(userAgent));
    const ip4 = this.getIP(req);
    const resultJ = JSON.parse(resultStr);
    resultJ.net = {
      ip: ip4,
    };
    return resultJ;
  }

  getIP(req: Request) {
    return req.ip;
  }

  // async getConsumerGuid(req) {
  //     return await (req as any).post.sessData.consumerGuid;
  // }

  async getCuid(req: Request) {
    return (req as any).post.sessData.cuid;
  }

  async getCurrentUser(req: Request, res: Response) {
    const svUser = new UserService();
    if ("sessData" in (req as any).post) {
      return (req as any).post.sessData.userData;
    }
    if (this.b.isRegisterRequest()) {
      svUser.getAnon(req, res);
    }
  }

  async getSessionDataExt(
    req: Request,
    res: Response,
    ignoreCache?: boolean,
  ): Promise<ISessionDataExt | null> {
    this.logger.logDebug("SessionService::getSessionDataExt()/01");
    let cacheKey: string = "";

    if (!ignoreCache) {
      this.logger.logDebug("SessionService::getSessionDataExt()/02");
      // Define a unique cache key based on session ID or user-specific identifier
      cacheKey = `session_data_${(req as any).post.dat.token}`;

      // Try to retrieve session data from Redis cache
      let sessionData = await this.redisService.get(cacheKey);

      if (sessionData) {
        this.logger.logDebug("SessionService::getSessionDataExt()/03");
        // Parse cached session data and return it
        return JSON.parse(sessionData);
      }
    }

    // If cache miss, proceed to retrieve data from the database as usual
    const svUser = new UserService();
    const svConsumer = new ConsumerService();

    this.logger.logDebug("SessionService::getSessionDataExt()/04");
    this.currentSessData = await this.getSession(req, res);
    this.logger.logDebug("SessionService::getSessionDataExt()/05");
    this.logger.logDebug(
      "SessionService::getSessionDataExt()/this.currentSessData:",
      this.currentSessData,
    );
    if (this.currentSessData.length > 0) {
      const consumerGuid = this.currentSessData[0].consumerGuid as string;
      this.logger.logDebug("SessionService::getSessionDataExt()/06");
      this.logger.logDebug(
        "SessionService::getSessionDataExt()/consumerGuid:",
        consumerGuid,
      );
      const cuid = this.currentSessData[0].currentUserId;
      this.logger.logDebug("SessionService::getSessionDataExt()/07");
      this.logger.logDebug("SessionService::getSessionDataExt()/cuid:", cuid);
      if (!cuid) {
        return null;
      }
      const userData = await svUser.getUserByID(req, res, cuid);
      this.logger.logDebug("SessionService::getSessionDataExt()/08");
      this.logger.logDebug(
        "SessionService::getSessionDataExt()/userData:",
        userData,
      );
      this.currentUserData = userData[0];
      this.logger.logDebug("SessionService::getSessionDataExt()/09");
      this.logger.logDebug(
        "SessionService::getSessionDataExt()/this.currentUserData:",
        this.currentUserData,
      );
      this.currentUserProfile = await svUser.existingUserProfile(
        req,
        res,
        cuid,
      );
      this.logger.logDebug("SessionService::getSessionDataExt()/10");
      this.logger.logDebug(
        "SessionService::getSessionDataExt()/this.currentUserProfile:",
        this.currentUserProfile,
      );
      this.currentConsumerData = await svConsumer.getConsumerI(req, res, {
        where: { consumerGuid: consumerGuid },
      });
      this.logger.logDebug("SessionService::getSessionDataExt()/11");
      this.logger.logDebug(
        "SessionService::getSessionDataExt()/this.currentConsumerData:",
        this.currentConsumerData,
      );
      this.currentCompanyData = await svConsumer.getCompanyData(
        req,
        res,
        consumerGuid,
      );
      this.logger.logDebug("SessionService::getSessionDataExt()/11");
      this.logger.logDebug(
        "SessionService::getSessionDataExt()/this.currentCompanyData:",
        this.currentCompanyData,
      );

      // Compose session data object
      const retSessionData = {
        currentUser: userData[0],
        currentUserProfile: this.currentUserProfile,
        currentSession: this.currentSessData[0],
        currentConsumer: this.currentConsumerData[0],
        currentCompany: this.currentCompanyData[0],
      };
      this.logger.logDebug("SessionService::getSessionDataExt()/12");
      this.logger.logDebug("SessionService::getSessionDataExt()/cuid:", cuid);

      if (!ignoreCache) {
        this.logger.logDebug("SessionService::getSessionDataExt()/13");
        // Set the TTL to 1 hour (3600 seconds)
        const ttl = Number(config.cacheTtl);
        // Store the session data in Redis for future requests (set a TTL of 1 hour)
        // await this.redisService.set(cacheKey, JSON.stringify(retSessionData), ttl);
        await this.redisService.set(
          cacheKey,
          safeStringify(retSessionData),
          ttl,
        );
      }
      this.logger.logDebug("SessionService::getSessionDataExt()/14");
      this.logger.logDebug(
        "SessionService::getSessionDataExt()/retSessionData:",
        retSessionData,
      );
      // Return the freshly fetched session data
      return await retSessionData;
    } else {
      return null;
    }
  }
}
