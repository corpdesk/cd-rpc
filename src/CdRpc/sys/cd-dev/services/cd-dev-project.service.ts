import { Request, Response } from "express";
import { FindManyOptions, getManager } from "typeorm";
import { BaseService } from "../../base/base.service";
import { CdService } from "../../base/cd.service";
import {
  IExtServiceInput,
  JSDPInstruction,
  IQuery,
  IServiceInput,
  ISessionDataExt,
} from "../../base/i-base";
import { CdObjTypeModel } from "../../moduleman/models/cd-obj-type.model";
import { GroupModel } from "../../user/models/group.model";
import {
  IUserProfile,
  profileDefaultConfig,
  UserModel,
  userProfileDefault,
} from "../../user/models/user.model";
import { SessionService } from "../../user/services/session.service";
import { UserService } from "../../user/services/user.service";
import {
  CdDevProjectModel,
  ICdDevProjectProfile,
  IUserProfileOnly,
} from "../models/cd-dev-project.model";
import { CdDevProjectViewModel } from "../models/cd-dev-project-view.model";
import { CdDevModel } from "../models/cd-dev.model";
import { CdDevProjectTypeModel } from "../models/cd-dev-project-type.model";
import { Logging } from "../../base/winston.log";
import { ProfileServiceHelper } from "../../utils/profile-service-helper";
import { GenericService } from "../../base/generic-service";

// export class CdDevProjectService extends CdService {
export class CdDevProjectService extends GenericService<CdDevProjectModel> {
  logger: Logging;
  // b: BaseService;
  cdToken!: string;
  serviceModel = CdDevProjectModel;
  docName!: string;
  srvSess: SessionService;
  validationCreateParams: any;
  mergedProfile!: ICdDevProjectProfile;

  /*
   * create rules
   */
  cRules = {
    required: [
      "cdDevProjectName",
      "cdDevProjectData",
      "userId",
      "cdDevProjectTypeId",
    ],
    noDuplicate: ["userId", "cdDevProjectName", "cdDevProjectTypeId"],
  };

  constructor() {
    super(CdDevProjectModel);
    this.logger = new Logging();
    this.b = new BaseService();
    // this.serviceModel = new CdDevProjectModel();
    this.srvSess = new SessionService();
  }

