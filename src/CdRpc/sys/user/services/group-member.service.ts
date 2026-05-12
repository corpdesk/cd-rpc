import { Request, Response } from "express";
import { getManager } from "typeorm";
import { BaseService } from "../../base/base.service";
import { IExtServiceInput, IQuery, IServiceInput } from "../../base/i-base";
import { GroupMemberViewModel } from "../models/group-member-view.model";
import { GroupMemberModel } from "../models/group-member.model";
import { SessionService } from "./session.service";
import { CdService } from "../../base/cd.service";
import { GroupModel } from "../models/group.model";
import { CdObjTypeModel } from "../../moduleman/models/cd-obj-type.model";
import { UserModel } from "../models/user.model";
import { UserService } from "./user.service";
import { GenericController } from "../../base/generic-controller";
import { GenericService } from "../../base/generic-service";

// export class GroupMemberService extends CdService {
export class GroupMemberService extends GenericService<GroupMemberModel> {
  // b: BaseService;
  cdToken!: string;
  serviceModel = GroupMemberModel;
  docName: string = "";
  srvSess: SessionService;
  validationCreateParams!: IExtServiceInput<GroupMemberModel>;

  /*
   * create rules
   */
  cRules = {
    required: ["memberGuid", "groupGuidParent", "cdObjTypeId"],
    noDuplicate: ["memberGuid", "groupGuidParent"],
  };

  constructor() {
    super(GroupMemberModel);
    this.b = new BaseService();
    // this.serviceModel = new GroupMemberModel();
    this.srvSess = new SessionService();
  }

  ///////////////
  /**
     * {
            "ctx": "Sys",
            "m": "User",
            "c": "GroupMember",
            "a": "Create",
            "dat": {
                "f_vals": [
                    {
                        "data": {
                            "userIdMember": "1010",
                            "memberGuid": "fe5b1a9d-df45-4fce-a181-65289c48ea00",
                            "groupGuidParent": "D7FF9E61-B143-D083-6130-A51058AD9630",
                            "cdObjTypeId": "9"
                        }
                    },
                    {
                        "data": {
                            "userIdMember": "1015",
                            "memberGuid": "fe5b1a9d-df45-4fce-a181-65289c48ea00",
                            "groupGuidParent": "2cdaba03-5121-11e7-b279-c04a002428aa",
                            "cdObjTypeId": "9"
                        }
                    }
                ],
                "token": "6E831EAF-244D-2E5A-0A9E-27C1FDF7821D"
            },
            "args": null
        }
     * @param req
     * @param res
     */
  async create(req: Request, res: Response) {
    const svSess = new SessionService();
    if (await this.validateCreate(req, res)) {
      await this.beforeCreate(req, res);
      const serviceInput = {
        serviceModel: GroupMemberModel,
        serviceModelInstance: this.serviceModel,
        docName: "Create group-member",
        dSource: 1,
      };
      console.log(
        "GroupMemberService::create()/(req as any).post:",
        (req as any).post,
      );
      const result = await this.b.create(req, res, serviceInput);
      await this.afterCreate(req, res);
      await this.b.successResponse(req, res, result);
    } else {
      await this.b.respond(req, res);
    }
  }

