import { Request, Response } from "express";
import { Observable, of, forkJoin, iif, from } from "rxjs";
import { map, mergeMap } from "rxjs";
import { filter } from "rxjs/operators";
import * as Lá from "lodash";
import { BaseService } from "../../base/base.service";
import { SessionService } from "../../user/services/session.service";
import { UserService } from "../../user/services/user.service";
// import { NotificationService } from "../../comm/services/notification.service";
// import { MemoService } from "../../comm/services/memo.service";
// import { CalendarService } from "../../cd-scheduler/services/cd-scheduler-calendar.services";
import { GroupMemberService } from "../../user/services/group-member.service";
import { ConsumerService } from "./consumer.service";
import { MenuService } from "./menu.service";
import { AclService } from "./acl.service";
import { GroupService } from "../../user/services/group.service";
import { ModuleModel } from "../models/module.model";
import {
  IExtServiceInput,
  IAclCtx,
  ICdRequest,
  IQuery,
  IRespInfo,
  IServiceInput,
  ISessionDataExt,
  ObjectItem,
} from "../../base/i-base";
import { ModuleViewModel } from "../models/module-view.model";
import { Logging } from "../../base/winston.log";
import { GroupModel } from "../../user/models/group.model";
import { CdObjModel } from "../models/cd-obj.model";
import { ConsumerResourceModel } from "../models/consumer-resource.model";
import { MenuModel } from "../models/menu.model";
import { CdObjService } from "./cd-obj.service";
import { ConsumerResourceService } from "./consumer-resource.service";
import { GroupMemberModel } from "../../user/models/group-member.model";
import { SessionModel } from "../../user/models/session.model";
import { inspect } from "util";
import { GenericService } from "../../base/generic-service";
import { Base } from "../../base/Base";
import { CdSchedulerCalendarService } from "../../cd-scheduler/services/cd-scheduler-calendar.services";

// export class ModuleService extends CdService {
export class ModuleService extends GenericService<ModuleModel> {
  logger: Logging;
  cdToken = "";
  serviceModel = ModuleModel;
  docName: string = "Module";
  // b: BaseService;
  svSess!: SessionService;
  svUser!: UserService;
  svGroup!: GroupService;
  svGroupMember!: GroupMemberService;
  // svMemo!: MemoService;
  svMenu!: MenuService;
  // svNotif!: NotificationService;
  svCalnd!: CdSchedulerCalendarService;
  svConsumer!: ConsumerService;
  svAcl!: AclService;
  consumerGuid!: string;
  sessDataExt!: ISessionDataExt;
  retMenuCollection: MenuModel[] = [];

  newModule!: ModuleModel;
  newModCdObj!: CdObjModel;
  newModConsumRecource!: ConsumerResourceModel;
  newGroup!: GroupModel;
  newModMenus!: MenuModel[];
  moduleGroupMembers!: GroupMemberModel;

  /*
   * create rules
   */
  cRules: any = {
    required: ["moduleName", "isSysModule"],
    noDuplicate: ["moduleName"],
  };

  constructor() {
    super(ModuleModel);
    this.b = new BaseService();
    this.logger = new Logging();
  }

  /**
   *
   * {
    "ctx": "Sys",
    "m": "Moduleman",
    "c": "Module",
    "a": "Create",
    "dat": {
        "f_vals": [
            {
                "data": {
                    "moduleName": "CdAi",
                    "isSysModule": false
                },
                "cdObj": {
                    "cdObjName": "CdAi",
                    "cdObjTypeGuid": "809a6e31-9fb1-4874-b61a-38cf2708a3bb",
                    "parentModuleGuid": "04060dfa-fc94-4e3a-98bc-9fbd739deb87"
                }
            }
        ],
        "token": "3ffd785f-e885-4d37-addf-0e24379af338"
    },
    "args": {}
}
   */
  async create(req: Request, res: Response): Promise<void> {
    const svSess = new SessionService();
    if (await this.validateCreate(req, res)) {
      await this.beforeCreate(req, res);
      const serviceInput = {
        serviceInstance: this,
        serviceModel: ModuleModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create Module",
        dSource: 1,
      };
      this.newModule = await this.b.create(
        req as any,
        res as any,
        serviceInput,
      );
      const respData = this.afterCreate(req, res);
      this.b.i.app_msg = "new module created";
      await this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = await respData;
      const r = await this.b.respond(req, res);
    } else {
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      this.b.i.app_msg = "validation failed";
      await this.b.setAppState(false, this.b.i, svSess.sessResp);
      this.logger.logDebug("ModuleService::create()/this.b.err:", this.b.err);
      this.logger.logDebug(
        "ModuleService::create()/this.b.cdResp:",
        inspect(this.b.cdResp, { depth: 2 }),
      );
      const r = await this.b.respond(req, res);
    }
  }

  async validateCreate(req: Request, res: Response) {
    if (!("cdObj" in (req as any).post.dat.f_vals[0])) {
      this.logger.logDebug(
        "ModuleService::validateCreate()/(req as any).post.dat.f_vals[0]:",
        inspect((req as any).post.dat.f_vals[0], { depth: 3 }),
      );
      this.b.i.messages.push(`you must provide cdObj data`);
      return false;
    } else {
      // implement: this.validateCdObj()
    }
    const params = {
      controllerInstance: this,
      model: ModuleModel,
    };
    this.b.i.code = "ModuleService::validateCreate";
    if (await this.b.validateUnique(req, res, params)) {
      if (await this.b.validateRequired(req, res, this.cRules)) {
        return true;
      } else {
        this.b.i.app_msg = `you must provide ${this.cRules.required.join(
          ", ",
        )}`;
        this.b.err.push(this.b.i.app_msg);
        return false;
      }
    } else {
      this.b.i.app_msg = `duplication of ${this.cRules.noDuplicate.join(
        ", ",
      )} not allowed`;
      this.b.err.push(this.b.i.app_msg);
      return false;
    }
  }