  ///////////////
  /**
     * {
            "ctx": "Sys",
            "m": "Moduleman",
            "c": "CdDevProject",
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

  // async create(req: Request, res: Response, extCdObj?: any): Promise<void> 
  async create(req: Request, res: Response): Promise<void>  {
    const svSess = new SessionService();
    const fValsArray = req.body.dat.f_vals || []; // Get the f_vals array
    let results: any = [];

    for (let fVal of fValsArray) {
      req.body.dat.f_vals = [fVal]; // Set current fVal as a single object in the array

      if (await this.validateCreate(req, res)) {
        console.log("CdDevProjectService::create()/validation succedded");
        console.log(
          "cdDev/CdDevProjectService::create()/this.b.err1:",
          this.b.err,
        );
        await this.beforeCreate(req, res);
        console.log(
          "cdDev/CdDevProjectService::create()/this.b.err2:",
          this.b.err,
        );
        const serviceInput = {
          serviceModel: CdDevProjectModel,
          serviceModelInstance: this.serviceModel,
          docName: "Create cdDevProject",
          dSource: 1,
        };
        console.log(
          "CdDevProjectService::create()/(req as any).post:",
          (req as any).post,
        );
        const respData = await this.b.create(req, res, serviceInput);
        console.log("CdDevProjectService::create()/respData:", respData);

        // Store the result for this fVal
        await results.push(respData);
        this.b.i.app_msg = "cd-dev profile created";
        await this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = results;
        await this.b.respond(req, res);
      } else {
        // If validation fails, push the error state
        console.log("CdDevProjectService::create()/validation failed");
        console.log(
          "cdDev/CdDevProjectService::create()/this.b.err3:",
          this.b.err,
        );
        // await results.push({ success: false, message: `Validation failed` });
        results = [];

        // this.b.i.app_msg = "cd-dev profile creation failed";
        const i = {
          messages: this.b.err,
          code: "CdDevProjectService:create",
          app_msg: "cd-dev profile creation failed",
        };
        await this.b.setAppState(false, i, svSess.sessResp);
        // this.b.cdResp.app_state.info.messages = this.b.err
        this.b.cdResp.data = results;
        await this.b.respond(req, res);
      }
    }
  }

  async validateCreate(req: Request, res: Response) {
    const svSess = new SessionService();
    let pl: CdDevProjectModel = this.b.getPlData(req);
    console.log("CdDevProjectService::validateCreate()/pl:", pl);

    // Validation params for the different checks
    // When reference of for example userId is given as 1010, the userId=1010 must be existing
    // or if a type id is given, the type muxt be existing
    const validationParams = [
      {
        field: "userId",
        query: { userId: pl.userId },
        model: UserModel,
      },
      {
        field: "cdDevProjectTypeId",
        query: { cdDevProjectTypeId: pl.cdDevProjectTypeId },
        model: CdDevProjectTypeModel,
      },
    ];

    const valid = await this.validateExistence(req, res, validationParams);
    console.log(
      "CdDevProjectService::validateCreate/this.b.err1:",
      JSON.stringify(this.b.err),
    );

    if (!valid) {
      this.logger.logInfo(
        "cdDev/CdDevProjectService::validateCreate()/Reference validation failed",
      );
      const e = "reference validation for fields failed!";
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "BaseService:update",
        app_msg: "",
      };
      // await this.b.serviceErr(req, res, e, i.code)
      await this.b.setAppState(false, i, svSess.sessResp);
      return false;
    }

    // Validate against duplication and required fields
    this.validationCreateParams = {
      controllerInstance: this,
      model: CdDevProjectModel,
    };

    if (await this.b.validateUnique(req, res, this.validationCreateParams)) {
      if (await this.b.validateRequired(req, res, this.cRules)) {
        return true;
      } else {
        this.b.setAlertMessage(
          `Missing required fields: ${this.b.isInvalidFields.join(", ")}`,
          svSess,
          true,
        );

        this.logger.logInfo(
          "cdDev/CdDevProjectService::validateCreate()/Required fields validation failed",
        );
        const e = "required fields validation for fields failed!";
        this.b.err.push(e.toString());
        const i = {
          messages: this.b.err,
          code: "CdDevProjectService:validateCreate",
          app_msg: "",
        };
        // await this.b.serviceErr(req, res, e, i.code)
        await this.b.setAppState(false, i, svSess.sessResp);
        return false;
      }
    } else {
      //   this.b.setAlertMessage(
      //     `Duplicate entry for ${this.cRules.noDuplicate.join(", ")}`,
      //     svSess,
      //     false
      //   );
      const e = `Duplicate entry for ${this.cRules.noDuplicate.join(", ")}`;
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdDevProjectService:validateCreate",
        app_msg: "",
      };
      // await this.b.serviceErr(req, res, e, i.code)
      await this.b.setAppState(false, i, svSess.sessResp);
      console.log(
        "cdDev/CdDevProjectService::validateCreate()/this.b.err1:",
        this.b.err,
      );
      return false;
    }
  }

  async validateExistence(req: Request, res: Response, validationParams: any) {
    const promises = validationParams.map((param: any) => {
      const serviceInput = {
        serviceModel: param.model,
        docName: `CdDevProjectService::validateExistence(${param.field})`,
        cmd: {
          action: "find",
          query: { where: param.query },
        },
        dSource: 1,
      };
      console.log(
        "CdDevProjectService::validateExistence/param.model:",
        param.model,
      );
      console.log(
        "CdDevProjectService::validateExistence/serviceInput:",
        JSON.stringify(serviceInput),
      );
      const b = new BaseService();
      return b.read(req, res, serviceInput).then((r: any) => {
        if (r.length > 0) {
          this.logger.logInfo(
            `cdDev/CdDevProjectService::validateExistence() - ${param.field} exists`,
          );
          return true;
        } else {
          this.logger.logError(
            `cdDev/CdDevProjectService::validateExistence() - Invalid ${param.field}`,
          );
          this.b.i.app_msg = `${param.field} reference is invalid`;
          this.b.err.push(this.b.i.app_msg);
          console.log(
            "CdDevProjectService::validateExistence/this.b.err1:",
            JSON.stringify(this.b.err),
          );
          return false;
        }
      });
    });

    const results = await Promise.all(promises);
    console.log("CdDevProjectService::validateExistence/results:", results);
    console.log(
      "CdDevProjectService::validateExistence/this.b.err2:",
      JSON.stringify(this.b.err),
    );
    // If any of the validations fail, return false
    return results.every((result) => result === true);
  }

  async beforeCreate(req: Request, res: Response): Promise<any> {
    const plData: CdDevProjectModel = this.b.getPlData(req);
    this.b.setPlData(req, {
      key: "cdDevProjectData",
      value: JSON.stringify(plData.cdDevProjectData),
    });
    this.b.setPlData(req, { key: "cdDevProjectGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "cdDevProjectEnabled", value: true });
    return true;
  }

  async afterCreate(req: Request, res: Response) {
    const svSess = new SessionService();
    // flag invitation group as accepted
    await this.b.setAlertMessage("new cdDev-member created", svSess, true);
  }

  async createI(
    req: Request, res: Response,
    serviceInputExt: IExtServiceInput<CdDevProjectModel>,
  ): Promise<CdDevProjectModel | boolean> {
    // const svSess = new SessionService()
    // if (this.validatecreateI(req, res, serviceInputExt)) {
    //     return await this.b.createI(req, res, serviceInputExt)
    // } else {
    //     this.b.setAlertMessage(`could not join group`, svSess, false);
    // }
    return await this.b.createI(req, res, serviceInputExt);
  }

  async validateCreateI(req: Request, res: Response, serviceInputExt: IExtServiceInput<any>) {
    console.log("CdDevProjectService::validateCreateI()/01");
    const svSess = new SessionService();
    ///////////////////////////////////////////////////////////////////
    // 1. Validate against duplication
    console.log("CdDevProjectService::validateCreateI()/011");
    this.b.i.code = "CdDevProjectService::validateCreateI";
    let ret = false;
    this.validationCreateParams = {
      controllerInstance: this,
      model: CdDevProjectModel,
      data: serviceInputExt.entityData,
    };
    // const isUnique = await this.validateUniqueMultiple(req, res, this.validationCreateParams)
    // await this.b.validateUnique(req, res, this.validationCreateParams)
    if (await this.b.validateUniqueI(req, res, this.validationCreateParams)) {
      console.log("CdDevProjectService::validateCreateI()/02");
      if (await this.b.validateRequired(req, res, this.cRules)) {
        console.log("CdDevProjectService::validateCreateI()/03");
        ///////////////////////////////////////////////////////////////////
        // // 2. confirm the consumerTypeGuid referenced exists
        const pl: CdDevProjectModel = serviceInputExt.entityData;
      } else {
        console.log("CdDevProjectService::validateCreateI()/12");
        ret = false;
        this.b.setAlertMessage(
          `the required fields ${this.b.isInvalidFields.join(", ")} is missing`,
          svSess,
          true,
        );
      }
    } else {
      console.log("CdDevProjectService::validateCreateI()/13");
      ret = false;
      this.b.setAlertMessage(
        `duplicate for ${this.cRules.noDuplicate.join(", ")} is not allowed`,
        svSess,
        false,
      );
    }
    console.log("CdDevProjectService::validateCreateI()/14");
    console.log("CdDevProjectService::validateCreateI()/ret", ret);
    return ret;
  }

  async cdDevProjectExists(
    req: Request,
    res: Response,
    q: IQuery,
  ): Promise<boolean> {
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: CdDevProjectModel,
      docName: "CdDevProjectService::cdDev-memberExists",
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

  // async activateCdDev(req: Request, res: Response) {
  //     try {
  //         if (!this.validateActiveCdDev(req, res)) {
  //             const e = "could not validate the request"
  //             this.b.err.push(e.toString());
  //             const i = {
  //                 messages: this.b.err,
  //                 code: 'CdDevProjectService:activateCdDev',
  //                 app_msg: ''
  //             };
  //             await this.b.serviceErr(req, res, e, i.code)
  //             await this.b.respond(req, res)
  //         }
  //         let pl: CdDevProjectModel = this.b.getPlData(req);
  //         console.log("CdDevProjectService::activateCdDev()/pl:", pl)
  //         const cdDevId = pl.cdDevId
  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //         console.log("CdDevProjectService::activateCdDev()/sessionDataExt:", sessionDataExt)
  //         // set all cdDevs to inactive
  //         const serviceInputDeactivate = {
  //             serviceModel: CdDevProjectModel,
  //             docName: 'CdDevProjectService::activateCdDev',
  //             cmd: {
  //                 action: 'activateCdDev',
  //                 query: {
  //                     update: { cdDevActive: false },
  //                     where: { userId: sessionDataExt.currentUser.userId }
  //                 },
  //             },
  //             dSource: 1
  //         }
  //         const retDeactivate = await this.updateI(req, res, serviceInputDeactivate)
  //         console.log("CdDevProjectService::activateCdDev()/retDeactivate:", retDeactivate)
  //         // set only one cdDev to true
  //         const serviceInputActivate = {
  //             serviceModel: CdDevProjectModel,
  //             docName: 'CdDevProjectService::activateCdDev',
  //             cmd: {
  //                 action: 'activateCdDev',
  //                 query: {
  //                     update: { cdDevActive: true },
  //                     where: { userId: sessionDataExt.currentUser.userId, cdDevId: cdDevId }
  //                 },
  //             },
  //             dSource: 1
  //         }
  //         const retActivate = await this.updateI(req, res, serviceInputActivate)
  //         console.log("CdDevProjectService::activateCdDev()/retActivate:", retActivate)
  //         this.b.cdResp.data = {
  //             cdDevCdDevProjectProfile: await this.getCdDevProjectProfileI(req, res)
  //         };
  //         this.b.respond(req, res)
  //     } catch (e: any) {
  //         console.log('CdDevProjectService::activateCdDev()/e:', e)
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdDevProjectService:activateCdDev',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code)
  //         await this.b.respond(req, res)
  //     }
  // }

  async validateActiveCdDev(req: Request, res: Response) {
    return true;
  }

  async update(req: Request, res: Response): Promise<void> {
    // console.log('CdDevProjectService::update()/01');
    let q = this.b.getQuery(req);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: CdDevProjectModel,
      docName: "CdDevProjectService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    // console.log('CdDevProjectService::update()/02')
    this.b.update$(req, res, serviceInput).subscribe((ret: any) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  /**
 * curl -k -X POST -H 'Content-Type: application/json' -d '{
  "ctx": "Sys",
  "m": "CdDev",
  "c": "CdDevProject",
  "a": "UpdateCdDevProject",
  "dat": {
    "f_vals": [
      {
        "query": {
          "update": null,
          "where": {
            "userId": 1010,
            "cdDevProjectId": 2
          }
        },
        "jsonUpdate": [
          {
            "modelField": "cdDevProjectData",
            "path": [
              "cdVault",
              "[0]",
              "encryptedVaue"
            ],
            "value": "123456abcdefgABC"
          },
          {
            "modelField": "cdDevProjectData",
            "path": [
              "cdVault",
              "[0]",
              "EncryptionMeta"
            ],
            "value": {
              "iv": "1a94d8c6b7e8...sample..901f",
              "encoding": "hex",
              "algorithm": "aes-256-cbc",
              "encryptedToken": "3a94d8c6b7...e04a"
            }
          }
        ]
      }
    ],
    "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  },
  "args": {}
}' https://localhost:3001/api -v | jq '.'
  * @param req 
  * @param res 
  */
  async updateCdDevProject(req: Request, res: Response) {
    try {
      // Validate request data
      if (await this.validateUpdateProfileData(req, res)) {
        /**
         * 1. Get the requested row to update
         */
        const requestQuery: IQuery = (req as any).post.dat.f_vals[0].query;
        const jsonUpdate: JSDPInstruction[] = (req as any).post.dat.f_vals[0]
          .jsonUpdate;

        console.log(
          "CdDevProjectService::updateCdDevProject()/requestQuery:",
          requestQuery,
        );
        console.log(
          "CdDevProjectService::updateCdDevProject()/jsonUpdate:",
          jsonUpdate,
        );

        // Validate jsonUpdate format
        if (
          !jsonUpdate ||
          !Array.isArray(jsonUpdate) ||
          jsonUpdate.length === 0
        ) {
          const e = "Invalid or empty jsonUpdate provided.";
          this.b.err.push(e);
          const i = {
            messages: this.b.err,
            code: "CdDevProjectService:updateCdDevProject",
            app_msg: "",
          };
          await this.b.serviceErr(req, res, e, i.code);
          // return await this.b.respond(req, res);
        }

        /**
         * 2. Get the profile data to update
         */
        const profileData: CdDevProjectViewModel[] =
          await this.getCdDevProjectI(req, res, requestQuery);
        console.log(
          "CdDevProjectService::updateCdDevProject()/profileData:",
          profileData,
        );
        console.log(
          "CdDevProjectService::updateCdDevProject()/profileData[0].cdDevProjectData1:",
          profileData[0].cdDevProjectData,
        );

        if (!profileData) {
          const e = "No profile data found for the given query.";
          this.b.err.push(e);
          const i = {
            messages: this.b.err,
            code: "CdDevProjectService:updateCdDevProject",
            app_msg: "",
          };
          await this.b.serviceErr(req, res, e, i.code);
          // return await this.b.respond(req, res);
        }

        /**
         * 3. Use jsonUpdate derived above to update the profileData
         */
        // let updatedProfileData = profileData[0].cdDevProjectData
        let modifiedProfile;
        for (const update of jsonUpdate) {
          console.log(
            "CdDevProjectService::updateCdDevProject()/update:",
            update,
          );
          console.log(
            "CdDevProjectService::updateCdDevProject()/profileData[0].cdDevProjectData2:",
            profileData[0].cdDevProjectData,
          );

          modifiedProfile = await this.b.updateJsonData(
            update,
            profileData[0].cdDevProjectData,
          );

          console.log(
            "CdDevProjectService::updateCdDevProject()/modifiedProfile1:",
            modifiedProfile,
          );

          if (!modifiedProfile) {
            const e = `Failed to update profile data for path: ${update.path.join(
              ".",
            )}`;
            this.b.err.push(e);
            const i = {
              messages: this.b.err,
              code: "CdDevProjectService:updateCdDevProject",
              app_msg: "",
            };
            await this.b.serviceErr(req, res, e, i.code);
            return await this.b.respond(req, res);
          }
        }

        /**
         * 4. Once the profile is updated successfully, update the row with the amended profileData
         */
        requestQuery.update = {
          cdDevProjectData: JSON.stringify(modifiedProfile), // Updated profileData to be saved
        };
        let serviceInput: IServiceInput<any> = {
          serviceInstance: this,
          serviceModel: CdDevProjectModel,
          docName: "CdDevProjectService::updateCdDevProject",
          cmd: {
            query: requestQuery,
          },
        };
        console.log(
          "CdDevProjectService::updateCdDevProject()/requestQuery:",
          requestQuery,
        );

        let ret;
        if (modifiedProfile) {
          ret = await this.updateI(req, res, serviceInput);
          const finalRet = {
            updateRet: ret,
            newProfile: profileData,
          };

          // Respond with the updated profile data
          this.b.cdResp.data = finalRet;
          return await this.b.respond(req, res);
        } else {
          const e = "unexpected error ocured while updating";
          this.b.err.push(e.toString());
          const i = {
            messages: this.b.err,
            code: "CdDevProjectService:updateCdDevProject",
            app_msg: "",
          };
          await this.b.serviceErr(req, res, e, i.code);
          await this.b.respond(req, res);
        }
      } else {
        const e = "Could not validate the requested data.";
        this.b.err.push(e);
        const i = {
          messages: this.b.err,
          code: "CdDevProjectService:updateCdDevProject",
          app_msg: "",
        };
        await this.b.serviceErr(req, res, e, i.code);
        await this.b.respond(req, res);
      }
    } catch (e: any) {
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdDevProjectService:updateCdDevProject",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  async validateUpdateProfileData(
    req: Request,
    res: Response,
  ): Promise<boolean> {
    const svSess = new SessionService();
    this.b.err = []; // Initialize error storage
    let valid = true; // Assume valid unless a validation fails

    try {
      const sessionDataExt: ISessionDataExt | null = await svSess.getSessionDataExt(
        req,
        res,
        true,
      );
      
      if (!sessionDataExt) {
        const e = "Invalid session: Unable to retrieve session data.";
        this.b.err.push(e);
        return false;
      }
      
      const requestQuery: IQuery = (req as any).post.dat.f_vals[0]?.query;

      // 1. Validate the presence of `requestQuery` and `requestQuery.where`
      if (!requestQuery || !requestQuery.where) {
        const e = "Invalid request: Missing query or where clause.";
        this.b.err.push(e);
        return false;
      }

      const { userId, cdDevProjectId } = requestQuery.where;

      // 2. Validate `userId` and `cdDevProjectId`
      if (
        typeof userId !== "number" ||
        userId <= 0 ||
        typeof cdDevProjectId !== "number" ||
        cdDevProjectId <= 0
      ) {
        const e =
          "Invalid request: userId and cdDevProjectId must be positive integers.";
        this.b.err.push(e);
        valid = false;
      }

      // 3. Validate `JSDPInstruction[]` structure
      const jsonUpdates: JSDPInstruction[] =
        (req as any).post.dat.f_vals[0]?.jsonUpdate || [];
      if (!Array.isArray(jsonUpdates)) {
        const e = "Invalid request: jsonUpdate must be an array.";
        this.b.err.push(e);
        valid = false;
      } else {
        for (const update of jsonUpdates) {
          if (
            typeof update.path === "undefined" ||
            update.path === null ||
            typeof update.value === "undefined" ||
            update.value === null
          ) {
            const e =
              "Invalid request: Each jsonUpdate must contain a valid path and value.";
            this.b.err.push(e);
            valid = false;
            break;
          }
          if (update.modelField && typeof update.modelField !== "string") {
            const e =
              "Invalid request: modelField must be a string if provided.";
            this.b.err.push(e);
            valid = false;
            break;
          }
        }
      }

      // 4. Validate session user authorization
      const sessionUserId = sessionDataExt.currentUser.userId;
      if (sessionUserId !== userId) {
        const e =
          "Unauthorized: Session user does not have the right to update the specified profile.";
        this.b.err.push(e);
        valid = false;
      }
    } catch (e: any) {
      // Capture unexpected errors
      this.b.err.push(e.toString());
      return false; // Return false if an unexpected error occurs
    }

    // Return the validation status
    return valid;
  }

  async updateI(req: Request, res: Response, serviceInput: IServiceInput<any>) {
    return await this.b.update(req, res, serviceInput);
  }

  /**
   * harmonise any data that can
   * result in type error;
   * @param q
   * @returns
   */
  beforeUpdate(q: any) {
    if (q.update.cdDevProjectEnabled === "") {
      q.update.cdDevProjectEnabled = null;
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

  /**
   * $members = mCdDevProject::getCdDevProject2([$filter1, $filter2], $usersOnly)
   * @param req
   * @param res
   * @param q
   */
  async getCdDevProject(req: Request, res: Response, q?: IQuery) {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("CdDevProjectService::getCdDevProject/f:", q);
    const serviceInput = {
      serviceModel: CdDevProjectViewModel,
      docName: "CdDevProjectService::getCdDevProject$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    } as IServiceInput<CdDevProjectViewModel>;
    try {
      this.b.read$(req, res, serviceInput).subscribe((r: any) => {
        console.log("CdDevProjectService::read$()/r:", r);
        this.b.i.code = "CdDevProjectController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log("CdDevProjectService::getCdDevProject()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdDevProjectService:getCdDevProject",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  // async getCdDevProjectProfile(req: Request, res: Response) {
  //     try {

  //         if (!this.validateGetCdDevProjectProfile(req, res)) {
  //             const e = "could not validate the request"
  //             this.b.err.push(e.toString());
  //             const i = {
  //                 messages: this.b.err,
  //                 code: 'CdDevProjectService:getCdDevProjectProfile',
  //                 app_msg: ''
  //             };
  //             await this.b.serviceErr(req, res, e, i.code)
  //             await this.b.respond(req, res)
  //         }
  //         await this.setCdDevProjectProfileI(req, res)
  //         this.b.i.code = 'CdDevProjectController::getCdDevProjectProfile';
  //         const svSess = new SessionService();
  //         svSess.sessResp.cd_token = (req as any).post.dat.token;
  //         svSess.sessResp.ttl = svSess.getTtl();
  //         this.b.setAppState(true, this.b.i, svSess.sessResp);
  //         this.b.cdResp.data = this.mergedProfile;
  //         this.b.respond(req, res)
  //     } catch (e: any) {
  //         console.log('CdDevProjectService::getCdDevProjectProfile()/e:', e)
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdDevProjectService:getCdDevProjectProfile',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code)
  //         await this.b.respond(req, res)
  //     }
  // }

  async validateGetCdDevProjectProfile(req: Request, res: Response) {
    let ret = true;
    if (
      (req as any).post.a !== "GetMemberProfile" ||
      !("userId" in this.b.getPlData(req))
    ) {
      ret = false;
    }
    return ret;
  }

  async validateUpdateCdDevProjectProfile(req: Request, res: Response) {
    let ret = true;
    const plQuery = this.b.getPlQuery(req);
    if (
      (req as any).post.a !== "UpdateCdDevProjectProfile" ||
      !("userId" in plQuery.where)
    ) {
      ret = false;
    }
    return ret;
  }

  // async getCdDevProjectProfileI(req: Request, res: Response) {
  //     try {
  //         await this.setCdDevProjectProfileI(req, res)
  //         return this.mergedProfile
  //     } catch (e: any) {
  //         console.log('CdDevProjectService::getCdDevProjectProfileI()/e:', e)
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdDevmemberService:getCdDevProjectProfileI',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code)
  //         return null
  //     }
  // }

  async getCdDevProjectI(
    req: Request,
    res: Response,
    q?: IQuery,
  ): Promise<CdDevProjectViewModel[]> {
    const b = new BaseService();
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("CdDevProjectService::getCdDevProject/q:", q);
    const serviceInput = {
      serviceModel: CdDevProjectViewModel,
      docName: "CdDevProjectService::getCdDevProjectI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    } as IServiceInput<CdDevProjectViewModel>;
    try {
      return await b.read(req, res, serviceInput);
    } catch (e: any) {
      console.log("CdDevProjectService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdDevProjectService:update",
        app_msg: "",
      };
      await b.serviceErr(req, res, e, i.code);
      return [];
    }
  }

  async getI(
    req: Request,
    res: Response,
    q?: IQuery,
  ): Promise<CdDevProjectViewModel[]> {
    const b = new BaseService();
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("CdDevProjectService::getCdDevProject/q:", q);
    const serviceInput = {
      serviceModel: CdDevProjectViewModel,
      docName: "CdDevProjectService::getCdDevProjectI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    } as IServiceInput<CdDevProjectViewModel>;
    try {
      return await b.read(req, res, serviceInput);
    } catch (e: any) {
      console.log("CdDevProjectService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdDevProjectService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      return [];
    }
  }

  async getCdDevProjectCount(req: Request, res: Response) {
    const q: IQuery = this.b.getQuery(req);
    console.log("CdDevProjectService::getCdDevProjectCount/q1:", q);
    if (q.where.userId == -1) {
      const svSess = new SessionService();
      const sessionDataExt = await svSess.getSessionDataExt(
        req,
        res,
        true,
      ) as ISessionDataExt;
      q.where.userId = sessionDataExt.currentUser.userId;
    }
    console.log("CdDevProjectService::getCdDevProjectCount/q2:", q);
    const serviceInput = {
      serviceModel: CdDevProjectViewModel,
      docName: "CdDevProjectService::getCdDevProjectCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = "CdDevProjectController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  async getCdDevProjectTypeCount(req: Request, res: Response) {
    const q: IQuery = this.b.getQuery(req);
    console.log("CdDevProjectService::getCdDevProjectTypeCount/q1:", q);
    const serviceInput = {
      serviceModel: CdDevProjectTypeModel,
      docName: "CdDevProjectService::getCdDevProjectTypeCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = "CdDevProjectController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  async delete(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("CdDevProjectService::delete()/q:", q);
    const serviceInput = {
      serviceModel: CdDevProjectModel,
      docName: "CdDevProjectService::delete",
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

  // getPals(cuid) {
  //   return [{}];
  // }

  // getCdDevProjects(moduleGroupGuid) {
  //   return [{}];
  // }

  // getMembershipGroups(cuid) {
  //   return [{}];
  // }

  async isMember(req: Request, res: Response, q: IQuery): Promise<boolean> {
    console.log("starting CdDevProjectService::isMember(req, res, data)");
    const entityManager = getManager();
    const opts = q;
    const result = await entityManager.count(CdDevProjectModel, opts as FindManyOptions<CdDevProjectModel>);
    if (result > 0) {
      return true;
    } else {
      return false;
    }
  }

  // async getActionGroups(menuAction) {
  //   return [{}];
  // }

  async getUserGroups(ret: any) {
    //
  }

  /**
   * Assemble components of the profile from existing or use default to setup the first time
   * @param req
   * @param res
   */
  // async setCdDevProjectProfileI(req: Request, res: Response) {
  //     console.log("CdDevProjectService::setCdDevProjectProfileI()/01")

  //     // note that 'ignoreCache' is set to true because old data may introduce confussion
  //     const svSess = new SessionService()
  //     const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //     console.log("CdDevProjectService::setCdDevProjectProfileI()/sessionDataExt:", sessionDataExt)
  //     let uid = sessionDataExt.currentUser.userId

  //     //     - get and clone userProfile, then get cdDevProjectProfile data and append to cloned userProfile.

  //     console.log("CdDevProjectService::setCdDevProjectProfileI()/02")
  //     /**
  //      * Asses if request for self or for another user
  //      * - if request action is 'GetMemberProfile'
  //      * - and 'userId' is set
  //      */
  //     console.log("CdDevProjectService::setCdDevProjectProfileI()/(req as any).post.a", (req as any).post.a)
  //     if ((req as any).post.a === 'GetCdDevProjectProfile') {
  //         const plData = await this.b.getPlData(req)
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/plData:", plData)
  //         uid = plData.userId
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/uid0:", uid)
  //     }

  //     if ((req as any).post.a === 'UpdateCdDevProjectProfile') {
  //         const plQuery = await this.b.getPlQuery(req)
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/plQuery:", plQuery)
  //         uid = plQuery.where.userId
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/uid0:", uid)
  //     }
  //     console.log("CdDevProjectService::setCdDevProjectProfileI()/uid1:", uid)
  //     const svUser = new UserService();
  //     const existingUserProfile = await svUser.existingUserProfile(req, res, uid)
  //     console.log("CdDevProjectService::setCdDevProjectProfileI()/existingUserProfile:", existingUserProfile)
  //     let modifiedUserProfile;

  //     if (await svUser.validateProfileData(req, res, existingUserProfile)) {
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/03")
  //         // merge cdDevProjectProfile data
  //         this.mergedProfile = await this.mergeUserProfile(req, res, existingUserProfile)
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/this.mergedProfile1:", this.mergedProfile)
  //     } else {
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/04")
  //         if (this.validateGetCdDevProjectProfile(req, res)) {
  //             console.log("CdDevProjectService::setCdDevProjectProfileI()/05")
  //             console.log("CdDevProjectService::setCdDevProjectProfile()/uid:", uid)
  //             const uRet = await svUser.getUserByID(req, res, uid);
  //             console.log("CdDevProjectService::setCdDevProjectProfile()/uRet:", uRet)
  //             const { password, userProfile, ...filteredUserData } = uRet[0]
  //             console.log("CdDevProjectService::setCdDevProjectProfile()/filteredUserData:", filteredUserData)
  //             userProfileDefault.userData = filteredUserData
  //         } else {
  //             console.log("CdDevProjectService::setCdDevProjectProfileI()/06")
  //             const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //             userProfileDefault.userData = filteredUserData;
  //         }

  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/06")
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/userProfileDefault1:", userProfileDefault)
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/06-1")
  //         // use default, assign the userId
  //         profileDefaultConfig[0].value.userId = uid
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/07")
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/userProfileDefault2:", userProfileDefault)
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/profileDefaultConfig:", profileDefaultConfig)
  //         modifiedUserProfile = await svUser.modifyProfile(userProfileDefault, profileDefaultConfig)
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/08")
  //         console.log("CdDevProjectService::setCdDevProjectProfileI()/modifiedUserProfile:", modifiedUserProfile)
  //         this.mergedProfile = await this.mergeUserProfile(req, res, modifiedUserProfile)
  //         console.log("CdDevProjectService::setCdDevProjectProfile()/this.mergedProfile2:", JSON.stringify(this.mergedProfile))
  //     }
  // }

  // async resetCdDevProjectProfileI(req: Request, res: Response) {
  //     console.log("CdDevProjectService::resetCdDevProjectProfileI()/01")
  //     // note that 'ignoreCache' is set to true because old data may introduce confusion
  //     const svSess = new SessionService()
  //     const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //     console.log("CdDevProjectService::resetCdDevProjectProfileI()/sessionDataExt:", sessionDataExt)

  //     //     - get and clone userProfile, then get cdDevProjectProfile data and append to cloned userProfile.
  //     //   hint:
  //     console.log("CdDevProjectService::resetCdDevProjectProfileI()/02")
  //     const svUser = new UserService();
  //     const existingUserProfile = await svUser.existingUserProfile(req, res, sessionDataExt.currentUser.userId)
  //     console.log("CdDevProjectService::resetCdDevProjectProfileI()/existingUserProfile:", existingUserProfile)
  //     let modifiedUserProfile;

  //     if (await svUser.validateProfileData(req, res, existingUserProfile)) {
  //         console.log("CdDevProjectService::resetCdDevProjectProfileI()/03")
  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res)
  //         const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //         userProfileDefault.userData = filteredUserData;
  //         console.log("CdDevProjectService::resetCdDevProjectProfileI()/userProfileDefault:", userProfileDefault)
  //         // use default, assign the userId
  //         profileDefaultConfig[0].value.userId = sessionDataExt.currentUser.userId
  //         modifiedUserProfile = await svUser.modifyProfile(userProfileDefault, profileDefaultConfig)
  //         console.log("CdDevProjectService::resetCdDevProjectProfileI()/modifiedUserProfile:", modifiedUserProfile)
  //         this.mergedProfile = await this.mergeUserProfile(req, res, modifiedUserProfile)
  //         console.log("CdDevProjectService::resetCdDevProjectProfileI()/this.mergedProfile1:", this.mergedProfile)
  //     } else {
  //         console.log("CdDevProjectService::resetCdDevProjectProfileI()/04")
  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res)
  //         const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //         userProfileDefault.userData = filteredUserData;
  //         console.log("CdDevProjectService::resetCdDevProjectProfileI()/userProfileDefault:", userProfileDefault)
  //         // use default, assign the userId
  //         profileDefaultConfig[0].value.userId = sessionDataExt.currentUser.userId
  //         modifiedUserProfile = await svUser.modifyProfile(userProfileDefault, profileDefaultConfig)
  //         console.log("CdDevProjectService::resetCdDevProjectProfileI()/modifiedUserProfile:", modifiedUserProfile)
  //         this.mergedProfile = await this.mergeUserProfile(req, res, modifiedUserProfile)
  //         console.log("CdDevProjectService::resetCdDevProjectProfileI()/this.mergedProfile2:", this.mergedProfile)
  //     }
  // }

  // async mergeUserProfile(req, res, userProfile): Promise<ICdDevProjectProfile> {
  //     console.log("CdDevProjectService::mergeUserProfile()/01")
  //     const svSess = new SessionService()
  //     console.log("CdDevProjectService::mergeUserProfile()/02")
  //     const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res)
  //     let uid = sessionDataExt.currentUser.userId
  //     console.log("CdDevProjectService::mergeUserProfile()/03")
  //     /**
  //      * Asses if request for self or for another user
  //      * - if request action is 'GetMemberProfile'
  //      */
  //     if ((req as any).post.a === 'GetCdDevProjectProfile') {
  //         const plData = this.b.getPlData(req)
  //         uid = plData.userId
  //     }
  //     if ((req as any).post.a === 'UpdateCdDevProjectProfile') {
  //         const plQuery = this.b.getPlQuery(req)
  //         uid = plQuery.where.userId
  //     }
  //     console.log("CdDevProjectService::mergeUserProfile()/uid:", uid)
  //     const q = { where: { userId: uid } }
  //     console.log("CdDevProjectService::mergeUserProfile()/q:", q)
  //     const cdDevProjectData = await this.getCdDevProjectI(req, res, q)
  //     let aclData = await this.existingCdDevProjectProfile(req, res, uid)
  //     console.log("CdDevProjectService::mergeUserProfile()/aclData1:", aclData)
  //     if (!aclData) {
  //         aclData = cdDevProjectProfileDefault.cdDevProjectship.acl
  //     }
  //     console.log("CdDevProjectService::mergeUserProfile()/aclData2:", aclData)
  //     console.log("CdDevProjectService::mergeUserProfile()/cdDevProjectData:", cdDevProjectData)
  //     const mergedProfile: ICdDevProjectProfile = {
  //         ...userProfile,
  //         cdDevProjectship: {
  //             acl: aclData,
  //             memberData: cdDevProjectData
  //         }
  //     }
  //     console.log("CdDevProjectService::mergeUserProfile()/mergedProfile:", mergedProfile)
  //     return await mergedProfile
  // }

  // async updateCdDevProjectProfile(req: Request, res: Response): Promise<void> {
  //     try {

  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //         console.log("CdDevProjectService::updateCurrentUserProfile()/sessionDataExt:", sessionDataExt)
  //         const svUser = new UserService()
  //         const requestQuery: IQuery = (req as any).post.dat.f_vals[0].query;
  //         const jsonUpdate = (req as any).post.dat.f_vals[0].jsonUpdate;
  //         let modifiedCdDevProjectProfile: ICdDevProjectProfile;
  //         let strModifiedCdDevProjectProfile;
  //         let strUserProfile;
  //         let strCdDevProjectData;
  //         let strAcl;

  //         /**
  //          * extract from db and merge with user profile to form cdDevProjectProfile
  //          * 1. profile data from current user cdDev_member entity.
  //          * 2. membership data
  //          */
  //         await this.setCdDevProjectProfileI(req, res)

  //         if (await this.validateProfileData(req, res, this.mergedProfile)) {
  //             /*
  //             - if not null and is valid data
  //                 - use jsonUpdate to update currentUserProfile
  //                     use the method modifyUserProfile(existingData: IUserProfile, jsonUpdate): string
  //                 - use session data to modify 'userData' in the default user profile
  //                 -
  //             */
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/01")
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/jsonUpdate:", jsonUpdate)
  //             modifiedCdDevProjectProfile = await svUser.modifyProfile(this.mergedProfile, jsonUpdate)
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/strUserProfile1:", modifiedCdDevProjectProfile)

  //             // modified profile
  //             strModifiedCdDevProjectProfile = JSON.stringify(modifiedCdDevProjectProfile)
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/strModifiedCdDevProjectProfile:", strModifiedCdDevProjectProfile)
  //             // userProfile
  //             strUserProfile = JSON.stringify(await this.extractUserProfile())
  //             // acl
  //             strCdDevProjectData = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.memberData)
  //             // memberData
  //             strAcl = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.acl)

  //         } else {
  //             /*
  //             - if null or invalid,
  //                 - take the default json data defined in the UserModel,
  //                 - update userData using sessionData, then
  //                 - do update based on given jsonUpdate in the api request
  //                 - converting to string and then updating the userProfile field in the row/s defined in query.where property.
  //             */
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/021")
  //             const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //             userProfileDefault.userData = filteredUserData;
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/userProfileDefault:", userProfileDefault)
  //             modifiedCdDevProjectProfile = await svUser.modifyProfile(userProfileDefault, jsonUpdate)
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/modifiedCdDevProjectProfile2:", modifiedCdDevProjectProfile)
  //             // strCdDevProjectData = JSON.stringify(modifiedCdDevProjectProfile)
  //             // userProfile
  //             strUserProfile = JSON.stringify(await this.extractUserProfile())
  //             // acl
  //             strCdDevProjectData = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.memberData)
  //             // memberData
  //             strAcl = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.acl)
  //         }

  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/03")
  //         requestQuery.update = { cdDevProjectProfile: strAcl }
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/requestQuery:", requestQuery)
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/strUserProfile1-0:", JSON.stringify(await modifiedCdDevProjectProfile))

  //         // update cdDevProjectProfile
  //         let serviceInput: IServiceInput<any> = {
  //             serviceInstance: this,
  //             serviceModel: CdDevProjectModel,
  //             docName: 'CdDevProjectService::updateCdDevProjectProfile',
  //             cmd: {
  //                 query: requestQuery
  //             }
  //         };
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/serviceInput:", serviceInput)
  //         const updateCdDevProjectRet = await this.updateI(req, res, serviceInput)
  //         const newCdDevProjectProfile = await this.existingCdDevProjectProfile(req, res, sessionDataExt.currentUser.userId)
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/newCdDevProjectProfile:", newCdDevProjectProfile)
  //         let retCdDevProject = {
  //             updateRet: updateCdDevProjectRet,
  //             newProfile: newCdDevProjectProfile
  //         }

  //         const userUpdateQuery = {
  //             "update": { userProfile: strUserProfile },
  //             where: {
  //                 userId: sessionDataExt.currentUser.userId
  //             }
  //         }
  //         // update user
  //         const userServiceInput: IServiceInput<any> = {
  //             serviceInstance: svUser,
  //             serviceModel: UserModel,
  //             docName: 'CdDevProjectService::updateCdDevProjectProfile',
  //             cmd: {
  //                 query: userUpdateQuery
  //             }
  //         };
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/userServiceInput:", userServiceInput)
  //         const userUpdateRet = await svUser.updateI(req, res, userServiceInput)
  //         const fullProfile = await this.getI(req, res, { where: { userId: sessionDataExt.currentUser.userId } })
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/fullProfile:", JSON.stringify(await fullProfile))
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/strUserProfile1-1:", JSON.stringify(await modifiedCdDevProjectProfile))
  //         const finalRet = {
  //             updateRet: updateCdDevProjectRet,
  //             userUpdateRet: userUpdateRet,
  //             newProfile: await modifiedCdDevProjectProfile
  //         }

  //         // Respond with the retrieved profile data
  //         this.b.cdResp.data = finalRet;
  //         return await this.b.respond(req, res);
  //     } catch (e: any) {
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdDevProjectService:updateCurrentUserProfile',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code);
  //         await this.b.respond(req, res);
  //     }
  // }

  // async resetCdDevProjectProfile(req: Request, res: Response): Promise<void> {
  //     try {

  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //         console.log("CdDevProjectService::updateCurrentUserProfile()/sessionDataExt:", sessionDataExt)
  //         const svUser = new UserService()
  //         const requestQuery: IQuery = (req as any).post.dat.f_vals[0].query;
  //         const jsonUpdate = (req as any).post.dat.f_vals[0].jsonUpdate;
  //         let modifiedCdDevProjectProfile: ICdDevProjectProfile;
  //         let strUserProfile;
  //         let strCdDevProjectData;
  //         let strAcl;

  //         /**
  //          * extract from db and merge with user profile to form cdDevProjectProfile
  //          * 1. profile data from current user cdDev_member entity.
  //          * 2. membership data
  //          */
  //         await this.resetCdDevProjectProfileI(req, res)

  //         if (await this.validateProfileData(req, res, this.mergedProfile)) {
  //             /*
  //             - if not null and is valid data
  //                 - use jsonUpdate to update currentUserProfile
  //                     use the method modifyUserProfile(existingData: IUserProfile, jsonUpdate): string
  //                 - use session data to modify 'userData' in the default user profile
  //                 -
  //             */
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/01")
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/jsonUpdate:", jsonUpdate)
  //             modifiedCdDevProjectProfile = await svUser.modifyProfile(this.mergedProfile, jsonUpdate)
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/strUserProfile3:", modifiedCdDevProjectProfile)

  //             // userProfile
  //             strUserProfile = JSON.stringify(await this.extractUserProfile())
  //             // acl
  //             strCdDevProjectData = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.memberData)
  //             // memberData
  //             strAcl = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.acl)

  //         } else {
  //             /*
  //             - if null or invalid,
  //                 - take the default json data defined in the UserModel,
  //                 - update userData using sessionData, then
  //                 - do update based on given jsonUpdate in the api request
  //                 - converting to string and then updating the userProfile field in the row/s defined in query.where property.
  //             */
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/021")
  //             const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //             userProfileDefault.userData = filteredUserData;
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/userProfileDefault:", userProfileDefault)
  //             modifiedCdDevProjectProfile = await svUser.modifyProfile(userProfileDefault, jsonUpdate)
  //             console.log("CdDevProjectService::updateCdDevProjectProfile()/modifiedCdDevProjectProfile4:", modifiedCdDevProjectProfile)
  //             // strCdDevProjectData = JSON.stringify(modifiedCdDevProjectProfile)
  //             // userProfile
  //             strUserProfile = JSON.stringify(await this.extractUserProfile())
  //             // acl
  //             strCdDevProjectData = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.memberData)
  //             // memberData
  //             strAcl = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.acl)
  //         }

  //         // // userProfile
  //         // strUserProfile = JSON.stringify(modifiedCdDevProjectProfile.userProfile)
  //         // // acl
  //         // strCdDevProjectData = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.memberData)
  //         // // memberData
  //         // strAcl = JSON.stringify(modifiedCdDevProjectProfile.cdDevProjectship.acl)

  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/modifiedCdDevProjectProfile3:", modifiedCdDevProjectProfile)

  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/03")
  //         requestQuery.update = { cdDevProjectProfile: strAcl }
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/requestQuery:", requestQuery)

  //         // update cdDevProjectProfile
  //         let serviceInput: IServiceInput<any> = {
  //             serviceInstance: this,
  //             serviceModel: CdDevProjectModel,
  //             docName: 'CdDevProjectService::updateCdDevProjectProfile',
  //             cmd: {
  //                 query: requestQuery
  //             }
  //         };
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/serviceInput:", serviceInput)
  //         const updateCdDevProjectRet = await this.updateI(req, res, serviceInput)
  //         const newCdDevProjectProfile = await this.existingCdDevProjectProfile(req, res, sessionDataExt.currentUser.userId)
  //         let retCdDevProject = {
  //             updateRet: updateCdDevProjectRet,
  //             newProfile: newCdDevProjectProfile
  //         }

  //         const userUpdateQuery = {
  //             "update": { userProfile: strUserProfile },
  //             where: {
  //                 userId: sessionDataExt.currentUser.userId
  //             }
  //         }
  //         // update user
  //         const userServiceInput: IServiceInput<any> = {
  //             serviceInstance: svUser,
  //             serviceModel: UserModel,
  //             docName: 'CdDevProjectService::updateCdDevProjectProfile',
  //             cmd: {
  //                 query: userUpdateQuery
  //             }
  //         };
  //         console.log("CdDevProjectService::updateCdDevProjectProfile()/userServiceInput:", userServiceInput)
  //         const userUpdateRet = await svUser.updateI(req, res, userServiceInput)
  //         const fullProfile = await this.getI(req, res, { where: { userId: sessionDataExt.currentUser.userId } })
  //         const finalRet = {
  //             updateRet: updateCdDevProjectRet,
  //             userUpdateRet: userUpdateRet,
  //             newProfile: modifiedCdDevProjectProfile
  //         }

  //         // Respond with the retrieved profile data
  //         this.b.cdResp.data = finalRet;
  //         return await this.b.respond(req, res);
  //     } catch (e: any) {
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdDevProjectService:updateCurrentUserProfile',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code);
  //         await this.b.respond(req, res);
  //     }
  // }

  async extractUserProfile() {
    // Create a new object without 'cdDevProjectship'
    const userProfileOnly: IUserProfileOnly = { ...this.mergedProfile };

    // Remove 'cdDevProjectship' property
    delete (userProfileOnly as any).cdDevProjectship; // Temporarily type-cast to allow deletion

    // Now `userProfileOnly` is of type `IUserProfileOnly`, with `cdDevProjectship` removed.
    return userProfileOnly;
  }

  /////////////////////////////////////////////
  // NEW USER PROFILE METHODS...USING COMMON CLASS ProfileServiceHelper
  //

  async existingCdDevProjectProfile(req: Request, res: Response, cuid: string) {
    const si: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: CdDevProjectModel,
      docName: "CdDevProjectService::existingUserProfile",
      dSource: 1,
      cmd: {
        action: "find",
        query: { select: ["cdDevProjectProfile"], where: { userId: cuid } },
      },
      // mapping: { profileField: "cdDevProjectProfile" },
    };
    return this.b.read(req, res, si);
  }

  // async modifyUserProfile(existingData, profileDefaultConfig) {
  //     return ProfileServiceHelper.modifyProfile(existingData, profileDefaultConfig, {
  //         userPermissions: 'userPermissions',
  //         groupPermissions: 'groupPermissions',
  //         userId: 'userId',
  //         groupId: 'groupId'
  //     });
  // }

  // Helper method to validate profile data
  async validateProfileData(req: Request, res: Response, profileData: any): Promise<boolean> {
    console.log(
      "CdDevProjectService::validateProfileData()/profileData:",
      profileData,
    );
    // const profileData: IUserProfile = updateData.update.userProfile
    // console.log("CdDevProjectService::validateProfileData()/profileData:", profileData)
    // Check if profileData is null or undefined
    if (!profileData) {
      console.log("CdDevProjectService::validateProfileData()/01");
      return false;
    }

    // Validate that the required fields of IUserProfile exist
    if (!profileData.fieldPermissions || !profileData.userData) {
      console.log("CdDevProjectService::validateProfileData()/02");
      console.log(
        "CdDevProjectService::validateProfileData()/profileData.userData:",
        profileData.userData,
      );
      console.log(
        "CdDevProjectService::validateProfileData()/profileData.fieldPermissions:",
        profileData.fieldPermissions,
      );
      return false;
    }

    // Example validation for bio length
    if (profileData.bio && profileData.bio.length > 500) {
      console.log("CdDevProjectService::validateProfileData()/03");
      const e = "Bio data is too long";
      this.b.err.push(e);
      const i = {
        messages: this.b.err,
        code: "CdDevProjectService:validateProfileData",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      return false; // Bio is too long
    }
    return true;
  }

  // CRUD Methods for cdDevRole within cdDevProjectship
  // // Usage examples
  // const memberProfile = cdDevProjectProfileDefault;

  // // Add a new role
  // addCdDevRole(memberProfile, -1, { scope: CdDevsAclScope.COOPS_SACCO_ADMIN, geoLocationId: 101 });

  // // Get all roles for a specific cdDevProjectship by cdDevId
  // console.log(getCdDevRoles(memberProfile, -1));

  // // Update an existing role
  // const updated = updateCdDevRole(memberProfile, -1, CdDevsAclScope.COOPS_SACCO_ADMIN, { scope: CdDevsAclScope.COOPS_SACCO_ADMIN, geoLocationId: 202 });
  // console.log('Update successful:', updated);

  // // Delete a role
  // const deleted = deleteCdDevRole(memberProfile, -1, CdDevsAclScope.COOPS_GUEST);
  // console.log('Delete successful:', deleted);

  /**
   * Add a new role to cdDevRole within a specific cdDevProjectship identified by cdDevId
   * @param profile The member profile to modify
   * @param cdDevId The ID of the specific cdDevProjectship
   * @param newRole The new role to add to cdDevRole
   */
  // addCdDevRole(profile: ICdDevProjectProfile, cdDevId: number, newRole: ICdDevAcl): boolean {
  //     const memberMeta = profile.cdDevProjectship.acl?.find(m => m.cdDevId === cdDevId);
  //     if (memberMeta) {
  //         memberMeta.cdDevRole.push(newRole);
  //         return true;
  //     }
  //     return false; // Return false if cdDevProjectship with the given cdDevId was not found
  // }

  /**
   * Get all cdDev roles from a specific cdDevProjectship identified by cdDevId
   * @param profile The member profile to retrieve roles from
   * @param cdDevId The ID of the specific cdDevProjectship
   * @returns An array of ICdDevAcl representing all cdDev roles, or null if not found
   */
  // getCdDevRoles(profile: ICdDevProjectProfile, cdDevId: number): ICdDevRole | null {
  //     const memberMeta = profile.cdDevProjectship.acl?.find(m => m.cdDevId === cdDevId);
  //     return memberMeta ? memberMeta.cdDevRole : null;
  // }

  /**
   * Update an existing role in cdDevRole within a specific cdDevProjectship identified by cdDevId
   * @param profile The member profile to modify
   * @param cdDevId The ID of the specific cdDevProjectship
   * @param scope The scope of the role to update
   * @param updatedRole The updated role data
   * @returns boolean indicating success or failure
   */
  // updateCdDevRole(profile: ICdDevProjectProfile, cdDevId: number, scope: CdDevsAclScope, updatedRole: ICdDevAcl): boolean {
  //     const memberMeta = profile.cdDevProjectship.acl?.find(m => m.cdDevId === cdDevId);
  //     if (memberMeta) {
  //         const roleIndex = memberMeta.cdDevRole.findIndex(role => role.scope === scope);
  //         if (roleIndex !== -1) {
  //             memberMeta.cdDevRole[roleIndex] = updatedRole;
  //             return true;
  //         }
  //     }
  //     return false; // Return false if role with the given scope was not found in cdDevRole
  // }

  /**
   * Remove a role from cdDevRole within a specific cdDevProjectship identified by cdDevId
   * @param profile The member profile to modify
   * @param cdDevId The ID of the specific cdDevProjectship
   * @param scope The scope of the role to remove
   * @returns boolean indicating success or failure
   */
  // deleteCdDevRole(profile: ICdDevProjectProfile, cdDevId: number, scope: CdDevsAclScope): boolean {
  //     const memberMeta = profile.cdDevProjectship.acl?.find(m => m.cdDevId === cdDevId);
  //     if (memberMeta) {
  //         const roleIndex = memberMeta.cdDevRole.findIndex(role => role.scope === scope);
  //         if (roleIndex !== -1) {
  //             memberMeta.cdDevRole.splice(roleIndex, 1);
  //             return true;
  //         }
  //     }
  //     return false; // Return false if role with the given scope was not found in cdDevRole
  // }
}