  async beforeCreate(req: Request, res: Response): Promise<any> {
    this.b.setPlData(req, { key: "groupMemberGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "groupMemberEnabled", value: true });
    return true;
  }

  async afterCreate(req: Request, res: Response) {
    const svSess = new SessionService();
    // flag invitation group as accepted
    await this.b.setAlertMessage("new group-member created", svSess, true);
  }

  // async createI(
  //   req: Request,
  //   res: Response,
  //   serviceInputExt: IExtServiceInput<any>
  // ): Promise<GroupMemberModel | boolean> {
  //   // const svSess = new SessionService()
  //   // if (this.validatecreateI(req, res, serviceInputExt)) {
  //   //     return await this.b.createI(req, res, serviceInputExt)
  //   // } else {
  //   //     this.b.setAlertMessage(`could not join group`, svSess, false);
  //   // }
  //   return await this.b.createI(req, res, serviceInputExt);
  // }

  async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<GroupMemberModel>,
  ): Promise<GroupMemberModel | boolean> {
    serviceInputExt.entityData.groupMemberGuid = this.b.getGuid();
    return await this.b.createI(req, res, serviceInputExt);
  }

  // async validateCreateI(req: Request, res: Response, serviceInputExt: IExtServiceInput<any>) {
  //   console.log("GroupMemberService::validateCreateI()/01");
  //   const svSess = new SessionService();
  //   ///////////////////////////////////////////////////////////////////
  //   // 1. Validate against duplication
  //   console.log("GroupMemberService::validateCreateI()/011");
  //   this.b.i.code = "GroupMemberService::validateCreateI";
  //   let ret = false;
  //   params = {
  //     controllerInstance: this,
  //     model: GroupMemberModel,
  //     data: serviceInputExt.entityData,
  //   };
  //   // const isUnique = await this.validateUniqueMultiple(req, res, params)
  //   // await this.b.validateUnique(req, res, params)
  //   if (await this.b.validateUniqueI(req, res, params)) {
  //     console.log("GroupMemberService::validateCreateI()/02");
  //     if (await this.b.validateRequired(req, res, this.cRules)) {
  //       console.log("GroupMemberService::validateCreateI()/03");
  //       ///////////////////////////////////////////////////////////////////
  //       // // 2. confirm the consumerTypeGuid referenced exists
  //       const pl: GroupMemberModel = serviceInputExt.entityData;
  //       let cdObjType: CdObjTypeModel[];
  //       let q: any = { where: { cdObjTypeId: pl.cdObjTypeId } };
  //       let serviceInput: IServiceInput<any> = {
  //         serviceModel: CdObjTypeModel,
  //         modelName: "CdObjTypeModel",
  //         docName: "GroupMemberService::validateCreateI",
  //         cmd: {
  //           action: "find",
  //           query: q,
  //         },
  //         dSource: 1,
  //       };
  //       if ("cdObjTypeId" in pl) {
  //         console.log("GroupMemberService::validateCreateI()/04");
  //         cdObjType = await this.b.get(req, res, serviceInput);
  //         ret = await this.b.validateInputRefernce(
  //           `cdobj type reference is invalid`,
  //           cdObjType,
  //           svSess
  //         );
  //       } else {
  //         console.log("GroupMemberService::validateCreateI()/04");
  //         this.b.setAlertMessage(
  //           `groupGuidParent is missing in payload`,
  //           svSess,
  //           false
  //         );
  //       }
  //       if ("memberGuid" in pl) {
  //         console.log("GroupMemberService::validateCreateI()/05");
  //         if (cdObjType[0].cdObjTypeName === "group") {
  //           console.log("GroupMemberService::validateCreateI()/06");
  //           q = { where: { groupGuid: pl.memberGuid } };
  //           serviceInput.cmd?.query = q;
  //           const group: GroupModel[] = await this.b.get(
  //             req,
  //             res,
  //             serviceInput
  //           );
  //           ret = await this.b.validateInputRefernce(
  //             `member reference is invalid`,
  //             group,
  //             svSess
  //           );
  //         }
  //         if (cdObjType[0].cdObjTypeName === "user") {
  //           console.log("GroupMemberService::validateCreateI()/04");
  //           q = { where: { userGuid: pl.memberGuid } };
  //           serviceInput.cmd?.query = q;
  //           const user: UserModel[] = await this.b.get(req, res, serviceInput);
  //           if (user.length > 0) {
  //             console.log("GroupMemberService::validateCreateI()/05");
  //             this.b.setPlData(req, {
  //               key: "userIdMember",
  //               value: user[0].userId,
  //             });
  //             ret = await this.b.validateInputRefernce(
  //               `member reference is invalid`,
  //               user,
  //               svSess
  //             );
  //           } else {
  //             console.log("GroupMemberService::validateCreateI()/06");
  //             ret = await this.b.validateInputRefernce(
  //               `member reference is invalid`,
  //               user,
  //               svSess
  //             );
  //           }
  //           console.log("GroupMemberService::validateCreateI()/07");
  //         }
  //       } else {
  //         console.log("moduleman/GroupMemberService::validateCreateI()/11");
  //         this.b.setAlertMessage(
  //           `memberGuid is missing in payload`,
  //           svSess,
  //           false
  //         );
  //       }
  //       if ("groupGuidParent" in pl) {
  //         console.log("GroupMemberService::validateCreateI()/08");
  //         console.log("GroupMemberService::validateCreateI()/q:", q);
  //         q = { where: { groupGuid: pl.groupGuidParent } };
  //         serviceInput.cmd?.query = q;
  //         const r: GroupModel[] = await this.b.get(req, res, serviceInput);
  //         console.log("GroupMemberService::validateCreateI()/09");
  //         ret = await this.b.validateInputRefernce(
  //           `parent reference is invalid`,
  //           r,
  //           svSess
  //         );
  //       } else {
  //         console.log("GroupMemberService::validateCreateI()/10");
  //         this.b.setAlertMessage(
  //           `groupGuidParent is missing in payload`,
  //           svSess,
  //           false
  //         );
  //       }
  //       if (this.b.err.length > 0) {
  //         console.log("GroupMemberService::validateCreateI()/11");
  //         ret = false;
  //       }
  //     } else {
  //       console.log("GroupMemberService::validateCreateI()/12");
  //       ret = false;
  //       this.b.setAlertMessage(
  //         `the required fields ${this.b.isInvalidFields.join(", ")} is missing`,
  //         svSess,
  //         true
  //       );
  //     }
  //   } else {
  //     console.log("GroupMemberService::validateCreateI()/13");
  //     ret = false;
  //     this.b.setAlertMessage(
  //       `duplicate for ${this.cRules.noDuplicate.join(", ")} is not allowed`,
  //       svSess,
  //       false
  //     );
  //   }
  //   console.log("GroupMemberService::validateCreateI()/14");
  //   console.log("GroupMemberService::validateCreateI()/ret", ret);
  //   return ret;
  // }

  async groupMemberExists(
    req: Request,
    res: Response,
    q: IQuery,
  ): Promise<boolean> {
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: GroupMemberModel,
      docName: "GroupMemberService::group-memberExists",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    return this.b.read(req, res, serviceInput);
  }

  async read(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any> {
    //
  }

  async update(req: Request, res: Response): Promise<void> {
    // console.log('GroupMemberService::update()/01');
    let q = this.b.getQuery(req);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: GroupMemberModel,
      docName: "GroupMemberService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    // console.log('GroupMemberService::update()/02')
    this.b
      .update$(req, res, serviceInput)
      .subscribe((ret: any) => {
        this.b.cdResp.data = ret;
        this.b.respond(req, res);
      });
  }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  async beforeUpdate(q: any): Promise<any> {
    if (q.update.groupMemberEnabled === "") {
      q.update.groupMemberEnabled = null;
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
    console.log("GroupMemberService::validateCreate()/01");
    const svSess = new SessionService();
    ///////////////////////////////////////////////////////////////////
    // 1. Validate against duplication
    console.log("GroupMemberService::validateCreate()/011");
    this.b.i.code = "GroupMemberService::validateCreate";
    let ret = false;
    // params = {
    //   controllerInstance: this,
    //   model: GroupMemberModel,
    // };

    const params = {
      controllerInstance: this,
      model: GroupMemberModel,
    };
    // const isUnique = await this.validateUniqueMultiple(req, res, params)
    // await this.b.validateUnique(req, res, params)
    if (await this.b.validateUnique(req, res, params)) {
      console.log("GroupMemberService::validateCreate()/02");
      if (await this.b.validateRequired(req, res, this.cRules)) {
        console.log("GroupMemberService::validateCreate()/03");
        ///////////////////////////////////////////////////////////////////
        // // 2. confirm the consumerTypeGuid referenced exists
        const pl: GroupMemberModel = await this.b.getPlData(req);
        let cdObjType: CdObjTypeModel[] = [];
        let q: IQuery = { where: { cdObjTypeId: pl.cdObjTypeId } };
        let serviceInput: IServiceInput<any> = {
          serviceModel: CdObjTypeModel,
          modelName: "CdObjTypeModel",
          docName: "GroupMemberService::validateCreate",
          cmd: {
            action: "find",
            query: q,
          },
          dSource: 1,
        };
        if ("cdObjTypeId" in pl) {
          console.log("GroupMemberService::validateCreate()/04");
          cdObjType = await this.b.get(req, res, serviceInput);
          ret = await this.b.validateInputRefernce(
            `cdobj type reference is invalid`,
            cdObjType,
            svSess,
          );
        } else {
          console.log("GroupMemberService::validateCreate()/05");
          this.b.setAlertMessage(
            `groupGuidParent is missing in payload`,
            svSess,
            false,
          );
        }
        if ("memberGuid" in pl) {
          console.log("GroupMemberService::validateCreate()/06");

          q = { where: { groupGuid: pl.memberGuid as string } } as IQuery;
          serviceInput.serviceModel = GroupModel;
          if (serviceInput.cmd) {
            serviceInput.cmd.query = q;
          }

          if (cdObjType[0].cdObjTypeName === "group") {
            console.log("GroupMemberService::validateCreate()/07");
            const group: GroupModel[] = await this.b.get(
              req,
              res,
              serviceInput,
            );
            ret = await this.b.validateInputRefernce(
              `member reference is invalid`,
              group,
              svSess,
            );
          }
          if (cdObjType[0].cdObjTypeName === "user") {
            console.log("GroupMemberService::validateCreate()/08");
            console.log(
              "GroupMemberService::validateCreate()/serviceInput:",
              serviceInput,
            );
            /**
             * confirm if user exists
             */
            const pl: GroupMemberModel = this.b.getPlData(req);
            console.log("GroupMemberService::validateCreate()/pl:", pl);
            // const userServiceInput: IServiceInput<any> = {
            //     serviceModel: new UserModel(),
            //     modelName: 'UserModel',
            //     docName: 'GroupMemberService::validateCreate',
            //     cmd: { action: 'find', query: { where: { userId: pl.userIdMember} } },
            //     dSource: 1
            // }
            // console.log('GroupMemberService::validateCreate()/userServiceInput:', userServiceInput)
            // // serviceInput.serviceModel = UserModel
            // const user: UserModel[] = await this.b.get(req, res, userServiceInput);
            const svUser = new UserService();
            const user = await svUser.getUserByID(req, res, String(pl.userIdMember));
            console.log("GroupMemberService::validateCreate()/user:", user);
            if (user.length > 0) {
              console.log("GroupMemberService::validateCreate()/09");
              this.b.setPlData(req, {
                key: "userIdMember",
                value: user[0].userId,
              });
              ret = await this.b.validateInputRefernce(
                `member reference is invalid`,
                user,
                svSess,
              );
            } else {
              console.log("GroupMemberService::validateCreate()/10");
              ret = await this.b.validateInputRefernce(
                `member reference is invalid`,
                user,
                svSess,
              );
            }
            console.log("GroupMemberService::validateCreate()/11");
          }
        } else {
          console.log("moduleman/GroupMemberService::validateCreate()/12");
          this.b.setAlertMessage(
            `memberGuid is missing in payload`,
            svSess,
            false,
          );
        }
        if ("groupGuidParent" in pl) {
          console.log("GroupMemberService::validateCreate()/13");
          const groupServiceInput: IServiceInput<any> = {
            serviceModel: GroupModel,
            modelName: "GroupModel",
            docName: "GroupMemberService::validateCreate",
            cmd: {
              action: "find",
              query: { where: { groupGuid: pl.groupGuidParent } },
            },
            dSource: 1,
          };
          // const q: IQuery = { where: { groupGuid: pl.groupGuidParent } };

          // console.log('GroupMemberService::validateCreate()/q:', q)
          // serviceInput.serviceModel = GroupModel
          const group: GroupModel[] = await this.b.get(
            req,
            res,
            groupServiceInput,
          );
          console.log("GroupMemberService::validateCreate()/14");
          console.log("GroupMemberService::validateCreate()/group:", group);
          if (group.length < 1) {
            ret = await this.b.validateInputRefernce(
              `parent reference is invalid`,
              group,
              svSess,
            );
          }
        } else {
          console.log("GroupMemberService::validateCreate()/15");
          this.b.setAlertMessage(
            `groupGuidParent is missing in payload`,
            svSess,
            false,
          );
        }
        if (this.b.err.length > 0) {
          console.log("GroupMemberService::validateCreate()/16");
          ret = false;
        }
      } else {
        console.log("GroupMemberService::validateCreate()/17");
        ret = false;
        this.b.setAlertMessage(
          `the required fields ${this.b.isInvalidFields.join(", ")} is missing`,
          svSess,
          true,
        );
      }
    } else {
      console.log("GroupMemberService::validateCreate()/18");
      ret = false;
      this.b.setAlertMessage(
        `duplicate for ${this.cRules.noDuplicate.join(", ")} is not allowed`,
        svSess,
        false,
      );
    }
    console.log("GroupMemberService::validateCreate()/19");
    console.log("GroupMemberService::validateCreate()/ret", ret);
    return ret;
  }

  // async validateUniqueMultiple(req, res){
  //     let stateArr = [];
  //     let buFVals = (req as any).post.dat.f_vals
  //     console.log('GroupMemberService::validateUniqueMultiple()/buFVals1:', buFVals)
  //     await buFVals.forEach(async (plFVals, fValsIndex) => {
  //         console.log('GroupMemberService::validateUniqueMultiple()/fValsIndex:', fValsIndex)
  //         console.log('GroupMemberService::validateUniqueMultiple()/plFVals12:', plFVals)
  //         // set the req
  //         (req as any).post.dat.f_vals[0] = plFVals
  //         console.log('GroupMemberService::validateUniqueMultiple()/(req as any).post.dat.f_vals[0]:', (req as any).post.dat.f_vals[0])
  //         const isUnq = await this.b.validateUnique(req, res, params)
  //         console.log('GroupMemberService::validateUniqueMultiple()/isUnq:', isUnq)
  //         const state = {
  //             index: fValsIndex,
  //             isUnique: isUnq
  //         }
  //         console.log('GroupMemberService::validateUniqueMultiple()/state:', state)
  //         stateArr.push(state)
  //     })
  //     console.log('GroupMemberService::validateUniqueMultiple()/stateArr1:', stateArr)
  //     // get valid FVal items
  //     // const validStateArr = stateArr.filter((state) => state.isUnique)
  //     // stateArr.forEach((state,i) => {
  //     //     if(state.isUnique === false){
  //     //         console.log('GroupMemberService::validateUniqueMultiple()/stateArr2:', stateArr)
  //     //         buFVals.splice(i, 1);
  //     //         console.log('GroupMemberService::validateUniqueMultiple()/stateArr3:', stateArr)
  //     //     }
  //     // })
  //     buFVals = buFVals.filter((fVals,i) => stateArr[i].isUnigue)
  //     console.log('GroupMemberService::validateUniqueMultiple()/buFVals2:', buFVals)
  //     // restor fVals...but only with valid items
  //     (req as any).post.dat.f_vals = buFVals;
  //     if(buFVals.length > 0){
  //         return true;
  //     } else {
  //         return false;
  //     }

  // }

  /**
   * $members = mGroupMember::getGroupMember2([$filter1, $filter2], $usersOnly)
   * @param req
   * @param res
   * @param q
   */
  async getGroupMember(req: Request, res: Response, q?: IQuery) {
    const b = new BaseService();
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("GroupMemberService::getGroupMember/f:", q);
    const serviceInput = {
      serviceModel: GroupMemberViewModel,
      docName: "GroupMemberService::getGroupMember$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    } as IServiceInput<GroupMemberViewModel>;
    try {
      b.read$(req, res, serviceInput).subscribe((r: any) => {
        console.log("GroupMemberService::read$()/r:", r);
        this.b.i.code = "GroupMemberController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log("GroupMemberService::read$()/e:", e);
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

  async getGroupMemberCount(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("GroupMemberService::getGroupMemberCount/q:", q);
    const serviceInput = {
      serviceModel: GroupMemberViewModel,
      docName: "GroupMemberService::getGroupMemberCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b
      .readCount$(req, res, serviceInput)
      .subscribe((r: any) => {
        this.b.i.code = "GroupMemberController::Get";
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
    console.log("GroupMemberService::delete()/q:", q);
    const serviceInput = {
      serviceModel: GroupMemberModel,
      docName: "GroupMemberService::delete",
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

  async deleteI(req: Request, res: Response, q: IQuery): Promise<any> {
    console.log("GroupMemberService::deleteI()/q:", q);
    const serviceInput = {
      serviceModel: GroupMemberModel,
      docName: "GroupMemberService::deleteI",
      cmd: {
        action: "delete",
        query: q,
      },
      dSource: 1,
    };
    return this.b.delete(req, res, serviceInput);
  }

  async getPals(cuid: string) {
    return [{}];
  }

  getGroupMembers(moduleGroupGuid: string) {
    return [{}];
  }

  getMembershipGroups(cuid: string) {
    return [{}];
  }

  async isMember(req: Request, res: Response, q: IQuery): Promise<boolean> {
    console.log("starting GroupMemberService::isMember(req, res, data)");
    const entityManager = getManager();
    // const opts = q;
    const result = await entityManager.count(GroupMemberModel, q as any);
    if (result > 0) {
      return true;
    } else {
      return false;
    }
  }

  getActionGroups(menuAction: string ) {
    return [{}];
  }

  // async getUserGroupsI(req, res, userId) {
  //     /**
  //      * get groups from group members where user_id_member=userId
  //      */
  // }
  async getUserGroupsI(req: Request, res: Response, userGuid: string) {
    // if (q === null) {
    //     q = this.b.getQuery(req);
    // }
    const q = { where: { memberGuid: userGuid } };
    console.log("GroupMemberService::getUserGroupsI/f:", q);
    const serviceInput = {
      serviceModel: GroupMemberModel,
      docName: "GroupMemberService::getUserGroupsI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      return this.b.read(req, res, serviceInput);
    } catch (e: any) {
      console.log("GroupMemberService::getUserGroupsI()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "GroupMemberService:getUserGroupsI",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }
}