  // async beforeCreate(req: Request, res: Response): Promise<boolean> {
  //   const svSess = new SessionService();
  //   this.sessDataExt = await svSess.getSessionDataExt(req, res);
  //   this.b.setPlData(req, { key: "moduleGuid", value: this.b.getGuid() });
  //   this.b.setPlData(req, { key: "moduleEnabled", value: true });
  //   return true;
  // }

  /**
   *
   * afterCreate is used to automate post module creation which includes:
   *  - registration of module group
   *  - registration of the module as a cd-object
   *  - registration of the module as consumer-resource to the current
   *  - registration of module menu items (if requested for)
   *
   * @param req
   * @param res
   * @param createResult
   * @returns
   */
  async afterCreate(req: Request, res: Response): Promise<any> {
    console.log("ModuleService::afterCreate()/01");
    this.logger.logDebug(
      `ModuleService::create()/existenceMap: ${inspect(this.newModule, {
        depth: 2,
      })}`,
    );
    console.log(
      "ModuleService::afterCreate()/this.sessDataExt:",
      this.sessDataExt,
    );
    /**
     * create a new group for the module
     */
    this.newGroup = (await this.registerModuleGroup(req, res)) as GroupModel;
    console.log("ModuleService::afterCreate()/this.newGroup:", this.newGroup);
    /**
     * update new module with new group data
     */
    let updatedModule: any;
    if (this.newGroup) {
      updatedModule = await this.setGroupId(req, res);
      console.log("ModuleService::afterCreate()/updatedModule:", updatedModule);
    } else {
      // Handle the case where newGroup is null, if needed
    }

    /**
     * let the current user to join the group
     */
    this.moduleGroupMembers = (await this.joinModuleGroup(
      req,
      res,
    )) as GroupMemberModel;

    /**
     * create new cdObj
     */
    if ("cdObj" in (req as any).post.dat.f_vals[0]) {
      console.log("ModuleService::afterCreate()/cdOb is available");
      this.newModCdObj = (await this.registerModCdObj(req, res)) as CdObjModel;
      console.log(
        "ModuleService::afterCreate()/this.newModCdObj:",
        this.newModCdObj,
      );
    } else {
      // handle if cdObj component is not supplied
    }

    /**
     * register the module as a consumer resource
     */
    this.newModConsumRecource = (await this.registerModConsumRecource(
      req,
      res,
    )) as ConsumerResourceModel;
    console.log(
      "ModuleService::afterCreate()/this.newModConsumRecource:",
      this.newModConsumRecource,
    );

    /**
     * create module menus
     */
    this.newModMenus = await this.registerModMenu(req, res);
    console.log(
      "ModuleService::afterCreate()/this.newModMenus:",
      await this.newModMenus,
    );

    /**
     * extract the latest state of new module and return to client
     */
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: ModuleModel,
      docName: "ModuleService::afterCreate",
      cmd: {
        action: "find",
        query: { where: { moduleId: this.newModule.moduleId } },
      },
      dSource: 1,
    };
    console.log("ModuleService::afterCreate/serviceInput:", serviceInput);
    const ret = await this.b.read(req, res, serviceInput);
    console.log("ModuleService::afterCreate/ret:", ret);
    return await {
      moduleData: ret,
      moduleGroup: this.newGroup,
      moduleCdObj: this.newModCdObj,
      moduleConsumerResource: this.newModConsumRecource,
      moduleMenu: this.newModMenus,
    };
    // return ret;
  }

  async setGroupId(req: Request, res: Response) {
    console.log("ModuleService::setGroupId/01");
    // const groupData: GroupModel;
    if (this.newModule && this.newModule) {
      // const g = groupData;
      const q = {
        update: {
          groupGuid: this.newModule.moduleGuid,
          moduleGuid: this.newModule.moduleGuid,
        },
        where: {
          moduleId: this.newModule.moduleId,
        },
      };
      console.log("ModuleService::setGroupId/q:", q);
      const serviceInput: IServiceInput<any> = {
        serviceModel: ModuleModel,
        docName: "ModuleService::setGroupId",
        cmd: {
          action: "update",
          query: q,
        },
        dSource: 1,
      };

      return await this.updateI(req, res, serviceInput);
    } else {
      const e = "could not get invoice data";
      this.b.err.push(e);
      const i = {
        messages: this.b.err,
        code: "ModuleService:setGroupId",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  async registerModuleGroup(req: Request, res: Response) {
    const svGroup = new GroupService();

    /**
     *  - confirm bill is not double entry on moduleGroup
     *  - create or update accts/moduleGroup while creating a bill
     */
    const moduleGroup: GroupModel = {
      groupGuid: this.newModule.moduleGuid,
      groupName: this.newModule.moduleName,
      groupOwnerId: this.sessDataExt.currentUser.userId,
      groupTypeId: 2,
      groupEnabled: true,
      moduleGuid: this.newModule.moduleGuid,
      companyId: this.sessDataExt.currentCompany.companyId, // this.b.sessDataExt.currentCompany.companyId
    };
    console.log(
      "ModuleService::registerModuleGroup()/moduleGroup:",
      moduleGroup,
    );
    const si = {
      serviceInstance: svGroup,
      serviceModel: GroupModel,
      serviceModelInstance: svGroup.serviceModel,
      docName: "ModuleService/registerModuleGroup",
      dSource: 1,
    };
    const serviceInputExt: IExtServiceInput<any> = {
      serviceInput: si,
      entityData: moduleGroup,
    };
    console.log("ModuleService::registerModuleGroup()/02");
    /**
     * create new group from new module data
     */
    return await svGroup.createI(req, res, serviceInputExt);
  }

  async joinModuleGroup(req: Request, res: Response) {
    const svGroupMember = new GroupMemberService();

    /**
     *  - confirm bill is not double entry on moduleGroup
     *  - create or update accts/moduleGroup while creating a bill
     */
    const moduleMember: GroupMemberModel = {
      userIdMember: this.sessDataExt.currentUser.userId,
      memberGuid: this.sessDataExt.currentUser.userGuid,
      groupMemberGuid: this.sessDataExt.currentUser.userGuid,
      memberId: this.sessDataExt.currentUser.userId,
      groupGuidParent: this.newGroup["groupGuid"],
      cdObjTypeId: 9,
      groupMemberEnabled: true,
      groupIdParent: this.newGroup["groupId"],
    };
    console.log(
      "ModuleService::registerModuleGroup()/moduleMember:",
      moduleMember,
    );
    const si = {
      serviceInstance: svGroupMember,
      serviceModel: GroupMemberModel,
      serviceModelInstance: svGroupMember.serviceModel,
      docName: "ModuleService/joinModuleGroup",
      dSource: 1,
    };
    const serviceInputExt: IExtServiceInput<any> = {
      serviceInput: si,
      entityData: moduleMember,
    };
    console.log("ModuleService::joinModuleGroup()/02");
    /**
     * create new group from new module data
     */
    return await svGroupMember.createI(req, res, serviceInputExt);
  }

  async registerModCdObj(req: Request, res: Response) {
    const svCdObj = new CdObjService();
    const cdObj: CdObjModel = await this.b.getPlData(req, "cdObj");
    // cd_obj_guid, parent_module_guid(confirmed as file_sys), cd_obj_enabled, obj_guid, obj_id
    cdObj.parentModuleGuid = "48753f8a-b262-471f-b175-1f0ec9e5206d";
    cdObj.objId = this.newModule.moduleId;
    cdObj.objGuid = this.b.getGuid();
    cdObj.cdObjDispName = this.newModule.moduleName;
    cdObj.cdObjEnabled = true;
    cdObj.objGuid = this.newModule.moduleGuid;
    cdObj.objId = this.newModule.moduleId;

    console.log("ModuleService::afterCreate()/cdObj:", cdObj);
    const si = {
      serviceInstance: svCdObj,
      serviceModel: CdObjModel,
      serviceModelInstance: svCdObj.serviceModel,
      docName: "ModuleService/registerModCdObj",
      dSource: 1,
    };
    const serviceInputExt: IExtServiceInput<any> = {
      serviceInput: si,
      entityData: cdObj,
    };
    console.log("ModuleService::registerModCdObj()/02");
    console.log(
      "ModuleService::registerModCdObj()/serviceInputExt:",
      serviceInputExt,
    );
    /**
     * create new group from new module data
     */
    return await svCdObj.createI(req, res, serviceInputExt);
  }

  async registerModConsumRecource(req: Request, res: Response) {
    const svConsumerResource = new ConsumerResourceService();
    console.log(
      "MosuleService::registerModConsumRecource()/this.b.sessDataExt:",
      this.sessDataExt,
    );

    console.log(
      "MosuleService::registerModConsumRecource()/this.newModCdObj:",
      this.newModCdObj,
    );
    // console.log("MosuleService::registerModConsumRecource()/this.newModConsumRecource:", this.newModConsumRecource)
    const consumerModuleResource: ConsumerResourceModel = {
      consumerId: this.sessDataExt.currentConsumer.consumerId,
      consumerGuid: this.sessDataExt.currentConsumer.consumerGuid,
      consumerResourceGuid: this.b.getGuid(),
      consumerResourceName: this.newModule.moduleName,
      consumerResourceLink: "javascript: void(0);",
      consumerResourceEnabled: true,
      objId: this.newModule.moduleId,
      objGuid: this.newModule.moduleGuid,
      cdObjTypeId: 3,
      cdObjId: this.newModCdObj["cdObjId"],
      cdObjGuid: this.newModCdObj["cdObjGuid"],
    };
    console.log(
      "ModuleService::registerModConsumRecource()/consumerModuleResource:",
      consumerModuleResource,
    );
    const si = {
      serviceInstance: svConsumerResource,
      serviceModel: ConsumerResourceModel,
      serviceModelInstance: svConsumerResource.serviceModel,
      docName: "ModuleService/registerModConsumRecource",
      dSource: 1,
    };
    const serviceInputExt: IExtServiceInput<any> = {
      serviceInput: si,
      entityData: consumerModuleResource,
    };
    console.log("ModuleService::registerModConsumRecource()/02");
    /**
     * create new group from new module data
     */
    return svConsumerResource.createI(req, res, serviceInputExt);
  }

  async registerModMenu(req: Request, res: Response) {
    console.log(
      "ModuleService::registerModMenu()/this.sessDataExt:",
      this.sessDataExt,
    );
    const svMenu = new MenuService();
    const svCdObj = new CdObjService();

    if ("moduleMenu" in (req as any).post.dat.f_vals[0]) {
      /**
       * extract requested menu data
       */
      const moduleMenu: MenuModel[] = await this.b.getPlData(req, "moduleMenu");
      console.log("ModuleService::registerModMenu()/moduleMenu:", moduleMenu);

      // Using for...of instead of forEach to handle async properly
      for (let i = 0; i < moduleMenu.length; i++) {
        const menuItem = moduleMenu[i];
        console.log("ModuleService::registerModMenu()/i:", i);
        console.log("ModuleService::registerModMenu()/menuItem:", menuItem);

        /**
         * register cdObj and use the data to fill menu data
         */
        const cdObj: CdObjModel = {
          cdObjName: menuItem.menuName,
          cdObjTypeGuid: "574c73a6-7e5b-40fe-aa89-e52ce1640f42", // menu_item
          parentModuleGuid: this.newModule.moduleGuid,
          cdObjDispName: menuItem.menuName,
          icon: "ri-circle-lines",
          objId: this.newModule.moduleId,
          cdObjEnabled: true,
          objGuid: this.newModule.moduleGuid,
        };
        const moduleMenuCdObj: CdObjModel | boolean =
          await this.registerModCdObj(req, res);
        console.log(
          "ModuleService::registerModMenu()/this.newModule:",
          this.newModule,
        );
        console.log(
          "ModuleService::registerModMenu()/moduleMenuCdObj:",
          moduleMenuCdObj,
        );

        /**
         * prepare and save menu data
         */
        console.log("ModuleService::registerModMenu()1/i:", i);
        console.log(
          "ModuleService::registerModMenu()/this.retMenuCollection:",
          this.retMenuCollection,
        );
        let menuParentId = 0;

        if (i === 0) {
          console.log(
            "ModuleService::registerModMenu()/i=0, setting menuParentId to -1:",
          );
          menuParentId = -1; // First item as parent
        } else {
          console.log("ModuleService::registerModMenu()2/i:", i);
          console.log("ModuleService::registerModMenu()/i>0:");
          if (this.retMenuCollection.length > 0) {
            console.log("ModuleService::registerModMenu()3/i:", i);
            console.log(
              "ModuleService::registerModMenu()/i>0 && this.retMenuCollection.length > 0 :",
            );
            const rootMenu = this.retMenuCollection.find(
              (menu) => menu.menuParentId === -1,
            );
            console.log("ModuleService::registerModMenu()/rootMenu:", rootMenu);
            menuParentId = rootMenu?.menuId as number;
            console.log(
              "ModuleService::registerModMenu()/menuParentId:",
              menuParentId,
            );
          } else {
            console.log(
              "ModuleService::registerModMenu()/problem with insertion to retMenuCollection:",
            );
            this.b.i.app_msg = `problem adding menu item:${menuItem.menuName}`;
            this.b.err.push(this.b.i.app_msg);
          }
        }

        console.log("ModuleService::registerModMenu()4/i:", i);
        console.log(
          "ModuleService::registerModMenu()/menuParentId:",
          menuParentId,
        );
        const newMenuItem: MenuModel = {
          menuName: menuItem.menuName,
          menuLable: menuItem.menuName,
          menuGuid: this.b.getGuid(),
          menuActionId: (moduleMenuCdObj as CdObjModel).cdObjId as number,
          menuParentId: menuParentId,
          moduleId: this.newModule.moduleId as number,
          path: menuItem.path,
          menuIcon: menuItem.menuIcon,
          iconType: menuItem.iconType,
          cdObjId: (moduleMenuCdObj as CdObjModel).cdObjId as number,
          menuEnabled: true,
        };

        console.log("ModuleService::registerModMenu()5/i:", i);
        console.log(
          "ModuleService::registerModMenu()/newMenuItem:",
          newMenuItem,
        );

        const si = {
          serviceInstance: svMenu,
          serviceModel: MenuModel,
          serviceModelInstance: svMenu.serviceModel,
          docName: "ModuleService/registerModMenu",
          dSource: 1,
        };

        const serviceInputExt: IExtServiceInput<any> = {
          serviceInput: si,
          entityData: newMenuItem,
        };

        /**
         * create new group from new module data
         */
        console.log(
          "ModuleService::registerModMenu()/this.retMenuCollection...before:",
          this.retMenuCollection,
        );
        const newMenuRet: MenuModel = await svMenu.createI(
          req,
          res,
          serviceInputExt,
        );
        console.log("ModuleService::registerModMenu()/newMenuRet:", newMenuRet);
        // this.retMenuCollection.push(newMenuRet);
        this.retMenuCollection.push({ ...newMenuRet });
        console.log(
          "ModuleService::registerModMenu()/this.retMenuCollection...after:",
          this.retMenuCollection,
        );

        /**
         * update cdObj for objId and objGuid with menuItemId, and menuItemGuid
         */
        const q = {
          update: {
            objId: newMenuRet.menuId,
            objGuid: newMenuRet.menuGuid,
          },
          where: {
            cdObjId: (moduleMenuCdObj as CdObjModel).cdObjId as number,
          },
        } as IQuery;
        console.log("ModuleService::setGroupId/q:", q);
        const serviceInput: IServiceInput<CdObjModel> = {
          serviceModel: CdObjModel,
          modelName: "CdObjModel",
          docName: "ModuleService::registerModMenu",
          cmd: {
            action: "find",
            query: q,
          },
          dSource: 1,
        };
        const updatedCdObj = svCdObj.updateI(req, res, serviceInput);

        console.log(
          "ModuleService::registerModMenu()/this.retMenuCollection.length:",
          this.retMenuCollection.length,
        );
      }

      console.log(
        "ModuleService::registerModMenu()/this.retMenuCollection:",
        this.retMenuCollection,
      );
    }

    const serviceInput: IServiceInput<any> = {
      serviceInstance: svMenu,
      serviceModel: MenuModel,
      docName: "ModuleService::registerModMenu",
      cmd: {
        action: "find",
        query: { where: { moduleId: this.newModule.moduleId } },
      },
      dSource: 1,
    };

    const retMenu: MenuModel[] = await this.b.read(
      req as any,
      res as any,
      serviceInput,
    );
    console.log("ModuleService::registerModMenu()/retMenu:", retMenu);
    console.log(
      "ModuleService::registerModMenu()/this.retMenuCollection:",
      this.retMenuCollection,
    );

    return retMenu;
  }

  async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<any>,
  ): Promise<ModuleModel | boolean> {
    console.log("ModuleService::create()/serviceInputExt:", serviceInputExt);
    const newModule = await this.b.createI(req, res, serviceInputExt);
    // const ret = await this.afterCreate(req, res, newModule)
    return newModule;
  }

  async purgeModule(req: Request, res: Response) {
    this.logger.logInfo("ModuleService::purgeModule()/Start");

    // wrapper for step logging and consistent error handling
    const runStep = async (label: string, fn: () => Promise<any>) => {
      try {
        const result = await fn();
        this.logger.logInfo(
          `ModuleService::purgeModule()/${label}/result:`,
          inspect(result, { depth: 5 }),
        );
        return result;
      } catch (e: any) {
        this.logger.logInfo(`ModuleService::purgeModule()/${label}/error:`, e);
        throw e;
      }
    };

    try {
      const pl = await this.b.getPlData(req);
      this.logger.logInfo(
        "ModuleService::purgeModule()/pl:",
        inspect(pl, { depth: 3 }),
      );

      const moduleName = pl.moduleName;
      this.logger.logInfo(
        "ModuleService::purgeModule()/moduleName:",
        moduleName,
      );

      // step 1: confirm module existence
      const foundModule = await runStep("foundModule", async () => {
        return await this.getModuleByName(req, res, moduleName);
      });

      if (!foundModule || foundModule.length === 0) {
        this.logger.logInfo(
          "ModuleService::purgeModule()/foundModule:",
          `Module '${moduleName}' not found, nothing to purge.`,
        );
        return;
      }

      // call helpers
      const menuData = await this.purgeModuleFromMenus(
        req,
        res,
        foundModule[0],
      );
      const cdObjData = await this.purgeModuleFromCdObj(req, res, moduleName);
      const consumerResourceData = await this.purgeModuleFromConsumerResource(
        req,
        res,
        moduleName,
        cdObjData,
      );
      const groupData = await this.purgeModuleFromGroup(
        req,
        res,
        foundModule[0],
      );
      const groupMemberData = await this.purgeModuleFromGroupMember(
        req,
        res,
        groupData,
      );

      // step 7: delete module
      const delModuleResult = await runStep("delModuleResult", async () => {
        const where = { moduleId: foundModule[0].moduleId };
        this.logger.logInfo(
          "ModuleService::purgeModule()/delModuleResult/where:",
          inspect(where, { depth: 3 }),
        );
        return await this.deleteI(req, res, { where });
      });

      // success response
      const svSess = new SessionService();
      this.b.i.app_msg = `module ${moduleName} purged successfully`;
      await this.b.setAppState(true, this.b.i, svSess.sessResp);

      this.b.cdResp.data = {
        moduleData: foundModule,
        menuData,
        cdObjData,
        consumerResourceData,
        groupData,
        groupMemberData,
        delModuleResult,
      };

      await this.b.respond(req, res);
    } catch (e: any) {
      this.logger.logInfo("ModuleService::purgeModule()/error:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:purgeModule",
        app_msg: "Purge Module Failed",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  /**
   * Helper methods
   */
  private async purgeModuleFromMenus(
    req: Request,
    res: Response,
    module: ModuleModel,
  ) {
    const svMenu = new MenuService();

    const foundMenu = await svMenu.getMenuI(req, res, {
      where: { moduleId: module.moduleId },
    });

    if (!foundMenu || foundMenu.length === 0) {
      this.logger.logInfo(
        "ModuleService::purgeModuleFromMenus:",
        "No menus found, skipping.",
      );
      return null;
    }

    const delMenuResult = await svMenu.deleteI(req, res, {
      where: { moduleId: module.moduleId },
    });

    return { foundMenu, delMenuResult };
  }

  private async purgeModuleFromCdObj(
    req: Request,
    res: Response,
    moduleName: string,
  ) {
    const svCdObj = new CdObjService();
    const where = {
      cdObjName: moduleName,
      cdObjTypeGuid: "809a6e31-9fb1-4874-b61a-38cf2708a3bb",
    };

    const foundCdObj = await svCdObj.getCdObjI({ where });
    this.logger.logInfo(
      "ModuleService::purgeModuleFromCdObj/foundCdObj:",
      inspect(foundCdObj, { depth: 3 }),
    );

    if (!foundCdObj || foundCdObj.length === 0) {
      this.logger.logInfo(
        "ModuleService::purgeModuleFromCdObj:",
        `No CdObj found for '${moduleName}', skipping.`,
      );
      return null;
    }

    const delCdObjResult = await svCdObj.deleteI(req, res, {
      where: {
        cdObjName: moduleName,
        cdObjTypeGuid: foundCdObj[0].cdObjTypeGuid,
      },
    });

    this.logger.logInfo(
      "ModuleService::purgeModuleFromCdObj/delCdObjResult:",
      inspect(delCdObjResult, { depth: 3 }),
    );

    return { foundCdObj, delCdObjResult };
  }

  private async purgeModuleFromConsumerResource(
    req: Request,
    res: Response,
    moduleName: string,
    cdObjData: any,
  ) {
    if (!cdObjData?.foundCdObj) {
      this.logger.logInfo(
        "ModuleService::purgeModuleFromConsumerResource:",
        "No CdObj data, skipping consumer resources.",
      );
      return null;
    }

    const svConsumerResource = new ConsumerResourceService();
    const delConsumerResourceResult = await svConsumerResource.deleteI(
      req,
      res,
      {
        where: {
          consumerResourceName: moduleName,
          cdObjTypeGuid: "809a6e31-9fb1-4874-b61a-38cf2708a3bb",
        },
      },
    );

    this.logger.logInfo(
      "ModuleService::purgeModuleFromConsumerResource/delConsumerResourceResult:",
      inspect(delConsumerResourceResult, { depth: 3 }),
    );

    return delConsumerResourceResult;
  }

  private async purgeModuleFromGroup(
    req: Request,
    res: Response,
    module: ModuleModel,
  ) {
    const svGroup = new GroupService();
    const foundGroup = await svGroup.getGroupI(req, res, {
      where: { groupGuid: module.moduleGuid },
    });

    this.logger.logInfo(
      "ModuleService::purgeModuleFromGroup/foundGroup:",
      inspect(foundGroup, { depth: 3 }),
    );

    if (!foundGroup || foundGroup.length === 0) {
      this.logger.logInfo(
        "ModuleService::purgeModuleFromGroup:",
        `No Group found for module '${module.moduleName}', skipping.`,
      );
      return null;
    }

    const delGroupResult = await svGroup.deleteI(req, res, {
      where: { groupId: foundGroup[0].groupId },
    });

    this.logger.logInfo(
      "ModuleService::purgeModuleFromGroup/delGroupResult:",
      inspect(delGroupResult, { depth: 3 }),
    );

    return { foundGroup, delGroupResult };
  }

  private async purgeModuleFromGroupMember(
    req: Request,
    res: Response,
    groupData: any,
  ) {
    if (!groupData?.foundGroup) {
      this.logger.logInfo(
        "ModuleService::purgeModuleFromGroupMember:",
        "No Group data, skipping group members.",
      );
      return null;
    }

    const svGroupMember = new GroupMemberService();
    const delGroupMembersResult = await svGroupMember.deleteI(req, res, {
      where: { groupIdParent: groupData.foundGroup[0].groupId },
    });

    this.logger.logInfo(
      "ModuleService::purgeModuleFromGroupMember/delGroupMembersResult:",
      inspect(delGroupMembersResult, { depth: 3 }),
    );

    return delGroupMembersResult;
  }

  /**
   * The function of this module is to return Corpdesk facilities that are available to a given user.
   * This is applicable before and after login.
   * Before login the current user is considered anonimous and has a userName of 'anon'.
   * When login is successfull the current user aquires the userName based on user registered values.
   * This method uses getAclModule$ to fetch allowedModules$.
   * allowedModules$ is a set of modules that the requesting user is allowed access.
   * allowedModules$ is generated using this.getAclModule$(req, res, { currentUser: cUser, consumerGuid: cguid });
   * These modules are then used to generate menu data.
   * To fetch menu, this method calls this.svMenu.getAclMenu$(req, res, { modules$: allowedModules$, modulesCount: am.length }) from MenuService.
   * In all these proceses, AclService is consulted to facilitate privilage access logics.
   *
   * @param req // request handle from the api client
   * @param res // response handle
   * @param cUser // the handle for the current user accessing the api
   * @returns:
   * Even through the return is currently marked as any, the return format is curretly an object of the structure below:
   * {
   *      consumer: ConsumerModel, // request to corpdesk api are made in the context of a given consumer organization entity.
   *      menuData: MenuItem[], // unlike MenuModel, it has an attribute children: MenuItem[],
   *      userData: UserModel // object of current user
   * }
   *
   */

  // getModulesUserData$(
  //   req: Request,
  //   res: Response,
  //   sessData: SessionModel,
  // ): Observable<any> {
  //   this.b.logTimeStamp("ModuleService::getModulesUserData$/01");
  //   console.log("ModuleService::getModulesUserData$/sessData:", sessData);
  //   console.log(
  //     "ModuleService::getModulesUserData$/(req as any).post.dat.token:",
  //     (req as any).post.dat.token,
  //   );

  //   // Initialize necessary services
  //   this.svSess = new SessionService();
  //   this.svUser = new UserService();
  //   // this.svMemo = new MemoService();
  //   // this.svNotif = new NotificationService();
  //   this.svCalnd = new CalendarService();
  //   this.svGroup = new GroupService();
  //   this.svGroupMember = new GroupMemberService();
  //   this.svConsumer = new ConsumerService();
  //   this.svMenu = new MenuService();
  //   this.svAcl = new AclService();

  //   // const cdReq: ICdRequest = (req as any).post;
  //   // cdReq.
  //   // Use 'from()' to convert the async method to an Observable
  //   return from(this.svSess.getSessionDataExt(req, res)).pipe(
  //     mergeMap((sessionDataExt: ISessionDataExt) => {
  //       // After retrieving session data, proceed with other logic
  //       this.sessDataExt = sessionDataExt;
  //       console.log(
  //         "ModuleService::getModulesUserData$()/sessionDataExt:",
  //         sessionDataExt,
  //       );

  //       /**
  //        * Extract the request consumer guid
  //        */
  //       // const cguid = this.svConsumer.getConsumerGuid(req);
  //       const cguid = sessionDataExt.currentConsumer.consumerGuid;

  //       /**
  //        * Use consumer guid to get the associated consumer
  //        */
  //       // const clientConsumer$ = this.svConsumer.getConsumerByGuid$(req, res, cguid);
  //       /**
  //        * derive allowed modules
  //        */
  //       // const allowedModules$ = this.getAclModule$(req, res, { currentUser: cUser, consumerGuid: cguid });
  //       const allowedModules$ = this.getAclModule$(req, res, sessionDataExt);
  //       /**
  //        * use allowed modules to process menu generation
  //        */
  //       const menuData$ = allowedModules$.pipe(
  //         mergeMap((am: any[]) =>
  //           iif(
  //             () => {
  //               this.logger.logInfo(
  //                 "ModuleService::getModulesUserData$/am:",
  //                 am,
  //               );
  //               return am.length > 0;
  //             },
  //             this.svMenu.getAclMenu$(
  //               req,
  //               res,
  //               { modules$: allowedModules$, modulesCount: am.length },
  //               sessionDataExt,
  //             ),
  //             [],
  //           ),
  //         ),
  //       );

  //       /**
  //        * use forkJoin to prepare Observable results containing various categories of data in an object.
  //        * Current categories include:
  //        *      - consumer // the current organization/company that runs Corpdesk
  //        *      - menuData // hierarchial menu for modules where current user have access
  //        *      - userData // current user
  //        *      - note from the comments below that there are several options for future categories of data to integrate.
  //        *      - The design is also to have possibilities of configuring which data is included or not or automate based on prevailing circumstances
  //        */
  //       const result$ = forkJoin({
  //         consumer: of(sessionDataExt.currentConsumer),
  //         menuData: menuData$,
  //         userData: of(sessionDataExt.currentUser),
  //         userProfile: of(sessionDataExt.currentUserProfile),
  //         /////////////////////
  //         // OPTIONAL ADDITIVES:
  //         // notifData: notifdata,
  //         // notifSumm: notifsumm,
  //         // memoSumm: memosumm,
  //         // calndSumm: calndsumm,
  //         // contacts: userContacts,
  //         // pals: userPals,
  //         // aCoid: acoid,
  //       });

  //       // Return the forkJoin result as an Observable
  //       return result$;
  //     }),
  //   );
  // }
  // import { from, of, forkJoin, iif, Observable } from 'rxjs';
  // import { mergeMap, filter } from 'rxjs/operators';

  getModulesUserData$(
    req: Request,
    res: Response,
    sessData: SessionModel,
  ): Observable<any> {
    this.b.logTimeStamp("ModuleService::getModulesUserData$/01");

    // Initialize services
    this.svSess = new SessionService();
    this.svUser = new UserService();
    this.svCalnd = new CdSchedulerCalendarService();
    this.svGroup = new GroupService();
    this.svGroupMember = new GroupMemberService();
    this.svConsumer = new ConsumerService();
    this.svMenu = new MenuService();
    this.svAcl = new AclService();

    return from(this.svSess.getSessionDataExt(req, res)).pipe(
      // 1. Filter out nulls and tell TS that the result is definitely ISessionDataExt
      filter(
        (sessionDataExt): sessionDataExt is ISessionDataExt =>
          sessionDataExt !== null,
      ),

      mergeMap((sessionDataExt: ISessionDataExt) => {
        // 2. This assignment is now safe
        this.sessDataExt = sessionDataExt;

        console.log(
          "ModuleService::getModulesUserData$()/sessionDataExt:",
          sessionDataExt,
        );

        let cguid = "";
        if(sessionDataExt.currentConsumer && sessionDataExt.currentConsumer.consumerGuid) {
          cguid = sessionDataExt.currentConsumer.consumerGuid;
        } else {
          cguid = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx";
        }
        
        const allowedModules$ = this.getAclModule$(req, res, sessionDataExt);

        const menuData$ = allowedModules$.pipe(
          mergeMap((am: any[]) =>
            iif(
              () => {
                this.logger.logInfo(
                  "ModuleService::getModulesUserData$/am:",
                  am,
                );
                return am.length > 0;
              },
              this.svMenu.getAclMenu$(
                req,
                res,
                { modules$: allowedModules$, modulesCount: am.length },
                sessionDataExt,
              ),
              of([]), // Wrapped in 'of' to ensure it returns an Observable
            ),
          ),
        );

        const result$ = forkJoin({
          consumer: of(sessionDataExt.currentConsumer),
          menuData: menuData$,
          userData: of(sessionDataExt.currentUser),
          userProfile: of(sessionDataExt.currentUserProfile),
        });

        return result$;
      }),
    );
  }

  /**
     * Acl modules or allowed modules are modules that are accessible to the current user.
     * For this to be aggregated, 3 datasets are retreived from database to an object as below:
     *  {
            // unfilteredModules: this.getAll$(req, res).pipe(map((m) => { return m })), // for isRoot
            userRoles: this.svAcl.aclUser$(req: Request, res: Response, q: IQuery).pipe(map((m) => { return m })),
            consumerModules: this.svAcl.aclModule$(req, res).pipe(map((m) => { return m })),
            moduleParents: this.svAcl.aclModuleMembers$(req: Request, res: Response, q: IQuery).pipe(map((m) => { return m }))
        }

     *  1. User Roles:
        The current user must be registered as a resource to the current consumer in session.
     *  Exceptions is modules that are marked as public.
     *  Apart from being registered as a resource to a consumer, the consumer type is 
     *  used to mark user roles eg consumer_root, consumer_user, consumer_tech, consumer_admin
     *  The above are fetched using consumer_resource_view
     * 
     *  2. Consumer Modules:
     *  These are modules that the current user has acces to.
     *  Must be a module registed as a resource for a given consumer.
     *  The data is also fetched from consumer_resources_view
     * 
     *  3. ModuleParents:
     *  
     * 
     * 
     * @param req 
     * @param res 
     * @param params 
     * @returns 
     */
  getAclModule$(
    req: Request,
    res: Response,
    sessionDataExt: ISessionDataExt,
  ): Observable<any> {
    this.b.logTimeStamp("ModuleService::getAclModule$/01");
    if(sessionDataExt.currentConsumer && sessionDataExt.currentConsumer.consumerGuid) {
      this.consumerGuid = sessionDataExt.currentConsumer.consumerGuid;
    } else {
      this.consumerGuid = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx";
    }
    this.svAcl.consumerGuid = this.consumerGuid;
    // this.logger.logInfo('ModuleService::getAclModule$()/sessionDataExt:', sessionDataExt);
    this.logger.logInfo(
      "ModuleService::getAclModule$()/this.svAcl.consumerGuid:",
      this.svAcl.consumerGuid,
    );

    return forkJoin({
      userRoles: this.svAcl.aclUser$(req, res, sessionDataExt).pipe(
        map((m) => {
          return m;
        }),
      ),
      consumerModules: this.svAcl.aclModule$(req, res).pipe(
        map((m) => {
          return m;
        }),
      ),
      moduleParents: this.svAcl
        .aclModuleMembers$(req, res, sessionDataExt)
        .pipe(
          map((m) => {
            return m;
          }),
        ),
    }).pipe(
      map((acl: any) => {
        this.b.logTimeStamp("ModuleService::getModulesUserData$/02");
        this.logger.logInfo("ModuleService::getAclModule$()/acl:", acl);

        const publicModules = acl.consumerModules.filter(
          (m: any) => m.moduleIsPublic,
        );
        this.logger.logInfo(
          "ModuleService::getAclModule$()/publicModules:",
          publicModules,
        );

        if (acl.userRoles.isConsumerRoot.length > 0) {
          return acl.consumerModules;
        } else if (acl.userRoles.isConsumerUser.length > 0) {
          const userModules = this.b.intersect(
            acl.consumerModules,
            acl.moduleParents,
            "moduleGuid",
          );
          this.logger.logInfo(
            "ModuleService::getModulesUserData$/userModules:",
            userModules,
          );
          this.logger.logInfo(
            "ModuleService::getModulesUserData$/publicModules:",
            publicModules,
          );

          /**
           * Combine userModules and publicModules and remove duplicates based on moduleGuid
           */
          const combinedModules = userModules.concat(publicModules);
          const uniqueModules = Array.from(
            new Set(combinedModules.map((a: any) => a.moduleGuid)),
          ).map((guid) =>
            combinedModules.find((a: any) => a.moduleGuid === guid),
          );

          return uniqueModules;
        } else {
          return publicModules;
        }
      }),
    );
  }

  // /**
  //  * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "Module",
  //         "a": "Get",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "filter": {
  //                         "select":["moduleId","moduleGuid"],
  //                         "where": { "moduleId":98}
  //                         }
  //                 }
  //             ],
  //             "token": "29947F3F-FF52-9659-F24C-90D716BC77B2"
  //         },
  //         "args": null
  //     }
  //  * @param req
  //  * @param res
  //  */
  getModule(req: Request, res: Response) {
    const f = this.b.getQuery(req);
    // this.logger.logInfo('ModuleService::getModule/f:', f);
    const serviceInput = {
      serviceModel: ModuleViewModel,
      docName: "MenuService::getModuleMenu$",
      cmd: {
        action: "find",
        query: f,
      },
      dSource: 1,
    };
    this.b.read$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = "ModulesController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  getModuleCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    this.logger.logInfo("ModuleService::getModuleCount/q:", q);
    const serviceInput = {
      serviceModel: ModuleViewModel,
      docName: "MenuService::getModuleCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b
      .readCount$(req, res, serviceInput)
      .subscribe((r: any) => {
        this.b.i.code = "ModulesController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
  }

  getModuleQB(req: Request, res: Response) {
    console.log("ModuleService::getModuleQB()/1");
    this.b.entityAdapter.registerMappingFromEntity(ModuleViewModel);
    const q = this.b.getQuery(req);
    // console.log('MenuService::getModuleCount/q:', q);
    const serviceInput = {
      serviceModel: ModuleViewModel,
      docName: "ModuleService::getModuleQB",
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

  getModuleByName(
    req: Request,
    res: Response,
    moduleName: string,
  ): Promise<ModuleModel[]> {
    const b = new BaseService();
    this.logger.logInfo(
      "ModuleService::getModuleByName()/moduleName:",
      moduleName,
    );
    // const f = this.b.getQuery(req);
    const f = { where: { moduleName: `${moduleName}` } };
    const serviceInput = {
      serviceInstance: this,
      serviceModel: ModuleViewModel,
      docName: "ModuleService::getModuleByName",
      cmd: {
        action: "find",
        query: f,
      },
      dSource: 1,
    } as IServiceInput<ModuleViewModel>;
    return b.read(req, res, serviceInput);
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

  // remove(req: Request, res: Response): Promise<void> {
  //   // this.logger.logInfo(`starting SessionService::remove()`);
  //   return null;
  // }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  async beforeUpdate(q: any): Promise<IQuery> {
    if (q.update.moduleEnabled === "") {
      q.update.moduleEnabled = null;
    }
    return q;
  }

  async update(req: Request, res: Response) {
    const serviceInput = {
      serviceModel: ModuleModel,
      docName: "MenuService::update",
      cmd: {
        action: "update",
        query: (req as any).post.dat.f_vals[0].query,
      },
      dSource: 1,
    };
    this.b
      .update$(req, res, serviceInput)
      .subscribe((ret: any) => {
        this.b.cdResp.data = ret;
        this.b.respond(req, res);
      });
  }

  // async updateI(req: Request, res: Response, serviceInput?: IServiceInput<ModuleModel>): Promise<any> {
  //   console.log("ModuleService::updateI()/01");
  //   // let q = this.b.getQuery(req);
  //   q = this.beforeUpdate(q);
  //   if(!serviceInput)
  //   serviceInput = {
  //     serviceModel: ModuleModel,
  //     docName: "ModuleService::updateI",
  //     cmd: {
  //       action: "update",
  //       query: q,
  //     },
  //     dSource: 1,
  //   };
  //   console.log("ModuleService::update()/02");
  //   return this.b.update(req, res, serviceInput);
  // }
  async updateI(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<ModuleModel>,
  ): Promise<any> {
    console.log("UserService::updateI()/01");

    // Check if cmd exists before assignment
    if (serviceInput.cmd) {
      (serviceInput.cmd as any).query = await this.beforeUpdate(
        serviceInput.cmd.query as IQuery,
      );
    }

    serviceInput = {
      serviceModel: ModuleModel,
      docName: "ModuleService::updateI",
      cmd: {
        action: "update",
        query: serviceInput.cmd?.query as IQuery,
      },
      dSource: 1,
    };
    console.log("ModuleService::updateI()/02");
    return this.b.update(req, res, serviceInput);
  }

  async delete(req: Request, res: Response) {
    const serviceInput = {
      serviceModel: ModuleModel,
      docName: "ModuleService::delete",
      cmd: {
        action: "delete",
        query: (req as any).post.dat.f_vals[0].query,
      },
      dSource: 1,
    };

    this.b
      .delete$(req, res, serviceInput)
      .subscribe((ret: any) => {
        /**
         * TODO:
         * implemement svGroup.deletI(req,res)
         * then use it to delet group associated with this module
         */
        this.b.cdResp.data = ret;
        this.b.respond(req, res);
      });
  }

  async deleteI(req: Request, res: Response, q: IQuery): Promise<any> {
    const serviceInput = {
      serviceModel: ModuleModel,
      docName: "ModuleService::deleteI",
      cmd: {
        action: "delete",
        query: q,
      },
      dSource: 1,
    };
    return this.b.delete(req, res, serviceInput);
  }
}
