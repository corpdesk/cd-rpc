import { createConnection, getConnection, UpdateResult } from "typeorm";
import "reflect-metadata";
import { cloneDeep } from "lodash";
import { Request, Response } from "express";
// import { defer, from, interval, Observable, of, mergeMap, pipe, combineLatest } from 'rxjs';
import * as Rx from "rxjs";
import { BaseService } from "../../base/base.service";
import {
  UserModel,
  IUserProfile,
  userProfileDefault,
} from "../models/user.model";
import { NotificationTemplate } from "../models/registerNotifTemplate";
import { MailService } from "../../comm/services/mail.service";
import userConfig from "../userConfig";
import { Database } from "../../base/connect";
import * as bcrypt from "bcrypt";
import { DocModel } from "../../moduleman/models/doc.model";
import {
  IServiceInput,
  IRespInfo,
  IExtServiceInput,
  IQuery,
  ISessionDataExt,
  CdFxReturn,
  ICdResponse,
} from "../../base/i-base";
import { SessionService } from "./session.service";
import { SessionModel } from "../models/session.model";
import { ISessResp } from "../../base/i-base";
import { ModuleService } from "../../moduleman/services/module.service";
import { ConsumerService } from "../../moduleman/services/consumer.service";
import { UserViewModel } from "../models/user-view.model";
import { GroupService } from "./group.service";
import { Logging } from "../../base/winston.log";
import { ProfileServiceHelper } from "../../utils/profile-service-helper";
import { CdObjService } from "../../moduleman/services/cd-obj.service";
import { CdObjModel } from "../../moduleman/models/cd-obj.model";
import { ConsumerResourceService } from "../../moduleman/services/consumer-resource.service";
import { ConsumerResourceModel } from "../../moduleman/models/consumer-resource.model";
import { GroupMemberService } from "./group-member.service";
import { GroupMemberModel } from "../models/group-member.model";
import { ConsumerModel } from "../../moduleman/models/consumer.model";
import { GenericService } from "../../base/generic-service";

export class UserService extends GenericService<UserModel> {
  logger: Logging;
  cdToken!: string;
  // b: BaseService;
  // userModel;
  mail: MailService;
  db!: Database;
  svSession: SessionService;
  svModule: ModuleService;
  svConsumer: ConsumerService;
  requestPswd!: string;
  plData: any;

  serviceModel = UserModel;
  docName = "";

  // i: IRespInfo = {
  //     messages: null,
  //     code: '',
  //     app_msg: ''
  // };

  loginState = false;

  /*
   * create rules
   */
  cRules: any = {
    required: ["userName", "email", "password"],
    noDuplicate: ["userName", "email"],
  };

  constructor() {
    super(UserModel);
    this.logger = new Logging();
    // this.b = new BaseService();
    this.mail = new MailService();
    // this.userModel = new UserModel();
    this.svSession = new SessionService();
    this.svModule = new ModuleService();
    this.svConsumer = new ConsumerService();
  }

  // async init() {
  //     if (!this.db) {
  //         const db = await new Database();
  //         await db.setConnEntity(UserModel);
  //         await db.setConnEntity(DocModel);
  //         await db.getConnection();
  //     }
  // }

  // async create(req: Request, res: Response): Promise<void> {
  // // async create(
  // //     req: Req | null,
  // //     res: Res | null,
  // //     serviceInput: IServiceInput<UserModel>,
  // //   ): Promise<CdFxReturn<UserModel> | UserModel | ICdResponse | void>{
  //   if (await this.validateCreate(req, res)) {
  //     const user = new UserModel();
  //     await this.beforeCreate(req, res);
  //     const serviceInput = {
  //       serviceInstance: this,
  //       serviceModel: UserModel,
  //       serviceModelInstance: user,
  //       docName: "Register User",
  //       dSource: 1,
  //     };
  //     const newUser: UserModel = await this.b.create(
  //       req as any,
  //       res as any,
  //       serviceInput,
  //     );
  //     this.logger.logDebug(`UserService::create()/newUser:${newUser}`);
  //     const plData = this.b.getPlData(req as any);
  //     this.logger.logDebug("UserService::create()/plData:", plData);
  //     const retAfterCreate = await this.afterCreate(req, res, newUser);
  //     this.logger.logDebug(`retAfterCreate: ${JSON.stringify(retAfterCreate)}`);
  //     delete newUser.password; // do not return password field even though it is hashed
  //     this.b.cdResp.data = await newUser;
  //     this.b.cdResp.app_state.success = true;
  //     const r = await this.b.respond(req, res);
  //   } else {
  //     const i = {
  //       messages: this.b.err,
  //       code: "UserService:create",
  //       app_msg: "",
  //     };
  //     await this.b.setAppState(false, i, null);
  //     const r = await this.b.respond(req, res);
  //   }
  // }

  async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<UserModel>,
  ): Promise<UserModel | boolean> {
    serviceInputExt.entityData.userGuid = this.b.getGuid();
    return await this.b.createI(req, res, serviceInputExt);
  }

  async beforeCreate(req: Request, res: Response) {
    this.b.setPlData(req as any, { key: "userGuid", value: this.b.getGuid() });
    this.b.setPlData(req as any, {
      key: "activationKey",
      value: this.b.getGuid(),
    });
    this.b.setPlData(req as any, { key: "userEnabled", value: 1 });
    await this.cryptPassword(req);
  }

  async cryptPassword(req: Request) {
    const d = await this.b.getPlData(req as any);
    this.requestPswd = this.plData.password;
    this.plData.password = await bcrypt.hash(d.password, 10);
  }

  async validateCreate(req: Request, res: Response) {
    this.logger.logDebug("UserService::validateCreate()/01");
    const svConsumer = new ConsumerService();
    const params = {
      controllerInstance: this,
      model: UserModel,
    };
    this.plData = this.b.getPlData(req as any);
    if (await this.b.validateUnique(req, res, params)) {
      this.logger.logDebug("UserService::validateCreate()/01");
      if (await this.b.validateRequired(req, res, this.cRules)) {
        this.logger.logDebug("UserService::validateCreate()/02");
        if (!svConsumer.getConsumerGuid(req as any)) {
          this.logger.logDebug("UserService::validateCreate()/03");
          this.b.err.push(
            "valid consumer token is missing in the auth request",
          );
          return false;
        } else {
          this.logger.logDebug("UserService::validateCreate()/04");
          const plData = await this.b.getPlData(req as any);
          if (
            (await this.svConsumer.consumerGuidIsValid(
              req,
              res,
              plData.consumerGuid,
            )) === false
          ) {
            this.logger.logDebug("UserService::validateCreate()/05");
            this.b.err.push("consumer token is not valid");
            return false;
          }
          this.logger.logDebug("UserService::validateCreate()/06");
        }
        this.logger.logDebug("UserService::validateCreate()/07");
        return true;
      } else {
        this.b.err.push(
          `you must provide ${JSON.stringify(this.cRules.required)}`,
        );
        return false;
      }
    } else {
      this.b.err.push(
        `duplication of ${JSON.stringify(this.cRules.noDuplicate)} not allowed`,
      );
      return false;
    }
  }

  async afterCreate(req: Request, res: Response, userData: UserModel) {
    const sessData: SessionModel = await this.authI(req, res);
    this.b.sess = [sessData];
    this.logger.logDebug("UserService::afterCreate()/sessData:", sessData);
    // update req with token
    (req as any).post.dat.token = sessData.cdToken;
    const svGroup = new GroupService();
    // svGroup.b = this.b;
    // every user must have 'pals' group after registration
    const palGroup = await svGroup.createPalsGroup(req, res, userData);
    this.logger.logDebug("UserService::afterCreate()/palGroup:", {
      palGroup: palGroup,
    });
    return await this.regisrationNotification(req, res, userData);
  }

  async regisrationNotification(
    req: Request,
    res: Response,
    newUser: UserModel,
  ) {
    this.logger.logDebug("starting UserService::regisrationNotification()");
    if (userConfig.register.notification.email) {
      this.logger.logDebug("UserService::regisrationNotification()/newUser:", {
        u: newUser,
      });
      const nt = new NotificationTemplate();
      this.plData.msg = await nt.registerNotifTemplate(req, res, newUser);
      const mailRet = await this.mail.sendEmailNotif(
        await req,
        res,
        this.plData.msg,
        newUser,
      );
      this.logger.logDebug(`mailRet: ${JSON.stringify(mailRet)}`);
    }
  }

  async activateUser(req: Request, res: Response, q?: IQuery) {
    try {
      this.logger.logDebug("UserService::activateUser()/01");
      if (!q) {
        q = this.b.getQuery(req as any);
        this.logger.logDebug("UserService::activateUser()/02");
        this.logger.logDebug(
          `UserService::activateUser()/q:${JSON.stringify(q)}`,
        );
      }
      const qUser: IQuery = q!;
      this.logger.logDebug("UserService::activateUser()/qUser:", qUser);
      if (await this.validateActivateUser(req, res, qUser)) {
        this.logger.logDebug("UserService::activateUser()/03");
        this.logger.logDebug("UserService::activateUser()/validation passed:");
        /**
         * update the user to active state
         */
        const qUpdateUser = {
          update: {
            userEnabled: true,
          },
          where: qUser.where,
        };
        const serviceInput = {
          serviceModel: UserModel,
          docName: "Activate User",
          cmd: {
            action: "update",
            query: qUpdateUser,
          },
          dSource: 1,
        };
        this.logger.logDebug("UserService::activateUser()/04");
        this.logger.logDebug(
          `UserService::activateUser()/serviceInput:${JSON.stringify(
            serviceInput,
          )}`,
        );

        const retUpdate = (await this.updateI(
          req,
          res,
          serviceInput,
        )) as UpdateResult;
        this.logger.logDebug("UserService::activateUser()/05");
        this.logger.logDebug(
          "UserService::activateUser()/retUpdate:",
          retUpdate,
        );

        if (!retUpdate || retUpdate.affected === 0) {
          /**
           * respond with server error message
           */
          this.b.err.push("Failed to activate the user account");
          const i = {
            messages: this.b.err,
            code: "UserService:create",
            app_msg: "There was an error activating your account",
          };
          await this.b.setAppState(false, i, null);
          const r = await this.b.respond(req, res);
        }
        /**
         * if update of records is succesfull, get user data'
         */
        if (
          !retUpdate ||
          typeof retUpdate.affected === "undefined" ||
          retUpdate.affected === 0
        ) {
          this.logger.logDebug("UserService::activateUser()/06");
          // construct service input
          const siUser = this.b.siGet(
            qUser,
            "UserService:activateUser",
            UserModel,
          );
          this.logger.logDebug("UserService::activateUser()/07");
          this.logger.logDebug(
            `UserService::activateUser()/siUser:${JSON.stringify(siUser)}`,
          );
          // get user data data
          const userData: UserModel[] = await this.read(req, res, siUser);
          this.logger.logDebug("UserService::activateUser()/08");
          this.logger.logDebug(
            "UserService::activateUser()/userData:",
            userData,
          );
          /**
           * create a valid session for the user
           */
          const svSess = new SessionService();
          // get consumer payload
          const pl: ConsumerModel = this.b.getPlData(req as any, "consumer");
          this.logger.logDebug("UserService::activateUser()/pl:", pl);
          this.logger.logDebug("UserService::activateUser()/pl.consumerGuid:", {
            consumerGuid: pl.consumerGuid,
          });
          if (!pl.consumerGuid) {
            const i = {
              messages: this.b.err,
              code: "UserService:activateUser",
              app_msg: "Consumer GUID is missing",
            };
            await this.b.setAppState(false, i, null);
            const r = await this.b.respond(req, res);
            return;
          }
          svSess.sessData.consumerGuid = pl.consumerGuid;
          (req as any).post.dat.f_vals[0].data = {
            consumerGuid: pl.consumerGuid,
          };
          const sessData = await svSess.createSession(req, res, userData[0]);
          if (!sessData || !sessData.cdToken) {
            const i = {
              messages: this.b.err,
              code: "UserService:activateUser",
              app_msg: "Failed to create a valid session",
            };
            await this.b.setAppState(false, i, null);
            const r = await this.b.respond(req, res);
            return;
          }
          (req as any).post.dat.token = sessData.cdToken;
          /**
           * Todo:
           * - if pl.consumerGuid is not available or invalid, abort and respond
           */

          // if(!pl.consumerGuid){
          //   return;
          // }

          /**
           * Post activation process:
           * - create a corresponding user as cdObj
           *
           */

          const svCdObj = new CdObjService();
          const sessionDataExt = await svSess.getSessionDataExt(req, res, true);
          this.logger.logDebug("UserService::activateUser()/09");
          this.logger.logDebug(
            `UserService::activateUser()/sessionDataExt:${JSON.stringify(
              sessionDataExt,
            )}`,
          );
          /**
           * Create corresponding cd-obj of the activated user
           */
          const cdObjData: CdObjModel = {
            cdObjName: userData[0].userGuid!,
            objGuid: userData[0].userGuid!,
            cdObjTypeGuid: "a237cc2b-e895-4596-a963-9b6e74d0f7b2", // user
            parentModuleGuid: "00e7c6a8-83e4-40e2-bd27-51fcff9ce63b", // user module
          };
          this.logger.logDebug(
            `UserService::purgeUser()/cdObjData:${JSON.stringify(cdObjData)}`,
          );
          const si = {
            serviceInstance: svCdObj,
            serviceModel: CdObjModel,
            serviceModelInstance: svCdObj.serviceModel,
            docName: "CdObjService::CreateI",
            dSource: 1,
          };
          // this.logger.logDebug(`UserService::purgeUser()/si:${JSON.stringify(si)}`);
          const serviceInputExt: IExtServiceInput<any> = {
            serviceInput: si,
            entityData: cdObjData,
          };
          // this.logger.logDebug(`UserService::purgeUser()/serviceInputExt:${JSON.stringify(IExtServiceInput<any>)}`);
          let respCreateCdObj: CdObjModel = (await svCdObj.createI(
            req,
            res,
            serviceInputExt,
          )) as CdObjModel;
          this.logger.logDebug("UserService::activateUser()/10");
          this.logger.logDebug("UserService::activateUser()/respCreateCdObj:", {
            resp: respCreateCdObj,
          });

          // /**
          //  * get cdObj guid
          //  */
          // const siGetCdObj = {
          //   serviceInstance: svCdObj,
          //   serviceModel: CdObjModel,
          //   serviceModelInstance: svCdObj.serviceModel,
          //   docName: "CdObjService::CreateI",
          //   cmd: {
          //     action: "find",
          //     query: { where: cdObjData },
          //   },
          //   dSource: 1,
          // };
          // this.logger.logDebug("UserService::activateUser()/11");
          // let respGetCdObj = (await this.read(
          //   req,
          //   res,
          //   siGetCdObj
          // )) as CdObjModel[];
          // this.logger.logDebug("UserService::activateUser()/12");
          // this.logger.logDebug("UserService::activateUser()/respGetCdObj:", {
          //   resp: JSON.stringify(respGetCdObj),
          // });

          /*
           * - create a corresponding consumerResource (user) for session consumer
           *
           */
          // this.logger.logDebug("UserService::activateUser()/respGetCdObj.cdObjGuid:", {cdObjGuid: respGetCdObj.cdObjGuid,});
          const svConsumerResource = new ConsumerResourceService();
          const consumerResourceData: ConsumerResourceModel = {
            cdObjTypeGuid: "a237cc2b-e895-4596-a963-9b6e74d0f7b2", // user
            consumerGuid: sessionDataExt?.currentConsumer.consumerGuid, // consumer by session
            consumerId: sessionDataExt?.currentConsumer.consumerId,
            cdObjGuid: respCreateCdObj.cdObjGuid, // cdObjGuid of the just created cdObj above
            cdObjId: respCreateCdObj.cdObjId,
            consumerResourceTypeId: 6, // consumer user
            consumerResourceName: userData[0].userGuid,
            objId: userData[0].userId,
            consumerResourceEnabled: true,
          };
          this.logger.logDebug(
            `UserService::activateUser()/consumerResourceData:${JSON.stringify(
              consumerResourceData,
            )}`,
          );
          const siConsRes = {
            serviceInstance: svConsumerResource,
            serviceModel: ConsumerResourceModel,
            serviceModelInstance: svConsumerResource.serviceModel,
            docName: "CdObjService::activateUser",
            dSource: 1,
          };
          const serviceInputExtConsRes: IExtServiceInput<any> = {
            serviceInput: siConsRes,
            entityData: consumerResourceData,
          };
          // this.logger.logDebug(
          //   `UserService::activateUser()/serviceInputExtConsRes:${JSON.stringify(
          //     serviceInputExtConsRes
          //   )}`
          // );
          this.logger.logDebug("UserService::activateUser()/13");
          let respCreateConsRes = await svConsumerResource.createI(
            req,
            res,
            serviceInputExtConsRes,
          );
          this.logger.logDebug("UserService::activateUser()/14");
          this.logger.logDebug(
            "UserService::activateUser()/respCreateConsRes:",
            { resp: respCreateConsRes },
          );
          this.logger.logDebug("UserService::activateUser()/14-1");
          /*
           * - join personal group member
           * - Note: all consumers should have the module 'personal' as a resource
           */
          const svGroupMember = new GroupMemberService();
          const groupData: GroupMemberModel = {
            groupMemberGuid: this.b.getGuid(),
            userIdMember: userData[0].userId,
            memberGuid: userData[0].userGuid,
            groupGuidParent: "d5270988-cb1a-427b-977f-4a78e709fda9", // guid for 'personal' group
            cdObjTypeId: 9, // user
            groupMemberEnabled: true,
          };
          this.logger.logDebug(
            `UserService::purgeUser()/groupData:${JSON.stringify(groupData)}`,
          );
          this.logger.logDebug("UserService::activateUser()/14-2");
          const siGroupMember = {
            serviceInstance: svGroupMember,
            serviceModel: GroupMemberModel,
            serviceModelInstance: svGroupMember.serviceModel,
            docName: "CdObjService::activateUser",
            dSource: 1,
          };
          this.logger.logDebug("UserService::activateUser()/14-3");
          const serviceInputExtGroupMember: IExtServiceInput<any> = {
            serviceInput: siGroupMember,
            entityData: groupData,
          };
          // this.logger.logDebug(
          //   `UserService::activateUser()/serviceInputExtGroupMember:${JSON.stringify(
          //     serviceInputExtGroupMember
          //   )}`
          // );
          this.logger.logDebug("UserService::activateUser()/14-4");
          this.logger.logDebug("UserService::activateUser()/15");
          let respCreateGroupMember = await this.createI(
            req,
            res,
            serviceInputExtGroupMember,
          );
          this.logger.logDebug("UserService::activateUser()/16");
          this.logger.logDebug(
            "UserService::activateUser()/respCreateGroupMember:",
            { resp: respCreateGroupMember },
          );
          this.b.cdResp.data = userData;
          this.b.cdResp.app_state.success = true;
          this.b.i.app_msg = `Your account is activated!`;
          const r = await this.b.respond(req, res);
        } else {
          const i = {
            messages: this.b.err,
            code: "UserService:create",
            app_msg: "There was an error activating your account",
          };
          await this.b.setAppState(false, i, null);
          const r = await this.b.respond(req, res);
        }
      } else {
        /**
         * respond with invalid key message
         */
        const i = {
          messages: this.b.err,
          code: "UserService:create",
          app_msg: "The key provided is invalid",
        };
        await this.b.setAppState(false, i, null);
        const r = await this.b.respond(req, res);
      }
    } catch (e: any) {
      /**
       * respond with server error message
       */
      this.b.err.push((e as Error).message);
      const i = {
        messages: this.b.err,
        code: "UserService:create",
        app_msg: "There was an error activating your account",
      };
      await this.b.setAppState(false, i, null);
      const r = await this.b.respond(req, res);
    }
  }

  // validateActivateUser(req, res, pl: UserModel): boolean {
  //   if(!pl){
  //     return false;
  //   }
  //   let ret = false;
  //   if ("userId" in pl || "userGuid" in pl) {
  //     ret = true;
  //   }
  //   return ret;
  // }

  async validateActivateUser(
    req: Request,
    res: Response,
    q: IQuery,
  ): Promise<boolean> {
    this.logger.logDebug("UserService::validateActivateUser()/01");
    this.logger.logDebug(
      `UserService::validateActivateUser()/q: ${JSON.stringify(q)}`,
    );
    let ret = false;

    if (!("where" in q)) {
      this.logger.logDebug("UserService::validateActivateUser()/02");
      this.logger.logDebug("UserService::validateActivateUser()/q:", q);
      return false;
    }

    if (!("activationKey" in q.where)) {
      this.logger.logDebug("UserService::validateActivateUser()/03");
      this.logger.logDebug("UserService::validateActivateUser()/q:", q);
      return false;
    }

    const serviceInput = {
      serviceModel: UserModel,
      docName: "UserService:validateActivationKey",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    const userData = await this.read(req, res, serviceInput);
    this.logger.logDebug("UserService::validateActivateUser()/04");
    this.logger.logDebug(
      "UserService::validaUserServUserService::activateUser()/04ice::activateUser()/serviceInput:UserServUserService::activateUser()/04ice::activateUser()/serviceInput:teActivationKey()/userData:",
      userData,
    );
    // const userData: UserModel[] = await this.read(req, res, q);
    this.logger.logDebug(
      `UserService::validateActivationKey()/userData:${JSON.stringify(
        userData,
      )}`,
    );
    if (userData.length > 0) {
      this.logger.logDebug("UserService::validatePurgeUser()/05");
      ret = true;
    } else {
      this.logger.logDebug("UserService::validatePurgeUser()/06");
      ret = false;
    }
    return ret;
  }

  async createMulti(req: Request, res: Response): Promise<void> {
    createConnection()
      .then(async (connection) => {
        const d = this.plData;
        const regResp = await getConnection()
          .createQueryBuilder()
          .insert()
          .into(UserModel)
          .values(
            d,
            // [
            //     { fname: 'Timber', lname: 'Saw', password: 'secret', email: 'eee', username: 'tisaw' },
            //     { fname: 'Phantom', lname: 'Lancer', password: 'admin', email: 'fff', username: 'phalance' }
            // ]
          )
          .execute();
        getConnection().close();
        const r = await this.b.respond(req, res);
      })
      .catch(async (error) => {
        getConnection().close();
        this.logger.logDebug(`Error: ${error}`);
        // return error;
        await this.b.respond(req, res);
      });
  }

  // async createDoc(req: Request, res: Response, savedUser) {
  //   const doc = new DocModel();
  //   const userRepository = await getConnection().getRepository(UserModel);
  //   doc.docName = "Register User";
  //   return await userRepository.save(await this.b.getPlData(req));
  // }

  async getUserActiveCo() {
    return {};
  }

  async getContacts(cuid: string) {
    return [{}];
  }

  // async getUserProfileI(req: Request, res: Response) {
  //     const svSess = new SessionService()
  //     const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res)

  //     const serviceInput: IServiceInput<any> = {
  //         serviceModel: UserModel,
  //         docName: 'UserService::getUser$',
  //         cmd: {
  //             action: 'find',
  //             query: { where: (req as any).post.dat.f_vals[0] }
  //         },
  //         dSource: 1
  //     }
  //     return await this.read(req, res, serviceInput)
  // }

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

  async update(req: Request, res: Response): Promise<void> {
    // this.logger.logDebug('UserService::update()/01');
    let q = this.b.getQuery(req as any);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: UserModel,
      docName: "UserService::update",
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

  // async updateI(
  //   req: Request,
  //   res: Response,
  //   serviceInput: IServiceInput<UserModel>,
  // ): Promise<CdFxReturn<UpdateResult> | UpdateResult | ICdResponse> {
  //   return await this.b.updateI(req, res, serviceInput);
  // }

  async updateI(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<UserModel>,
  ): Promise<any> {
    console.log("UserService::updateI()/01");

    // Check if cmd exists before assignment
    if (serviceInput.cmd) {
      serviceInput.cmd.query = this.beforeUpdate(
        serviceInput.cmd.query as IQuery,
      );
    }

    serviceInput = {
      serviceModel: UserModel,
      docName: "UserService::updateI",
      cmd: {
        action: "update",
        query: serviceInput.cmd?.query as IQuery,
      },
      dSource: 1,
    };
    console.log("UserService::updateI()/02");
    return this.b.update(req, res, serviceInput);
  }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  beforeUpdate(q: any): any {
    if (q.update.userEnabled === "") {
      q.update.userEnabled = null;
    }
    return q;
  }

  /**
     * {
            "ctx": "Sys",
            "m": "User",
            "c": "User",
            "a": "UpdatePassword",
            "dat": {
                "f_vals": [
                    {
                        "forgotPassword": true, // optional: used securely when oldPassword is not avialble (developer option...NOT end user) 
                        "oldPassword": null, // can be set to oldPassword text or set to null by develper to use in case of forgotPassword === true;
                        "query": {
                            "update": {
                                "password": "iiii"
                            },
                            "where": {
                                "userId": 1003
                            }
                        }
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": {}
        }
     * @param req 
     * @param res 
     */
  async updatePassword(req: Request, res: Response) {
    // this.logger.logDebug('UserService::update()/01');
    await this.beforeUpdatePassword(req, res, this.b.getQuery(req as any));
    const serviceInput = {
      serviceModel: UserModel,
      docName: "UserService::update",
      cmd: {
        action: "update",
        query: this.b.getQuery(req as any),
      },
      dSource: 1,
    };
    this.logger.logDebug("UserService::update()/02");
    this.logger.logDebug("UserService::update()/serviceInput:", serviceInput);
    this.b.update$(req, res, serviceInput).subscribe((ret: any) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  async beforeUpdatePassword(req: Request, res: Response, q: IQuery) {
    this.plData = this.b.getPlData(req as any);
    // 1. get cUser
    this.logger.logDebug("UserService::beforeUpdatePassword()/q:", q);
    this.requestPswd = (req as any).post.dat.f_vals[0].oldPassword;
    this.logger.logDebug(
      "UserService::beforeUpdatePassword()/this.requestPswd:",
      { requestPswd: this.requestPswd },
    );
    // 1. confirm old password
    const qExists = { where: { userId: q.where.userId } };
    const cUser = await this.getUserI(req, res, qExists);
    this.logger.logDebug("UserService::beforeUpdatePassword()/cUser:", cUser);
    if (cUser.length > 0) {
      if (await this.verifyPassword(req, res, cUser)) {
        // old password is valid
        this.logger.logDebug(
          "UserService::beforeUpdatePassword()/(req as any).post.dat.f_vals[0].update.password 1:",
          (req as any).post.dat.f_vals[0].query.update.password,
        );
        // 2. bicrypt the new password
        (req as any).post.dat.f_vals[0].query.update.password =
          await bcrypt.hash(
            (req as any).post.dat.f_vals[0].query.update.password,
            10,
          );
        this.logger.logDebug(
          "UserService::beforeUpdatePassword()/(req as any).post.dat.f_vals[0].update.password 2:",
          (req as any).post.dat.f_vals[0].query.update.password,
        );
      } else {
        const i = {
          messages: this.b.err,
          code: "UserService:beforeUpdatePassword",
          app_msg: "incorrect old-password",
        };
        await this.b.setAppState(false, i, null);
        const r = await this.b.respond(req, res);
      }
      // return q;
    } else {
      const i = {
        messages: this.b.err,
        code: "UserService:beforeUpdatePassword",
        app_msg: "user not found",
      };
      await this.b.setAppState(false, i, null);
      const r = await this.b.respond(req, res);
    }
  }

  async getUserI(
    req: Request,
    res: Response,
    q?: IQuery,
  ): Promise<UserModel[]> {
    if (q == null) {
      q = this.b.getQuery(req as any);
    }
    this.logger.logDebug("UserService::getUserI/q:", q);
    const serviceInput = {
      serviceModel: UserModel,
      docName: "UserService::getUserI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      return this.b.read(
        req as any,
        res as any,
        serviceInput as IServiceInput<UserModel>,
      );
    } catch (e: any) {
      this.logger.logDebug("UserService::getUserI()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "UserService:getUserI",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
      return [];
    }
  }

  async getI(req: Request, res: Response, q?: IQuery): Promise<UserModel[]> {
    if (q == null) {
      q = this.b.getQuery(req as any);
    }
    this.logger.logDebug("UserService::getI/q:", q);
    const serviceInput = {
      serviceModel: UserModel,
      docName: "UserService::getI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      return this.b.read(req, res, serviceInput as any);
    } catch (e: any) {
      this.logger.logDebug("UserService::getI()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "UserService:getI",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
      return [];
    }
  }

  remove(req: Request, res: Response): Promise<void> {
    this.logger.logDebug(`starting SessionService::remove()`);
    return Promise.resolve();
  }

  rbCreate(): number {
    return 1;
  }

  rbUpdate(): number {
    return 1;
  }

  rbRemove(): number {
    return 1;
  }

  async auth(req: Request, res: Response) {
    this.logger.logDebug("UserService::auth()/01");
    const svSess = new SessionService();
    this.logger.logDebug("auth()/UserModel:", {
      userModel: JSON.stringify(UserModel),
    });
    this.logger.logDebug("auth()/(req as any).post:", {
      dat: JSON.stringify((req as any).post.dat),
    });
    this.plData = this.b.getPlData(req as any);
    const q: IQuery = {
      /**
       * get requested user and 'anon' data/ anon data is used in case of failure
       * anon data is in readiness for failed or invalid login process
       * In other words 'anon' for anonimous user is also a valid user but with
       * limited privileges
       */
      where: [{ userName: this.plData.userName }, { userName: "anon" }],
    };
    const serviceInput: IServiceInput<any> = {
      serviceModel: UserModel,
      modelName: "UserModel",
      docName: "UserService::get",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    const result: UserModel[] = await this.b.get(
      req as any,
      res as any,
      serviceInput,
    );
    this.logger.logDebug("UserService::auth()/result:", result);
    const guest = await this.resolveGuest(req, res, result);
    this.logger.logDebug("UserService::auth()/guest:", guest);
    try {
      this.logger.logDebug("UserService::auth()/02");
      await this.authResponse(req, res, guest);
    } catch (e: any) {
      this.logger.logDebug("UserService::auth()/03");
      this.b.i.app_msg = `oops! there was an error fetching response`;
      this.b.err.push(this.b.i.app_msg);
      this.b.setAppState(false, this.b.i, svSess.sessResp);
      this.b.respond(req, res);
    }
  }

  async resolveGuest(
    req: Request,
    res: Response,
    guestArr: UserModel[],
  ): Promise<UserModel> {
    this.logger.logDebug("UserService::resolveGuest()/01");
    const plData = this.b.getPlData(req as any);
    this.logger.logDebug("UserService::resolveGuest()/plData:", plData);
    if (guestArr.length > 0) {
      this.logger.logDebug("UserService::resolveGuest()/02");
      // search if given username exists
      this.logger.logDebug(
        "UserService::resolveGuest()/this.plData:",
        this.plData,
      );
      let cUser: UserModel[] = guestArr.filter(
        (u) => u.userName === this.plData.userName,
      );
      this.logger.logDebug("UserService::resolveGuest()/cUser:", cUser);
      if (cUser.length > 0) {
        this.logger.logDebug("UserService::resolveGuest()/03");
        this.requestPswd = this.plData.password;
        // if exists, check password
        // ...check password
        if (await this.verifyPassword(req, res, cUser)) {
          /**
           * handle if password is valid but the user is disabled...
           */
          if (!cUser[0].userEnabled) {
            this.logger.logDebug("UserService::resolveGuest()/040");
            this.b.i.app_msg =
              "You are attempting to access an inactive account";
            cUser = guestArr.filter((u) => u.userName === "anon");
            return cUser[0];
          }

          /**
           * handle successful login
           */
          this.logger.logDebug("UserService::resolveGuest()/031");
          // if password is ok, return user data
          this.loginState = true;
          this.b.i.app_msg = `Welcome ${cUser[0].userName}!`;
          return cUser[0];
        } else {
          this.logger.logDebug("UserService::resolveGuest()/040");
          // else if password is invialid, select anon user and return
          this.b.i.app_msg = "Login failed!";
          cUser = guestArr.filter((u) => u.userName === "anon");
          return cUser[0];
        }
      } else {
        this.logger.logDebug("UserService::resolveGuest()/04");
        // else if user name does not exists, seach for anon user and return
        this.b.i.app_msg = "Login failed!";
        cUser = guestArr.filter((u) => u.userName === "anon");
        return cUser[0];
      }
    }

    this.logger.logDebug("UserService::resolveGuest()/05");
    const anonUser = guestArr.find((u) => u.userName === "anon");
    if (anonUser) {
      return anonUser;
    }
    throw new Error("UserService::resolveGuest no guest user data available");
  }

  async verifyPassword(req: Request, res: Response, cUser: UserModel[]) {
    this.logger.logDebug("UserService::verifyPassword()/01");
    // const plData = await this.b.getPlData(req);
    // this.logger.logDebug('UserService::verifyPassword()/plData:', plData)
    this.logger.logDebug("UserService::verifyPassword()/cUser:", cUser);
    // this.logger.logDebug('UserService::verifyPassword()/plData.password:', plData.password)
    this.logger.logDebug("UserService::verifyPassword()/cUser.password:", {
      pswd: cUser[0].password,
    });
    this.logger.logDebug("UserService::verifyPassword()/this.requestPswd:", {
      requestPswd: this.requestPswd,
    });
    let validPassword: any = null;
    if ((req as any).post.dat.f_vals[0].forgotPassword) {
      // overide verification in circumstances where password is forgotten
      validPassword = true;
    } else if (!this.requestPswd || !cUser[0].password) {
      validPassword = false;
    } else {
      validPassword = await bcrypt.compare(this.requestPswd, cUser[0].password);
    }

    this.logger.logDebug("UserService::verifyPassword()/02");
    this.logger.logDebug(
      "UserService::verifyPassword()/validPassword:",
      validPassword,
    );
    if (validPassword) {
      this.logger.logDebug("UserService::verifyPassword()/03");
      return true;
    } else {
      this.logger.logDebug("UserService::verifyPassword()/04");
      return false;
    }
  }

  /**
   * Auth internal
   * used when not relying on request data but internal process
   * @param req
   * @param res
   */
  async authI(req: Request, res: Response): Promise<SessionModel> {
    // const svSess = new SessionService();
    this.logger.logDebug("auth()/(req as any).post:", {
      dat: (req as any).post.dat,
    });
    const q: IQuery = {
      // get requested user and 'anon' data/ anon data is used in case of failure
      where: [{ userName: this.plData.userName }, { userName: "anon" }],
    };
    const serviceInput: IServiceInput<any> = {
      serviceModel: UserModel,
      modelName: "UserModel",
      docName: "UserService::get",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    const result: UserModel[] = await this.b.get(
      req as any,
      res as any,
      serviceInput,
    );
    const guest = await this.resolveGuest(req, res, result);
    this.logger.logDebug("UserService::auth1()/guest:", guest);
    const sessData = await this.svSession.createSession(req, res, guest);
    if (!sessData) {
      throw new Error("UserService::authI failed to create session");
    }
    return sessData;
  }

  async authResponse(req: Request, res: Response, guest: UserModel) {
    this.logger.logDebug("UserService::authResponse()/01");
    this.b.logTimeStamp("UserService::authResponse/01");
    // this.logger.logDebug('UserService::authResponse/01:');
    const svSession = new SessionService();
    const clientId = await svSession.getDeviceNetId(req);
    this.logger.logDebug(
      `UserService::authResponse/clientId:${JSON.stringify(clientId)}`,
    );
    this.processResponse$(req, res, guest).subscribe((ret: any) => {
      this.logger.logDebug("UserService::authResponse()/02");
      this.b.logTimeStamp("ModuleService::authResponse/02/ret:");

      // this.logger.logDebug(`UserService::authResponse()/02/ret:${JSON.stringify(ret: any)}`, ret);
      // const i = null;
      const sessData: ISessResp = {
        cd_token: ret.sessResult.cdToken,
        userId: ret.modulesUserData.userData.userId,
        jwt: null,
        ttl: ret.sessResult.ttl,
        clientId: this.b.getClientId(clientId),
      };
      this.logger.logDebug(
        `UserService::authResponse/sessData:${JSON.stringify(sessData)}`,
      );

      if (ret.modulesUserData.menuData.length > 0) {
        this.logger.logDebug("UserService::authResponse()/03");
        ret.modulesUserData.menuData = ret.modulesUserData.menuData.filter(
          (menu: any) => menu !== null,
        );
      } else {
        this.logger.logDebug("UserService::authResponse()/04");
        this.b.i.app_msg = `Sorry, you must be a member of this company to access any resources`;
        this.loginState = false;
        ret.modulesUserData.menuData = [];
      }
      this.logger.logDebug("UserService::authResponse()/05");
      this.b.i.messages = this.b.err;
      this.b.setAppState(this.loginState, this.b.i, sessData);
      this.b.cdResp.data = ret.modulesUserData;
      this.b.respond(req, res);
    });
  }

  processResponse$(
    req: Request,
    res: Response,
    guest: UserModel,
  ): Rx.Observable<any> {
    this.b.logTimeStamp("UserService::processResponse$/01");
    delete guest.password;

    // Create an observable for session data
    const sessData$: Rx.Observable<SessionModel> = Rx.from(
      this.svSession.createSession(req, res, guest),
    ).pipe(
      Rx.map((sessData): SessionModel => {
        if (!sessData) {
          throw new Error(
            "UserService::processResponse$ failed to create session",
          );
        }
        return sessData;
      }),
    );

    // Now using mergeMap to ensure sessData$ is resolved before passing it to getModulesUserData$
    return sessData$.pipe(
      Rx.mergeMap((sessData) => {
        (req as any).post.dat.token = sessData.cdToken;
        // Call getModulesUserData$ with sessData instead of guest
        const modulesUserData$ = this.svModule.getModulesUserData$(
          req,
          res,
          sessData,
        );

        // Use forkJoin to combine sessData and modulesUserData
        return Rx.forkJoin({
          sessResult: Rx.of(sessData), // Wrapping sessData into an observable
          modulesUserData: modulesUserData$,
        });
      }),
      Rx.defaultIfEmpty({
        sessResult: sessData$.pipe(Rx.mergeMap((r: any) => Rx.of(r))),
        modulesUserData: {
          consumer: [],
          menuData: [],
          userData: {},
        },
      }),
    );
  }

  async getUserByID(req: Request, res: Response, uid: string | number) {
    const serviceInput = {
      serviceInstance: this,
      serviceModel: UserModel,
      docModel: DocModel,
      docName: "UserService::getUserByID",
      cmd: {
        action: "find",
        query: { where: { userId: uid } },
      },
      dSource: 1,
    };
    return await this.read(req, res, serviceInput);
  }

  validateLogin(req: Request) {
    let isValid = true;
    if (!this.plData.consumer_guid) {
      isValid = false;
    }

    if (!this.plData.consumer_guid) {
      this.b.err.push("consumerGuid is missing or invalid");
      isValid = false;
    }
    return isValid;
  }

  async getUser(req: Request, res: Response, q?: IQuery) {
    if (q == null) {
      q = this.b.getQuery(req as any);
    }
    this.logger.logDebug("UserService::getUser/f:", q);
    const serviceInput = {
      serviceModel: UserModel,
      docName: "UserService::getUser$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b
        .read$(req, res, serviceInput as IServiceInput<any>)
        .subscribe((r: any) => {
          this.logger.logDebug("UserService::read$()/r:", r);
          this.b.i.code = "UserController::Get";
          const svSess = new SessionService();
          svSess.sessResp.cd_token = (req as any).post.dat.token;
          svSess.sessResp.ttl = svSess.getTtl();
          this.b.setAppState(true, this.b.i, svSess.sessResp);
          this.b.cdResp.data = r;
          this.b.respond(req, res);
        });
    } catch (e: any) {
      this.logger.logDebug("UserService::read$()/e:", e);
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

  getUserCount(req: Request, res: Response) {
    const q = this.b.getQuery(req as any);
    this.logger.logDebug("UserService::getUserCount/q:", q);
    const serviceInput = {
      serviceModel: UserViewModel,
      docName: "UserService::getUserCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = "UserController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  // getUserQB(req: Request, res: Response) {
  //     this.logger.logDebug('CompanyService::getUserQB()/1')
  //     // const map = this.b.entityAdapter.registerMappingFromEntity(UserViewModel);
  //     const q = this.b.getQuery(req);
  //     const serviceInput = {
  //         serviceModel: UserViewModel,
  //         docName: 'UserService::getUserQB',
  //         cmd: {
  //             action: 'find',
  //             query: q
  //         },
  //         dSource: 1
  //     }

  //     this.b.readQB$(req, res, serviceInput)
  //         .subscribe((r: any) => {
  //             this.b.i.code = serviceInput.docName;
  //             const svSess = new SessionService();
  //             svSess.sessResp.cd_token = (req as any).post.dat.token;
  //             svSess.sessResp.ttl = svSess.getTtl();
  //             this.b.setAppState(true, this.b.i, svSess.sessResp);
  //             this.b.cdResp.data = r;
  //             this.b.respond(req, res)
  //         })
  // }

  getUserQB(req: Request, res: Response) {
    this.logger.logDebug("UserService::getUserQB()/1");
    this.b.entityAdapter.registerMappingFromEntity(UserViewModel);
    const q = this.b.getQuery(req as any);
    const serviceInput = {
      serviceModel: UserViewModel,
      docName: "UserService::getUserQB",
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

  // getUserTypeCount(req: Request, res: Response) {
  //     const q = this.b.getQuery(req);
  //     this.logger.logDebug('UserService::getUserCount/q:', q);
  //     const serviceInput = {
  //         serviceModel: UserTypeModel,
  //         docName: 'UserService::getUserCount$',
  //         cmd: {
  //             action: 'find',
  //             query: q
  //         },
  //         dSource: 1
  //     }
  //     this.b.readCount$(req, res, serviceInput)
  //         .subscribe((r: any) => {
  //             this.b.i.code = 'UserController::Get';
  //             const svSess = new SessionService();
  //             svSess.sessResp.cd_token = (req as any).post.dat.token;
  //             svSess.sessResp.ttl = svSess.getTtl();
  //             this.b.setAppState(true, this.b.i, svSess.sessResp);
  //             this.b.cdResp.data = r;
  //             this.b.respond(req, res)
  //         })
  // }

  async delete(req: Request, res: Response): Promise<void> {
    const q = this.b.getQuery(req as any);
    this.logger.logDebug("UserService::delete()/q:", q);
    const serviceInput = {
      serviceModel: UserModel,
      docName: "UserService::delete",
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

  /**
   * - remove corresponding user as cdObj
   * - remove corresponding consumerResource for session consumer
   * - remove membership from all groups
   * @param req
   * @param res
   */
  async purgeUser(req: Request, res: Response, q?: IQuery) {
    this.logger.logDebug("UserService::purgeUser()/01");
    if (!q) {
      q = this.b.getQuery(req as any);
      this.logger.logDebug("UserService::purgeUser()/02");
      this.logger.logDebug(`UserService::purgeUser()/pl:${JSON.stringify(q)}`);
    }

    this.logger.logDebug("UserService::purgeUser()/03");
    if (this.validatePurgeUser(req, res, q as IQuery)) {
      this.logger.logDebug("UserService::purgeUser()/04");
      if (q && "userId" in q.where) {
        this.logger.logDebug("UserService::purgeUser()/05");
        q = {
          where: {
            userId: q.where.userId,
          },
        };
      }
      this.logger.logDebug("UserService::purgeUser()/06");
      if (q && "userGuid" in q.where) {
        this.logger.logDebug("UserService::purgeUser()/07");
        q = {
          where: {
            userGuid: q.where.userGuid,
          },
        };
      }

      const serviceInput = {
        serviceModel: UserModel,
        docName: "UserService:Purge User",
        cmd: {
          action: "find",
          query: q,
        },
        dSource: 1,
      };
      this.logger.logDebug("UserService::purgeUser()/08");
      const userData = await this.read(
        req as any,
        res as any,
        serviceInput as any,
      );
      this.logger.logDebug("UserService::purgeUser()/10");
      this.logger.logDebug("UserService::purgeUser()/userData:", userData);
      /**
       * if user data'
       */
      if (userData.length > 0) {
        /**
         * - remove corresponding user as cdObj
         */
        this.logger.logDebug("UserService::purgeUser()/11");
        const svCdObj = new CdObjService();
        const si = {
          serviceInstance: svCdObj,
          serviceModel: CdObjModel,
          serviceModelInstance: svCdObj.serviceModel,
          docName: "CdObjService::CreateI",
          cmd: {
            action: "find",
            query: { where: { objGuid: userData[0].userGuid } },
          },
          dSource: 1,
        };
        this.logger.logDebug("UserService::purgeUser()/12");
        let respDeleteCdObj = await this.b.delete(req, res, si);
        this.logger.logDebug("UserService::purgeUser()/respDeleteCdObj:", {
          resp: respDeleteCdObj,
        });

        /*
         * - delete corresponding consumerResource (user) for session consumer
         *
         */
        const svConsumerResource = new ConsumerResourceService();
        const siConsRes = {
          serviceInstance: svConsumerResource,
          serviceModel: ConsumerResourceModel,
          serviceModelInstance: svConsumerResource.serviceModel,
          docName: "CdObjService::purgeUser",
          cmd: {
            action: "delete",
            query: { where: { objGuid: userData[0].userGuid } },
          },
          dSource: 1,
        };
        this.logger.logDebug("UserService::purgeUser()/13");
        let respDeleteConsRes = await this.b.delete(
          req as any,
          res as any,
          siConsRes,
        );
        this.logger.logDebug("UserService::purgeUser()/respDeleteConsRes:", {
          resp: respDeleteConsRes,
        });
        /*
         * - remove user from personal group
         */
        this.logger.logDebug("UserService::purgeUser()/14");
        const svGroupMember = new GroupMemberService();
        const siGroupMember = {
          serviceInstance: svGroupMember,
          serviceModel: GroupMemberModel,
          serviceModelInstance: svGroupMember.serviceModel,
          docName: "CdObjService::purgeUser",
          cmd: {
            action: "delete",
            query: { where: { memberGuid: userData[0].userGuid } },
          },
          dSource: 1,
        };
        this.logger.logDebug("UserService::purgeUser()/15");
        let respCreateGroupMember = await this.b.delete(
          req as any,
          res as any,
          siGroupMember,
        );
        this.logger.logDebug(
          "UserService::purgeUser()/respCreateGroupMember:",
          {
            resp: respCreateGroupMember,
          },
        );
        this.logger.logDebug("UserService::purgeUser()/16");
        /**
         * remove user
         */
        const siUser = {
          serviceInstance: this,
          serviceModel: UserModel,
          serviceModelInstance: this.serviceModel,
          docName: "CdObjService::purgeUser",
          cmd: {
            action: "delete",
            query: { where: { userGuid: userData[0].userGuid } },
          },
          dSource: 1,
        };
        this.logger.logDebug("UserService::purgeUser()/17");
        let respUser = await this.b.delete(req, res, siUser);
        this.logger.logDebug("UserService::purgeUser()/respUser:", {
          resp: respUser,
        });
        this.logger.logDebug("UserService::purgeUser()/17");
        this.b.cdResp.data = userData;
        this.b.cdResp.app_state.success = true;
        this.b.i.app_msg = `user has been purged from the system!`;
        const r = await this.b.respond(req, res);
      } else {
        const i = {
          messages: this.b.err,
          code: "UserService:purgeUser",
          app_msg: "There was an error activating your account",
        };
        await this.b.setAppState(false, i, null);
        const r = await this.b.respond(req, res);
      }
    } else {
      const i = {
        messages: this.b.err,
        code: "UserService:purgeUser",
        app_msg: "There was a validation error in the data provided",
      };
      await this.b.setAppState(false, i, null);
      const r = await this.b.respond(req, res);
    }
  }

  validatePurgeUser(req: Request, res: Response, q: IQuery): boolean {
    this.logger.logDebug("UserService::validatePurgeUser()/01");
    this.logger.logDebug("UserService::validatePurgeUser()/q:", q);

    if (!q || !q.where) {
      this.logger.logDebug("UserService::validatePurgeUser()/02");
      return false;
    }

    const hasUserGuid = "userGuid" in q.where && q.where.userGuid;
    const hasUserId = "userId" in q.where && q.where.userId;

    if (!(hasUserGuid || hasUserId)) {
      this.logger.logDebug("UserService::validatePurgeUser()/03");
      return false;
    }

    this.logger.logDebug("UserService::validatePurgeUser()/04");
    return true;
  }

  /**
   * get anon user data
   */
  async getAnon(req: Request, res: Response) {
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: UserModel,
      docName: "UserService::getAnon",
      cmd: {
        action: "count",
        query: { where: { userName: "anon" } },
      },
      dSource: 1,
    };
    return await this.b.read(req, res, serviceInput);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // STARTING USER PROFILE FEATURES
  // Public method to update user profile (e.g., avatar, bio)
  async updateUserProfile(req: Request, res: Response): Promise<any> {
    try {
      // note that 'ignoreCache' is set to true because old data may introduce confussion
      const svSess = new SessionService();
      const sessionDataExt: ISessionDataExt | null =
        await svSess.getSessionDataExt(req, res, true);

      const requestQuery: IQuery = (req as any).post.dat.f_vals[0].query;
      const jsonUpdate = (req as any).post.dat.f_vals[0].jsonUpdate;
      let modifiedUserProfile = {} as IUserProfile;
      let strUserProfile = "{}";

      const existingUserProfile = await this.existingUserProfile(
        req,
        res,
        sessionDataExt?.currentUser.userId,
      );
      this.logger.logDebug(
        "UserService:updateCurrentUserProfile()/existingUserProfile:",
        existingUserProfile,
      );

      if (await this.validateProfileData(req, res, existingUserProfile)) {
        /*
                - if not null and is valid data
                    - use jsonUpdate to update currentUserProfile
                        use the method modifyUserProfile(existingData: IUserProfile, jsonUpdate): string
                    - use session data to modify 'userData' in the default user profile
                    - 
                */
        this.logger.logDebug("UserService::updateUserProfile()/01");
        this.logger.logDebug(
          "UserService::updateCurrentUserProfile()/jsonUpdate:",
          jsonUpdate,
        );
        this.logger.logDebug(
          "UserService::updateCurrentUserProfile()/existingUserProfile:",
          existingUserProfile,
        );
        modifiedUserProfile = await this.modifyProfile(
          existingUserProfile,
          jsonUpdate,
        );
        this.logger.logDebug(
          "UserService::updateUserProfile()/strUserProfile2:",
          modifiedUserProfile,
        );
        strUserProfile = JSON.stringify(modifiedUserProfile);
      } else {
        /*
                - if null or invalid, 
                    - take the default json data defined in the UserModel, 
                    - update userData using sessionData, then 
                    - do update based on given jsonUpdate in the api request
                    - converting to string and then updating the userProfile field in the row/s defined in query.where property.
                */
        this.logger.logDebug("UserService::updateUserProfile()/021");
        const currentUser = sessionDataExt?.currentUser ?? ({} as UserModel);
        const { password, userProfile, ...filteredUserData } = currentUser;
        userProfileDefault.userData = filteredUserData;
        this.logger.logDebug(
          "UserService::updateUserProfile()/userProfileDefault:",
          userProfileDefault,
        );
        modifiedUserProfile = (await this.modifyProfile(
          userProfileDefault,
          jsonUpdate,
        )) as IUserProfile;
        // the update should not contain userData
        if ("userData" in modifiedUserProfile) {
          delete (modifiedUserProfile as any).userData;
        }

        this.logger.logDebug(
          "UserService::updateUserProfile()/modifiedUserProfile:",
          modifiedUserProfile,
        );
        strUserProfile = JSON.stringify(modifiedUserProfile);
      }

      this.logger.logDebug("UserService::updateUserProfile()/03");
      requestQuery.update = { userProfile: strUserProfile };
      this.logger.logDebug(
        "UserService::updateUserProfile()/requestQuery:",
        JSON.stringify(requestQuery),
      );

      // update user profile
      const serviceInput: IServiceInput<any> = {
        serviceInstance: this,
        serviceModel: UserModel,
        docName: "UserService::updateUserProfile",
        dSource: 1,
        cmd: {
          action: "update",
          query: requestQuery,
        },
      };
      this.logger.logDebug(
        "UserService::updateUserProfile()/serviceInput:",
        serviceInput,
      );

      const updateRet = await this.updateI(
        req as any,
        res as any,
        serviceInput,
      );
      const newProfile: IUserProfile[] = await this.existingUserProfile(
        req,
        res,
        requestQuery.where.userId,
      );
      this.logger.logDebug(
        "UserService::updateUserProfile()/newProfile1:",
        JSON.stringify(newProfile),
      );

      /**
       * No password is droped from the payload
       */
      if ("userData" in newProfile[0]) {
        if ("password" in newProfile[0].userData) {
          delete newProfile[0].userData.password;
        }
      }

      this.logger.logDebug(
        "UserService::updateUserProfile()/newProfile2:",
        JSON.stringify(newProfile),
      );
      const ret = {
        updateRet: updateRet,
        newProfile: newProfile,
      };

      // Respond with the retrieved profile data
      this.b.cdResp.data = ret;
      return await this.b.respond(req, res);
    } catch (e: any) {
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "UserService:updateUserProfile",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  /////////////////////////////////////////////
  // NEW USER PROFILE METHODS...USING COMMON CLASS ProfileServiceHelper
  //

  async existingUserProfile(req: Request, res: Response, cuid?: number) {
    this.logger.logDebug(`UserServices::existingUserProfile())/cuid:${cuid}`);
    const si: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: UserModel,
      docName: "UserService::existingUserProfile",
      dSource: 1,
      cmd: {
        action: "find",
        query: { select: ["userProfile"], where: { userId: cuid } },
      },
      // mapping: { profileField: "userProfile" },
    };
    return this.b.read(req, res, si);
  }

  async modifyProfile(existingData: any, profileConfig: any) {
    return await ProfileServiceHelper.modifyProfile(
      existingData,
      profileConfig,
    );
  }

  async getUserProfile(req: Request, res: Response) {
    try {
      this.logger.logDebug("UserService::getUserProfile()/01");
      const pl = this.b.getPlData(req as any);
      const userId = pl.userId;

      // Retrieve the user profile using an internal method
      const profile = await this.getUserProfileI(req, res, userId);
      if (profile) {
        this.logger.logDebug("UserService::getUserProfile()/02");
        this.b.i.code = "UserService::getUserProfile";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        await this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = profile;
        await this.b.respond(req, res);
      } else {
        this.logger.logDebug("UserService::getUserProfile()/03");
        const e = "the user provided is invalid";
        this.b.err.push(e);
        const i = {
          messages: this.b.err,
          code: "UserService:getProfile",
          app_msg: "",
        } as IRespInfo;
        this.b.serviceErr(req, res, e, i.code);
        this.b.respond(req, res);
      }
    } catch (e: any) {
      this.logger.logDebug("UserService::getUserProfile()/04");
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "UserService:getProfile",
        app_msg: "",
      };
      this.b.serviceErr(req, res, e, i.code);
      this.b.respond(req, res);
    }
  }

  // Public method to get a user profile
  async getCurrentUserProfile(req: Request, res: Response) {
    try {
      const svSession = new SessionService();
      const session = await svSession.getSession(req, res);
      const userId = session[0].currentUserId as number;
      this.logger.logDebug(
        `UserServices::getCurrentUserProfile9)/userId:${userId}`,
      );
      // Retrieve the user profile using an internal method
      const profile = await this.getUserProfileI(req, res, userId);

      // Respond with the retrieved profile data
      this.b.cdResp.data = profile as IUserProfile;
      return await this.b.respond(req, res);
    } catch (e: any) {
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "UserService:getProfile",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  // Internal method to retrieve user profile
  async getUserProfileI(
    req: Request,
    res: Response,
    userId: number,
  ): Promise<any> {
    try {
      this.logger.logDebug("UserServices::getUserProfileI()/01");
      this.logger.logDebug("UserServices::getUserProfileI()/userId:", userId);
      // // Use BaseService to retrieve user profile
      // const result = await this.b.read(req, res, serviceInput);
      const user: UserModel[] = await this.getUserByID(req, res, userId as any);
      this.logger.logDebug(
        "UserServices::getUserProfileI()/user:",
        JSON.stringify(user),
      );
      this.logger.logDebug("UserServices::getUserProfileI()/02");
      if (user && user[0].userProfile) {
        this.logger.logDebug("UserServices::getUserProfileI()/03");
        delete user[0].password;
        // Create a deep copy of user[0].userProfile to avoid circular references
        let userProfileJSON: IUserProfile = cloneDeep(
          JSON.parse(user[0].userProfile),
        ); // deep copy using lodash

        this.logger.logDebug("UserServices::getUserProfileI()/04");
        let userData: UserModel = cloneDeep(user[0]);
        // delete userData.userProfile;
        delete userData.password;
        // userProfileJSON = cloneDeep(JSON.parse(userData.userProfile)) as IUserProfile;
        userProfileJSON.userData = cloneDeep(userData);
        delete userProfileJSON.userData.userProfile;

        this.logger.logDebug("UserServices::getUserProfileI()/06");
        return userProfileJSON; // Return the cloned userProfileJSON
      } else {
        this.logger.logDebug("UserServices::getUserProfileI()/07");
        /**
         * If the profile is null update records to default then return the default profile
         */
        // update user profile with default
        const serviceInput: IServiceInput<any> = {
          serviceInstance: this,
          serviceModel: UserModel,
          docName: "UserService::getUserProfileI",
          dSource: 1,
          cmd: {
            action: "update",
            query: {
              where: { userId: user[0].userId },
              update: { userProfile: JSON.stringify(userProfileDefault) },
            },
          },
        };
        this.logger.logDebug(
          "UserService::updateCurrentUserProfile()/serviceInput:",
          serviceInput,
        );
        const updateRet = (await this.updateI(
          req as any,
          res as any,
          serviceInput,
        )) as UpdateResult;
        this.logger.logDebug(
          "UserService::getUserProfileI()/updateRet:",
          updateRet,
        );

        if (!updateRet || updateRet.affected === 0) {
          /**
           * respond with server error message
           */
          this.b.err.push("Failed to activate the user account");
          const i = {
            messages: this.b.err,
            code: "UserService:create",
            app_msg: "There was an error activating your account",
          };
          await this.b.setAppState(false, i, null);
          const r = await this.b.respond(req, res);
        }

        if (
          !updateRet ||
          typeof updateRet.affected === "undefined" ||
          updateRet.affected === 0
        ) {
          return userProfileDefault;
        } else {
          return null;
        }
      }
    } catch (e: any) {
      this.logger.logDebug("UserServices::getUserProfileI()/08");
      this.b.err.push(`The user provided is invalid; ${e.toString()}`);
      const i = {
        messages: this.b.err,
        code: "UserService:getProfile",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  // Internal method to handle profile updates
  async updateUserProfileI(
    req: Request,
    res: Response,
    userId: string,
    newProfileData: Partial<IUserProfile>,
  ) {
    try {
      // Use BaseService method to handle JSON updates for user_profile field
      const serviceInput = {
        serviceModel: UserModel,
        cmd: {
          query: {
            where: { user_id: userId },
            update: { user_profile: newProfileData },
          },
        },
      };

      await this.b.updateJSONColumnQB(
        req as any,
        res as any,
        serviceInput,
        "user_profile",
        newProfileData,
      );
      return newProfileData; // Return updated profile
    } catch (error) {
      throw new Error(
        `Error updating user profile: ${(error as Error).message}`,
      );
    }
  }

  // Helper method to validate profile data
  async validateProfileData(
    req: Request,
    res: Response,
    profileData: any,
  ): Promise<boolean> {
    this.logger.logDebug(
      "UserService::validateProfileData()/profileData:",
      profileData,
    );
    if (!profileData) {
      this.logger.logDebug("UserService::validateProfileData()/01");
      return false;
    }

    // Validate that the required fields of IUserProfile exist
    if (!profileData.fieldPermissions || !profileData.userData) {
      this.logger.logDebug("UserService::validateProfileData()/02");
      return false;
    }

    // Example validation for bio length
    if (profileData.bio && profileData.bio.length > 500) {
      this.logger.logDebug("UserService::validateProfileData()/03");
      const e = "Bio data is too long";
      this.b.err.push(e);
      const i = {
        messages: this.b.err,
        code: "UserService:validateProfileData",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      return false; // Bio is too long
    }
    return true;
  }

  // Internal helper method to get a user by ID
  // async getUserByIdI(uid: number): Promise<UserModel> {
  //   return await this.db.user.findOne({ where: { userId: uid } });
  // }
}
