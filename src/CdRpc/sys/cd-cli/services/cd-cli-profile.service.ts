import { Request, Response } from "express";
import { getManager } from "typeorm";
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
  CdCliProfileModel,
  ICdCliProfileProfile,
  IUserProfileOnly,
} from "../models/cd-cli-profile.model";
import { CdCliProfileViewModel } from "../models/cd-cli-profile-view.model";
import { CdCliModel } from "../models/cd-cli.model";
import { CdCliProfileTypeModel } from "../models/cd-cli-profile-type.model";
import { Logging } from "../../base/winston.log";
import { ProfileServiceHelper } from "../../utils/profile-service-helper";
import { GenericService } from "../../base/generic-service";

// export class CdCliProfileService extends CdService {
export class CdCliProfileService extends GenericService<CdCliProfileModel> {
  logger: Logging;
  b: BaseService;
  cdToken: string;
  serviceModel: CdCliProfileModel;
  srvSess: SessionService;
  validationCreateParams;
  mergedProfile: ICdCliProfileProfile;

  /*
   * create rules
   */
  cRules = {
    required: [
      "cdCliProfileName",
      "cdCliProfileData",
      "userId",
      "cdCliProfileTypeId",
    ],
    noDuplicate: ["userId", "cdCliProfileName", "cdCliProfileTypeId"],
  };

  constructor() {
    super();
    this.logger = new Logging();
    this.b = new BaseService();
    this.serviceModel = new CdCliProfileModel();
    this.srvSess = new SessionService();
  }

  ///////////////
  /**
     * {
            "ctx": "Sys",
            "m": "Moduleman",
            "c": "CdCliProfile",
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
    const fValsArray = req.body.dat.f_vals || []; // Get the f_vals array
    let results = [];

    for (let fVal of fValsArray) {
      req.body.dat.f_vals = [fVal]; // Set current fVal as a single object in the array

      if (await this.validateCreate(req, res)) {
        console.log("CdCliProfileService::create()/validation succedded");
        console.log(
          "cdCli/CdCliProfileService::create()/this.b.err1:",
          this.b.err
        );
        await this.beforeCreate(req, res);
        console.log(
          "cdCli/CdCliProfileService::create()/this.b.err2:",
          this.b.err
        );
        const serviceInput = {
          serviceModel: CdCliProfileModel,
          serviceModelInstance: this.serviceModel,
          docName: "Create cdCliProfile",
          dSource: 1,
        };
        console.log("CdCliProfileService::create()/(req as any).post:", (req as any).post);
        const respData = await this.b.create(req, res, serviceInput);
        console.log("CdCliProfileService::create()/respData:", respData);

        // Store the result for this fVal
        await results.push(respData);
        this.b.i.app_msg = "cd-cli profile created";
        await this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = results;
        await this.b.respond(req, res);
      } else {
        // If validation fails, push the error state
        console.log("CdCliProfileService::create()/validation failed");
        console.log(
          "cdCli/CdCliProfileService::create()/this.b.err3:",
          this.b.err
        );
        // await results.push({ success: false, message: `Validation failed` });
        results = [];

        // this.b.i.app_msg = "cd-cli profile creation failed";
        const i = {
          messages: this.b.err,
          code: "CdCliProfileService:create",
          app_msg: "cd-cli profile creation failed",
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
    let pl: CdCliProfileModel = this.b.getPlData(req);
    console.log("CdCliProfileService::validateCreate()/pl:", pl);

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
        field: "cdCliProfileTypeId",
        query: { cdCliProfileTypeId: pl.cdCliProfileTypeId },
        model: CdCliProfileTypeModel,
      },
    ];

    const valid = await this.validateExistence(req, res, validationParams);
    console.log(
      "CdCliProfileService::validateCreate/this.b.err1:",
      JSON.stringify(this.b.err)
    );

    if (!valid) {
      this.logger.logInfo(
        "cdCli/CdCliProfileService::validateCreate()/Reference validation failed"
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
      model: CdCliProfileModel,
    };

    if (await this.b.validateUnique(req, res, this.validationCreateParams)) {
      if (await this.b.validateRequired(req, res, this.cRules)) {
        return true;
      } else {
        this.b.setAlertMessage(
          `Missing required fields: ${this.b.isInvalidFields.join(", ")}`,
          svSess,
          true
        );

        this.logger.logInfo(
          "cdCli/CdCliProfileService::validateCreate()/Required fields validation failed"
        );
        const e = "required fields validation for fields failed!";
        this.b.err.push(e.toString());
        const i = {
          messages: this.b.err,
          code: "CdCliProfileService:validateCreate",
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
        code: "CdCliProfileService:validateCreate",
        app_msg: "",
      };
      // await this.b.serviceErr(req, res, e, i.code)
      await this.b.setAppState(false, i, svSess.sessResp);
      console.log(
        "cdCli/CdCliProfileService::validateCreate()/this.b.err1:",
        this.b.err
      );
      return false;
    }
  }

  async validateExistence(req, res, validationParams) {
    const promises = validationParams.map((param) => {
      const serviceInput = {
        serviceModel: param.model,
        docName: `CdCliProfileService::validateExistence(${param.field})`,
        cmd: {
          action: "find",
          query: { where: param.query },
        },
        dSource: 1,
      };
      console.log(
        "CdCliProfileService::validateExistence/param.model:",
        param.model
      );
      console.log(
        "CdCliProfileService::validateExistence/serviceInput:",
        JSON.stringify(serviceInput)
      );
      const b = new BaseService();
      return b.read(req, res, serviceInput).then((r: any) => {
        if (r.length > 0) {
          this.logger.logInfo(
            `cdCli/CdCliProfileService::validateExistence() - ${param.field} exists`
          );
          return true;
        } else {
          this.logger.logError(
            `cdCli/CdCliProfileService::validateExistence() - Invalid ${param.field}`
          );
          this.b.i.app_msg = `${param.field} reference is invalid`;
          this.b.err.push(this.b.i.app_msg);
          console.log(
            "CdCliProfileService::validateExistence/this.b.err1:",
            JSON.stringify(this.b.err)
          );
          return false;
        }
      });
    });

    const results = await Promise.all(promises);
    console.log("CdCliProfileService::validateExistence/results:", results);
    console.log(
      "CdCliProfileService::validateExistence/this.b.err2:",
      JSON.stringify(this.b.err)
    );
    // If any of the validations fail, return false
    return results.every((result) => result === true);
  }

  async beforeCreate(req: Request, res: Response): Promise<any> {
    const plData: CdCliProfileModel = this.b.getPlData(req);
    this.b.setPlData(req, {
      key: "cdCliProfileData",
      value: JSON.stringify(plData.cdCliProfileData),
    });
    this.b.setPlData(req, { key: "cdCliProfileGuid", value: this.b.getGuid() });
    this.b.setPlData(req, { key: "cdCliProfileEnabled", value: true });
    return true;
  }

  async afterCreate(req: Request, res: Response) {
    const svSess = new SessionService();
    // flag invitation group as accepted
    await this.b.setAlertMessage("new cdCli-member created", svSess, true);
  }

  async createI(
    req,
    res,
    serviceInputExt: IExtServiceInput
  ): Promise<CdCliProfileModel | boolean> {
    // const svSess = new SessionService()
    // if (this.validatecreateI(req, res, serviceInputExt)) {
    //     return await this.b.createI(req, res, serviceInputExt)
    // } else {
    //     this.b.setAlertMessage(`could not join group`, svSess, false);
    // }
    return await this.b.createI(req, res, serviceInputExt);
  }

  async validateCreateI(req, res, serviceInputExt: IExtServiceInput<any>) {
    console.log("CdCliProfileService::validateCreateI()/01");
    const svSess = new SessionService();
    ///////////////////////////////////////////////////////////////////
    // 1. Validate against duplication
    console.log("CdCliProfileService::validateCreateI()/011");
    this.b.i.code = "CdCliProfileService::validateCreateI";
    let ret = false;
    this.validationCreateParams = {
      controllerInstance: this,
      model: CdCliProfileModel,
      data: serviceInputExt.entityData,
    };
    // const isUnique = await this.validateUniqueMultiple(req, res, this.validationCreateParams)
    // await this.b.validateUnique(req, res, this.validationCreateParams)
    if (await this.b.validateUniqueI(req, res, this.validationCreateParams)) {
      console.log("CdCliProfileService::validateCreateI()/02");
      if (await this.b.validateRequired(req, res, this.cRules)) {
        console.log("CdCliProfileService::validateCreateI()/03");
        ///////////////////////////////////////////////////////////////////
        // // 2. confirm the consumerTypeGuid referenced exists
        const pl: CdCliProfileModel = serviceInputExt.entityData;
      } else {
        console.log("CdCliProfileService::validateCreateI()/12");
        ret = false;
        this.b.setAlertMessage(
          `the required fields ${this.b.isInvalidFields.join(", ")} is missing`,
          svSess,
          true
        );
      }
    } else {
      console.log("CdCliProfileService::validateCreateI()/13");
      ret = false;
      this.b.setAlertMessage(
        `duplicate for ${this.cRules.noDuplicate.join(", ")} is not allowed`,
        svSess,
        false
      );
    }
    console.log("CdCliProfileService::validateCreateI()/14");
    console.log("CdCliProfileService::validateCreateI()/ret", ret);
    return ret;
  }

  async cdCliProfileExists(req: Request, res: Response, q: IQuery): Promise<boolean> {
    const serviceInput: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: CdCliProfileModel,
      docName: "CdCliProfileService::cdCli-memberExists",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    return this.b.read(req, res, serviceInput);
  }

  async read(req: Request, res: Response, serviceInput: IServiceInput<any>): Promise<any> {
    //
  }

  // async activateCdCli(req: Request, res: Response) {
  //     try {
  //         if (!this.validateActiveCdCli(req, res)) {
  //             const e = "could not validate the request"
  //             this.b.err.push(e.toString());
  //             const i = {
  //                 messages: this.b.err,
  //                 code: 'CdCliProfileService:activateCdCli',
  //                 app_msg: ''
  //             };
  //             await this.b.serviceErr(req, res, e, i.code)
  //             await this.b.respond(req, res)
  //         }
  //         let pl: CdCliProfileModel = this.b.getPlData(req);
  //         console.log("CdCliProfileService::activateCdCli()/pl:", pl)
  //         const cdCliId = pl.cdCliId
  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //         console.log("CdCliProfileService::activateCdCli()/sessionDataExt:", sessionDataExt)
  //         // set all cdClis to inactive
  //         const serviceInputDeactivate = {
  //             serviceModel: CdCliProfileModel,
  //             docName: 'CdCliProfileService::activateCdCli',
  //             cmd: {
  //                 action: 'activateCdCli',
  //                 query: {
  //                     update: { cdCliActive: false },
  //                     where: { userId: sessionDataExt.currentUser.userId }
  //                 },
  //             },
  //             dSource: 1
  //         }
  //         const retDeactivate = await this.updateI(req, res, serviceInputDeactivate)
  //         console.log("CdCliProfileService::activateCdCli()/retDeactivate:", retDeactivate)
  //         // set only one cdCli to true
  //         const serviceInputActivate = {
  //             serviceModel: CdCliProfileModel,
  //             docName: 'CdCliProfileService::activateCdCli',
  //             cmd: {
  //                 action: 'activateCdCli',
  //                 query: {
  //                     update: { cdCliActive: true },
  //                     where: { userId: sessionDataExt.currentUser.userId, cdCliId: cdCliId }
  //                 },
  //             },
  //             dSource: 1
  //         }
  //         const retActivate = await this.updateI(req, res, serviceInputActivate)
  //         console.log("CdCliProfileService::activateCdCli()/retActivate:", retActivate)
  //         this.b.cdResp.data = {
  //             cdCliCdCliProfileProfile: await this.getCdCliProfileProfileI(req, res)
  //         };
  //         this.b.respond(req, res)
  //     } catch (e: any) {
  //         console.log('CdCliProfileService::activateCdCli()/e:', e)
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdCliProfileService:activateCdCli',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code)
  //         await this.b.respond(req, res)
  //     }
  // }

  async validateActiveCdCli(req: Request, res: Response) {
    return true;
  }

  update(req: Request, res: Response) {
    // console.log('CdCliProfileService::update()/01');
    let q = this.b.getQuery(req);
    q = this.beforeUpdate(q);
    const serviceInput = {
      serviceModel: CdCliProfileModel,
      docName: "CdCliProfileService::update",
      cmd: {
        action: "update",
        query: q,
      },
      dSource: 1,
    };
    // console.log('CdCliProfileService::update()/02')
    this.b.update$(req, res, serviceInput).subscribe((ret: any) => {
      this.b.cdResp.data = ret;
      this.b.respond(req, res);
    });
  }

  /**
 * curl -k -X POST -H 'Content-Type: application/json' -d '{
  "ctx": "Sys",
  "m": "CdCli",
  "c": "CdCliProfile",
  "a": "UpdateCdCliProfile",
  "dat": {
    "f_vals": [
      {
        "query": {
          "update": null,
          "where": {
            "userId": 1010,
            "cdCliProfileId": 2
          }
        },
        "jsonUpdate": [
          {
            "modelField": "cdCliProfileData",
            "path": [
              "cdVault",
              "[0]",
              "encryptedVaue"
            ],
            "value": "123456abcdefgABC"
          },
          {
            "modelField": "cdCliProfileData",
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
  async updateCdCliProfile(req: Request, res: Response) {
    try {
      // Validate request data
      if (await this.validateUpdateProfileData(req, res)) {
        /**
         * 1. Get the requested row to update
         */
        const requestQuery: IQuery = (req as any).post.dat.f_vals[0].query;
        const jsonUpdate: JSDPInstruction[] = (req as any).post.dat.f_vals[0].jsonUpdate;

        console.log(
          "CdCliProfileService::updateCdCliProfile()/requestQuery:",
          requestQuery
        );
        console.log(
          "CdCliProfileService::updateCdCliProfile()/jsonUpdate:",
          jsonUpdate
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
            code: "CdCliProfileService:updateCdCliProfile",
            app_msg: "",
          };
          await this.b.serviceErr(req, res, e, i.code);
          // return await this.b.respond(req, res);
        }

        /**
         * 2. Get the profile data to update
         */
        const profileData: CdCliProfileViewModel[] =
          await this.getCdCliProfileI(req, res, requestQuery);
        console.log(
          "CdCliProfileService::updateCdCliProfile()/profileData:",
          profileData
        );
        console.log(
          "CdCliProfileService::updateCdCliProfile()/profileData[0].cdCliProfileData1:",
          profileData[0].cdCliProfileData
        );

        if (!profileData) {
          const e = "No profile data found for the given query.";
          this.b.err.push(e);
          const i = {
            messages: this.b.err,
            code: "CdCliProfileService:updateCdCliProfile",
            app_msg: "",
          };
          await this.b.serviceErr(req, res, e, i.code);
          // return await this.b.respond(req, res);
        }

        /**
         * 3. Use jsonUpdate derived above to update the profileData
         */
        // let updatedProfileData = profileData[0].cdCliProfileData
        let modifiedProfile;
        for (const update of jsonUpdate) {
          console.log(
            "CdCliProfileService::updateCdCliProfile()/update:",
            update
          );
          console.log(
            "CdCliProfileService::updateCdCliProfile()/profileData[0].cdCliProfileData2:",
            profileData[0].cdCliProfileData
          );

          modifiedProfile = await this.b.updateJsonData(
            update,
            profileData[0].cdCliProfileData
          );

          console.log(
            "CdCliProfileService::updateCdCliProfile()/modifiedProfile1:",
            modifiedProfile
          );

          if (!modifiedProfile) {
            const e = `Failed to update profile data for path: ${update.path.join(
              "."
            )}`;
            this.b.err.push(e);
            const i = {
              messages: this.b.err,
              code: "CdCliProfileService:updateCdCliProfile",
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
          cdCliProfileData: JSON.stringify(modifiedProfile), // Updated profileData to be saved
        };
        let serviceInput: IServiceInput<any> = {
          serviceInstance: this,
          serviceModel: CdCliProfileModel,
          docName: "CdCliProfileService::updateCdCliProfile",
          cmd: {
            query: requestQuery,
          },
        };
        console.log(
          "CdCliProfileService::updateCdCliProfile()/requestQuery:",
          requestQuery
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
            code: "CdCliProfileService:updateCdCliProfile",
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
          code: "CdCliProfileService:updateCdCliProfile",
          app_msg: "",
        };
        await this.b.serviceErr(req, res, e, i.code);
        await this.b.respond(req, res);
      }
    } catch (e: any) {
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdCliProfileService:updateCdCliProfile",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  async validateUpdateProfileData(req: Request, res: Response): Promise<boolean> {
    const svSess = new SessionService();
    this.b.err = []; // Initialize error storage
    let valid = true; // Assume valid unless a validation fails

    try {
      const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(
        req,
        res,
        true
      );
      const requestQuery: IQuery = (req as any).post.dat.f_vals[0]?.query;

      // 1. Validate the presence of `requestQuery` and `requestQuery.where`
      if (!requestQuery || !requestQuery.where) {
        const e = "Invalid request: Missing query or where clause.";
        this.b.err.push(e);
        return false;
      }

      const { userId, cdCliProfileId } = requestQuery.where;

      // 2. Validate `userId` and `cdCliProfileId`
      if (
        typeof userId !== "number" ||
        userId <= 0 ||
        typeof cdCliProfileId !== "number" ||
        cdCliProfileId <= 0
      ) {
        const e =
          "Invalid request: userId and cdCliProfileId must be positive integers.";
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
    if (q.update.cdCliProfileEnabled === "") {
      q.update.cdCliProfileEnabled = null;
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
   * $members = mCdCliProfile::getCdCliProfile2([$filter1, $filter2], $usersOnly)
   * @param req
   * @param res
   * @param q
   */
  async getCdCliProfile(req: Request, res: Response, q?: IQuery) {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("CdCliProfileService::getCdCliProfile/f:", q);
    const serviceInput = {
      serviceModel: CdCliProfileViewModel,
      docName: "CdCliProfileService::getCdCliProfile$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      this.b.read$(req, res, serviceInput).subscribe((r: any) => {
        console.log("CdCliProfileService::read$()/r:", r);
        this.b.i.code = "CdCliProfileController::Get";
        const svSess = new SessionService();
        svSess.sessResp.cd_token = (req as any).post.dat.token;
        svSess.sessResp.ttl = svSess.getTtl();
        this.b.setAppState(true, this.b.i, svSess.sessResp);
        this.b.cdResp.data = r;
        this.b.respond(req, res);
      });
    } catch (e: any) {
      console.log("CdCliProfileService::getCdCliProfile()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdCliProfileService:getCdCliProfile",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      await this.b.respond(req, res);
    }
  }

  // async getCdCliProfileProfile(req: Request, res: Response) {
  //     try {

  //         if (!this.validateGetCdCliProfileProfile(req, res)) {
  //             const e = "could not validate the request"
  //             this.b.err.push(e.toString());
  //             const i = {
  //                 messages: this.b.err,
  //                 code: 'CdCliProfileService:getCdCliProfileProfile',
  //                 app_msg: ''
  //             };
  //             await this.b.serviceErr(req, res, e, i.code)
  //             await this.b.respond(req, res)
  //         }
  //         await this.setCdCliProfileProfileI(req, res)
  //         this.b.i.code = 'CdCliProfileController::getCdCliProfileProfile';
  //         const svSess = new SessionService();
  //         svSess.sessResp.cd_token = (req as any).post.dat.token;
  //         svSess.sessResp.ttl = svSess.getTtl();
  //         this.b.setAppState(true, this.b.i, svSess.sessResp);
  //         this.b.cdResp.data = this.mergedProfile;
  //         this.b.respond(req, res)
  //     } catch (e: any) {
  //         console.log('CdCliProfileService::getCdCliProfileProfile()/e:', e)
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdCliProfileService:getCdCliProfileProfile',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code)
  //         await this.b.respond(req, res)
  //     }
  // }

  async validateGetCdCliProfileProfile(req: Request, res: Response) {
    let ret = true;
    if (
      (req as any).post.a !== "GetMemberProfile" ||
      !("userId" in this.b.getPlData(req))
    ) {
      ret = false;
    }
    return ret;
  }

  async validateUpdateCdCliProfileProfile(req: Request, res: Response) {
    let ret = true;
    const plQuery = this.b.getPlQuery(req);
    if (
      (req as any).post.a !== "UpdateCdCliProfileProfile" ||
      !("userId" in plQuery.where)
    ) {
      ret = false;
    }
    return ret;
  }

  // async getCdCliProfileProfileI(req: Request, res: Response) {
  //     try {
  //         await this.setCdCliProfileProfileI(req, res)
  //         return this.mergedProfile
  //     } catch (e: any) {
  //         console.log('CdCliProfileService::getCdCliProfileProfileI()/e:', e)
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdClimemberService:getCdCliProfileProfileI',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code)
  //         return null
  //     }
  // }

  async getCdCliProfileI(
    req,
    res,
    q?: IQuery
  ): Promise<CdCliProfileViewModel[]> {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("CdCliProfileService::getCdCliProfile/q:", q);
    const serviceInput = {
      serviceModel: CdCliProfileViewModel,
      docName: "CdCliProfileService::getCdCliProfileI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      return await this.b.read(req, res, serviceInput);
    } catch (e: any) {
      console.log("CdCliProfileService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdCliProfileService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      return null;
    }
  }

  async getI(req: Request, res: Response, q?: IQuery): Promise<CdCliProfileViewModel[]> {
    if (q === null) {
      q = this.b.getQuery(req);
    }
    console.log("CdCliProfileService::getCdCliProfile/q:", q);
    const serviceInput = {
      serviceModel: CdCliProfileViewModel,
      docName: "CdCliProfileService::getCdCliProfileI",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    try {
      return await this.b.read(req, res, serviceInput);
    } catch (e: any) {
      console.log("CdCliProfileService::read$()/e:", e);
      this.b.err.push(e.toString());
      const i = {
        messages: this.b.err,
        code: "CdCliProfileService:update",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      return null;
    }
  }

  async getCdCliProfileCount(req: Request, res: Response) {
    const q: IQuery = this.b.getQuery(req);
    console.log("CdCliProfileService::getCdCliProfileCount/q1:", q);
    if (q.where.userId == -1) {
      const svSess = new SessionService();
      const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(
        req,
        res,
        true
      );
      q.where.userId = sessionDataExt.currentUser.userId;
    }
    console.log("CdCliProfileService::getCdCliProfileCount/q2:", q);
    const serviceInput = {
      serviceModel: CdCliProfileViewModel,
      docName: "CdCliProfileService::getCdCliProfileCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = "CdCliProfileController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  async getCdCliProfileTypeCount(req: Request, res: Response) {
    const q: IQuery = this.b.getQuery(req);
    console.log("CdCliProfileService::getCdCliProfileTypeCount/q1:", q);
    const serviceInput = {
      serviceModel: CdCliProfileTypeModel,
      docName: "CdCliProfileService::getCdCliProfileTypeCount$",
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };
    this.b.readCount$(req, res, serviceInput).subscribe((r: any) => {
      this.b.i.code = "CdCliProfileController::Get";
      const svSess = new SessionService();
      svSess.sessResp.cd_token = (req as any).post.dat.token;
      svSess.sessResp.ttl = svSess.getTtl();
      this.b.setAppState(true, this.b.i, svSess.sessResp);
      this.b.cdResp.data = r;
      this.b.respond(req, res);
    });
  }

  delete(req: Request, res: Response) {
    const q = this.b.getQuery(req);
    console.log("CdCliProfileService::delete()/q:", q);
    const serviceInput = {
      serviceModel: CdCliProfileModel,
      docName: "CdCliProfileService::delete",
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

  getPals(cuid) {
    return [{}];
  }

  getCdCliProfiles(moduleGroupGuid) {
    return [{}];
  }

  getMembershipGroups(cuid) {
    return [{}];
  }

  async isMember(req: Request, res: Response, q: IQuery): Promise<boolean> {
    console.log("starting CdCliProfileService::isMember(req, res, data)");
    const entityManager = getManager();
    const opts = { where: params };
    const result = await entityManager.count(CdCliProfileModel, opts);
    if (result > 0) {
      return true;
    } else {
      return false;
    }
  }

  getActionGroups(menuAction) {
    return [{}];
  }

  async getUserGroups(ret: any) {
    //
  }

  /**
   * Assemble components of the profile from existing or use default to setup the first time
   * @param req
   * @param res
   */
  // async setCdCliProfileProfileI(req: Request, res: Response) {
  //     console.log("CdCliProfileService::setCdCliProfileProfileI()/01")

  //     // note that 'ignoreCache' is set to true because old data may introduce confussion
  //     const svSess = new SessionService()
  //     const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //     console.log("CdCliProfileService::setCdCliProfileProfileI()/sessionDataExt:", sessionDataExt)
  //     let uid = sessionDataExt.currentUser.userId

  //     //     - get and clone userProfile, then get cdCliProfileProfile data and append to cloned userProfile.

  //     console.log("CdCliProfileService::setCdCliProfileProfileI()/02")
  //     /**
  //      * Asses if request for self or for another user
  //      * - if request action is 'GetMemberProfile'
  //      * - and 'userId' is set
  //      */
  //     console.log("CdCliProfileService::setCdCliProfileProfileI()/(req as any).post.a", (req as any).post.a)
  //     if ((req as any).post.a === 'GetCdCliProfileProfile') {
  //         const plData = await this.b.getPlData(req)
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/plData:", plData)
  //         uid = plData.userId
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/uid0:", uid)
  //     }

  //     if ((req as any).post.a === 'UpdateCdCliProfileProfile') {
  //         const plQuery = await this.b.getPlQuery(req)
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/plQuery:", plQuery)
  //         uid = plQuery.where.userId
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/uid0:", uid)
  //     }
  //     console.log("CdCliProfileService::setCdCliProfileProfileI()/uid1:", uid)
  //     const svUser = new UserService();
  //     const existingUserProfile = await svUser.existingUserProfile(req, res, uid)
  //     console.log("CdCliProfileService::setCdCliProfileProfileI()/existingUserProfile:", existingUserProfile)
  //     let modifiedUserProfile;

  //     if (await svUser.validateProfileData(req, res, existingUserProfile)) {
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/03")
  //         // merge cdCliProfileProfile data
  //         this.mergedProfile = await this.mergeUserProfile(req, res, existingUserProfile)
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/this.mergedProfile1:", this.mergedProfile)
  //     } else {
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/04")
  //         if (this.validateGetCdCliProfileProfile(req, res)) {
  //             console.log("CdCliProfileService::setCdCliProfileProfileI()/05")
  //             console.log("CdCliProfileService::setCdCliProfileProfile()/uid:", uid)
  //             const uRet = await svUser.getUserByID(req, res, uid);
  //             console.log("CdCliProfileService::setCdCliProfileProfile()/uRet:", uRet)
  //             const { password, userProfile, ...filteredUserData } = uRet[0]
  //             console.log("CdCliProfileService::setCdCliProfileProfile()/filteredUserData:", filteredUserData)
  //             userProfileDefault.userData = filteredUserData
  //         } else {
  //             console.log("CdCliProfileService::setCdCliProfileProfileI()/06")
  //             const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //             userProfileDefault.userData = filteredUserData;
  //         }

  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/06")
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/userProfileDefault1:", userProfileDefault)
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/06-1")
  //         // use default, assign the userId
  //         profileDefaultConfig[0].value.userId = uid
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/07")
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/userProfileDefault2:", userProfileDefault)
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/profileDefaultConfig:", profileDefaultConfig)
  //         modifiedUserProfile = await svUser.modifyProfile(userProfileDefault, profileDefaultConfig)
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/08")
  //         console.log("CdCliProfileService::setCdCliProfileProfileI()/modifiedUserProfile:", modifiedUserProfile)
  //         this.mergedProfile = await this.mergeUserProfile(req, res, modifiedUserProfile)
  //         console.log("CdCliProfileService::setCdCliProfileProfile()/this.mergedProfile2:", JSON.stringify(this.mergedProfile))
  //     }
  // }

  // async resetCdCliProfileProfileI(req: Request, res: Response) {
  //     console.log("CdCliProfileService::resetCdCliProfileProfileI()/01")
  //     // note that 'ignoreCache' is set to true because old data may introduce confusion
  //     const svSess = new SessionService()
  //     const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //     console.log("CdCliProfileService::resetCdCliProfileProfileI()/sessionDataExt:", sessionDataExt)

  //     //     - get and clone userProfile, then get cdCliProfileProfile data and append to cloned userProfile.
  //     //   hint:
  //     console.log("CdCliProfileService::resetCdCliProfileProfileI()/02")
  //     const svUser = new UserService();
  //     const existingUserProfile = await svUser.existingUserProfile(req, res, sessionDataExt.currentUser.userId)
  //     console.log("CdCliProfileService::resetCdCliProfileProfileI()/existingUserProfile:", existingUserProfile)
  //     let modifiedUserProfile;

  //     if (await svUser.validateProfileData(req, res, existingUserProfile)) {
  //         console.log("CdCliProfileService::resetCdCliProfileProfileI()/03")
  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res)
  //         const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //         userProfileDefault.userData = filteredUserData;
  //         console.log("CdCliProfileService::resetCdCliProfileProfileI()/userProfileDefault:", userProfileDefault)
  //         // use default, assign the userId
  //         profileDefaultConfig[0].value.userId = sessionDataExt.currentUser.userId
  //         modifiedUserProfile = await svUser.modifyProfile(userProfileDefault, profileDefaultConfig)
  //         console.log("CdCliProfileService::resetCdCliProfileProfileI()/modifiedUserProfile:", modifiedUserProfile)
  //         this.mergedProfile = await this.mergeUserProfile(req, res, modifiedUserProfile)
  //         console.log("CdCliProfileService::resetCdCliProfileProfileI()/this.mergedProfile1:", this.mergedProfile)
  //     } else {
  //         console.log("CdCliProfileService::resetCdCliProfileProfileI()/04")
  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res)
  //         const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //         userProfileDefault.userData = filteredUserData;
  //         console.log("CdCliProfileService::resetCdCliProfileProfileI()/userProfileDefault:", userProfileDefault)
  //         // use default, assign the userId
  //         profileDefaultConfig[0].value.userId = sessionDataExt.currentUser.userId
  //         modifiedUserProfile = await svUser.modifyProfile(userProfileDefault, profileDefaultConfig)
  //         console.log("CdCliProfileService::resetCdCliProfileProfileI()/modifiedUserProfile:", modifiedUserProfile)
  //         this.mergedProfile = await this.mergeUserProfile(req, res, modifiedUserProfile)
  //         console.log("CdCliProfileService::resetCdCliProfileProfileI()/this.mergedProfile2:", this.mergedProfile)
  //     }
  // }

  // async mergeUserProfile(req, res, userProfile): Promise<ICdCliProfileProfile> {
  //     console.log("CdCliProfileService::mergeUserProfile()/01")
  //     const svSess = new SessionService()
  //     console.log("CdCliProfileService::mergeUserProfile()/02")
  //     const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res)
  //     let uid = sessionDataExt.currentUser.userId
  //     console.log("CdCliProfileService::mergeUserProfile()/03")
  //     /**
  //      * Asses if request for self or for another user
  //      * - if request action is 'GetMemberProfile'
  //      */
  //     if ((req as any).post.a === 'GetCdCliProfileProfile') {
  //         const plData = this.b.getPlData(req)
  //         uid = plData.userId
  //     }
  //     if ((req as any).post.a === 'UpdateCdCliProfileProfile') {
  //         const plQuery = this.b.getPlQuery(req)
  //         uid = plQuery.where.userId
  //     }
  //     console.log("CdCliProfileService::mergeUserProfile()/uid:", uid)
  //     const q = { where: { userId: uid } }
  //     console.log("CdCliProfileService::mergeUserProfile()/q:", q)
  //     const cdCliProfileData = await this.getCdCliProfileI(req, res, q)
  //     let aclData = await this.existingCdCliProfileProfile(req, res, uid)
  //     console.log("CdCliProfileService::mergeUserProfile()/aclData1:", aclData)
  //     if (!aclData) {
  //         aclData = cdCliProfileProfileDefault.cdCliProfileship.acl
  //     }
  //     console.log("CdCliProfileService::mergeUserProfile()/aclData2:", aclData)
  //     console.log("CdCliProfileService::mergeUserProfile()/cdCliProfileData:", cdCliProfileData)
  //     const mergedProfile: ICdCliProfileProfile = {
  //         ...userProfile,
  //         cdCliProfileship: {
  //             acl: aclData,
  //             memberData: cdCliProfileData
  //         }
  //     }
  //     console.log("CdCliProfileService::mergeUserProfile()/mergedProfile:", mergedProfile)
  //     return await mergedProfile
  // }

  // async updateCdCliProfileProfile(req: Request, res: Response): Promise<void> {
  //     try {

  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //         console.log("CdCliProfileService::updateCurrentUserProfile()/sessionDataExt:", sessionDataExt)
  //         const svUser = new UserService()
  //         const requestQuery: IQuery = (req as any).post.dat.f_vals[0].query;
  //         const jsonUpdate = (req as any).post.dat.f_vals[0].jsonUpdate;
  //         let modifiedCdCliProfileProfile: ICdCliProfileProfile;
  //         let strModifiedCdCliProfileProfile;
  //         let strUserProfile;
  //         let strCdCliProfileData;
  //         let strAcl;

  //         /**
  //          * extract from db and merge with user profile to form cdCliProfileProfile
  //          * 1. profile data from current user cdCli_member entity.
  //          * 2. membership data
  //          */
  //         await this.setCdCliProfileProfileI(req, res)

  //         if (await this.validateProfileData(req, res, this.mergedProfile)) {
  //             /*
  //             - if not null and is valid data
  //                 - use jsonUpdate to update currentUserProfile
  //                     use the method modifyUserProfile(existingData: IUserProfile, jsonUpdate): string
  //                 - use session data to modify 'userData' in the default user profile
  //                 -
  //             */
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/01")
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/jsonUpdate:", jsonUpdate)
  //             modifiedCdCliProfileProfile = await svUser.modifyProfile(this.mergedProfile, jsonUpdate)
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/strUserProfile1:", modifiedCdCliProfileProfile)

  //             // modified profile
  //             strModifiedCdCliProfileProfile = JSON.stringify(modifiedCdCliProfileProfile)
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/strModifiedCdCliProfileProfile:", strModifiedCdCliProfileProfile)
  //             // userProfile
  //             strUserProfile = JSON.stringify(await this.extractUserProfile())
  //             // acl
  //             strCdCliProfileData = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.memberData)
  //             // memberData
  //             strAcl = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.acl)

  //         } else {
  //             /*
  //             - if null or invalid,
  //                 - take the default json data defined in the UserModel,
  //                 - update userData using sessionData, then
  //                 - do update based on given jsonUpdate in the api request
  //                 - converting to string and then updating the userProfile field in the row/s defined in query.where property.
  //             */
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/021")
  //             const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //             userProfileDefault.userData = filteredUserData;
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/userProfileDefault:", userProfileDefault)
  //             modifiedCdCliProfileProfile = await svUser.modifyProfile(userProfileDefault, jsonUpdate)
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/modifiedCdCliProfileProfile2:", modifiedCdCliProfileProfile)
  //             // strCdCliProfileData = JSON.stringify(modifiedCdCliProfileProfile)
  //             // userProfile
  //             strUserProfile = JSON.stringify(await this.extractUserProfile())
  //             // acl
  //             strCdCliProfileData = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.memberData)
  //             // memberData
  //             strAcl = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.acl)
  //         }

  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/03")
  //         requestQuery.update = { cdCliProfileProfile: strAcl }
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/requestQuery:", requestQuery)
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/strUserProfile1-0:", JSON.stringify(await modifiedCdCliProfileProfile))

  //         // update cdCliProfileProfile
  //         let serviceInput: IServiceInput<any> = {
  //             serviceInstance: this,
  //             serviceModel: CdCliProfileModel,
  //             docName: 'CdCliProfileService::updateCdCliProfileProfile',
  //             cmd: {
  //                 query: requestQuery
  //             }
  //         };
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/serviceInput:", serviceInput)
  //         const updateCdCliProfileRet = await this.updateI(req, res, serviceInput)
  //         const newCdCliProfileProfile = await this.existingCdCliProfileProfile(req, res, sessionDataExt.currentUser.userId)
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/newCdCliProfileProfile:", newCdCliProfileProfile)
  //         let retCdCliProfile = {
  //             updateRet: updateCdCliProfileRet,
  //             newProfile: newCdCliProfileProfile
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
  //             docName: 'CdCliProfileService::updateCdCliProfileProfile',
  //             cmd: {
  //                 query: userUpdateQuery
  //             }
  //         };
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/userServiceInput:", userServiceInput)
  //         const userUpdateRet = await svUser.updateI(req, res, userServiceInput)
  //         const fullProfile = await this.getI(req, res, { where: { userId: sessionDataExt.currentUser.userId } })
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/fullProfile:", JSON.stringify(await fullProfile))
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/strUserProfile1-1:", JSON.stringify(await modifiedCdCliProfileProfile))
  //         const finalRet = {
  //             updateRet: updateCdCliProfileRet,
  //             userUpdateRet: userUpdateRet,
  //             newProfile: await modifiedCdCliProfileProfile
  //         }

  //         // Respond with the retrieved profile data
  //         this.b.cdResp.data = finalRet;
  //         return await this.b.respond(req, res);
  //     } catch (e: any) {
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdCliProfileService:updateCurrentUserProfile',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code);
  //         await this.b.respond(req, res);
  //     }
  // }

  // async resetCdCliProfileProfile(req: Request, res: Response): Promise<void> {
  //     try {

  //         const svSess = new SessionService()
  //         const sessionDataExt: ISessionDataExt = await svSess.getSessionDataExt(req, res, true)
  //         console.log("CdCliProfileService::updateCurrentUserProfile()/sessionDataExt:", sessionDataExt)
  //         const svUser = new UserService()
  //         const requestQuery: IQuery = (req as any).post.dat.f_vals[0].query;
  //         const jsonUpdate = (req as any).post.dat.f_vals[0].jsonUpdate;
  //         let modifiedCdCliProfileProfile: ICdCliProfileProfile;
  //         let strUserProfile;
  //         let strCdCliProfileData;
  //         let strAcl;

  //         /**
  //          * extract from db and merge with user profile to form cdCliProfileProfile
  //          * 1. profile data from current user cdCli_member entity.
  //          * 2. membership data
  //          */
  //         await this.resetCdCliProfileProfileI(req, res)

  //         if (await this.validateProfileData(req, res, this.mergedProfile)) {
  //             /*
  //             - if not null and is valid data
  //                 - use jsonUpdate to update currentUserProfile
  //                     use the method modifyUserProfile(existingData: IUserProfile, jsonUpdate): string
  //                 - use session data to modify 'userData' in the default user profile
  //                 -
  //             */
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/01")
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/jsonUpdate:", jsonUpdate)
  //             modifiedCdCliProfileProfile = await svUser.modifyProfile(this.mergedProfile, jsonUpdate)
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/strUserProfile3:", modifiedCdCliProfileProfile)

  //             // userProfile
  //             strUserProfile = JSON.stringify(await this.extractUserProfile())
  //             // acl
  //             strCdCliProfileData = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.memberData)
  //             // memberData
  //             strAcl = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.acl)

  //         } else {
  //             /*
  //             - if null or invalid,
  //                 - take the default json data defined in the UserModel,
  //                 - update userData using sessionData, then
  //                 - do update based on given jsonUpdate in the api request
  //                 - converting to string and then updating the userProfile field in the row/s defined in query.where property.
  //             */
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/021")
  //             const { password, userProfile, ...filteredUserData } = sessionDataExt.currentUser;
  //             userProfileDefault.userData = filteredUserData;
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/userProfileDefault:", userProfileDefault)
  //             modifiedCdCliProfileProfile = await svUser.modifyProfile(userProfileDefault, jsonUpdate)
  //             console.log("CdCliProfileService::updateCdCliProfileProfile()/modifiedCdCliProfileProfile4:", modifiedCdCliProfileProfile)
  //             // strCdCliProfileData = JSON.stringify(modifiedCdCliProfileProfile)
  //             // userProfile
  //             strUserProfile = JSON.stringify(await this.extractUserProfile())
  //             // acl
  //             strCdCliProfileData = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.memberData)
  //             // memberData
  //             strAcl = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.acl)
  //         }

  //         // // userProfile
  //         // strUserProfile = JSON.stringify(modifiedCdCliProfileProfile.userProfile)
  //         // // acl
  //         // strCdCliProfileData = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.memberData)
  //         // // memberData
  //         // strAcl = JSON.stringify(modifiedCdCliProfileProfile.cdCliProfileship.acl)

  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/modifiedCdCliProfileProfile3:", modifiedCdCliProfileProfile)

  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/03")
  //         requestQuery.update = { cdCliProfileProfile: strAcl }
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/requestQuery:", requestQuery)

  //         // update cdCliProfileProfile
  //         let serviceInput: IServiceInput<any> = {
  //             serviceInstance: this,
  //             serviceModel: CdCliProfileModel,
  //             docName: 'CdCliProfileService::updateCdCliProfileProfile',
  //             cmd: {
  //                 query: requestQuery
  //             }
  //         };
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/serviceInput:", serviceInput)
  //         const updateCdCliProfileRet = await this.updateI(req, res, serviceInput)
  //         const newCdCliProfileProfile = await this.existingCdCliProfileProfile(req, res, sessionDataExt.currentUser.userId)
  //         let retCdCliProfile = {
  //             updateRet: updateCdCliProfileRet,
  //             newProfile: newCdCliProfileProfile
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
  //             docName: 'CdCliProfileService::updateCdCliProfileProfile',
  //             cmd: {
  //                 query: userUpdateQuery
  //             }
  //         };
  //         console.log("CdCliProfileService::updateCdCliProfileProfile()/userServiceInput:", userServiceInput)
  //         const userUpdateRet = await svUser.updateI(req, res, userServiceInput)
  //         const fullProfile = await this.getI(req, res, { where: { userId: sessionDataExt.currentUser.userId } })
  //         const finalRet = {
  //             updateRet: updateCdCliProfileRet,
  //             userUpdateRet: userUpdateRet,
  //             newProfile: modifiedCdCliProfileProfile
  //         }

  //         // Respond with the retrieved profile data
  //         this.b.cdResp.data = finalRet;
  //         return await this.b.respond(req, res);
  //     } catch (e: any) {
  //         this.b.err.push(e.toString());
  //         const i = {
  //             messages: this.b.err,
  //             code: 'CdCliProfileService:updateCurrentUserProfile',
  //             app_msg: ''
  //         };
  //         await this.b.serviceErr(req, res, e, i.code);
  //         await this.b.respond(req, res);
  //     }
  // }

  async extractUserProfile() {
    // Create a new object without 'cdCliProfileship'
    const userProfileOnly: IUserProfileOnly = { ...this.mergedProfile };

    // Remove 'cdCliProfileship' property
    delete (userProfileOnly as any).cdCliProfileship; // Temporarily type-cast to allow deletion

    // Now `userProfileOnly` is of type `IUserProfileOnly`, with `cdCliProfileship` removed.
    return userProfileOnly;
  }

  /////////////////////////////////////////////
  // NEW USER PROFILE METHODS...USING COMMON CLASS ProfileServiceHelper
  //

  async existingCdCliProfileProfile(req, res, cuid) {
    const si: IServiceInput<any> = {
      serviceInstance: this,
      serviceModel: CdCliProfileModel,
      docName: "CdCliProfileService::existingUserProfile",
      dSource: 1,
      cmd: {
        action: 'find',
        query: { select: ["cdCliProfileProfile"], where: { userId: cuid } },
      },
      // mapping: { profileField: "cdCliProfileProfile" },
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
  async validateProfileData(req, res, profileData: any): Promise<boolean> {
    console.log(
      "CdCliProfileService::validateProfileData()/profileData:",
      profileData
    );
    // const profileData: IUserProfile = updateData.update.userProfile
    // console.log("CdCliProfileService::validateProfileData()/profileData:", profileData)
    // Check if profileData is null or undefined
    if (!profileData) {
      console.log("CdCliProfileService::validateProfileData()/01");
      return false;
    }

    // Validate that the required fields of IUserProfile exist
    if (!profileData.fieldPermissions || !profileData.userData) {
      console.log("CdCliProfileService::validateProfileData()/02");
      console.log(
        "CdCliProfileService::validateProfileData()/profileData.userData:",
        profileData.userData
      );
      console.log(
        "CdCliProfileService::validateProfileData()/profileData.fieldPermissions:",
        profileData.fieldPermissions
      );
      return false;
    }

    // Example validation for bio length
    if (profileData.bio && profileData.bio.length > 500) {
      console.log("CdCliProfileService::validateProfileData()/03");
      const e = "Bio data is too long";
      this.b.err.push(e);
      const i = {
        messages: this.b.err,
        code: "CdCliProfileService:validateProfileData",
        app_msg: "",
      };
      await this.b.serviceErr(req, res, e, i.code);
      return false; // Bio is too long
    }
    return true;
  }

  // CRUD Methods for cdCliRole within cdCliProfileship
  // // Usage examples
  // const memberProfile = cdCliProfileProfileDefault;

  // // Add a new role
  // addCdCliRole(memberProfile, -1, { scope: CdClisAclScope.COOPS_SACCO_ADMIN, geoLocationId: 101 });

  // // Get all roles for a specific cdCliProfileship by cdCliId
  // console.log(getCdCliRoles(memberProfile, -1));

  // // Update an existing role
  // const updated = updateCdCliRole(memberProfile, -1, CdClisAclScope.COOPS_SACCO_ADMIN, { scope: CdClisAclScope.COOPS_SACCO_ADMIN, geoLocationId: 202 });
  // console.log('Update successful:', updated);

  // // Delete a role
  // const deleted = deleteCdCliRole(memberProfile, -1, CdClisAclScope.COOPS_GUEST);
  // console.log('Delete successful:', deleted);

  /**
   * Add a new role to cdCliRole within a specific cdCliProfileship identified by cdCliId
   * @param profile The member profile to modify
   * @param cdCliId The ID of the specific cdCliProfileship
   * @param newRole The new role to add to cdCliRole
   */
  // addCdCliRole(profile: ICdCliProfileProfile, cdCliId: number, newRole: ICdCliAcl): boolean {
  //     const memberMeta = profile.cdCliProfileship.acl?.find(m => m.cdCliId === cdCliId);
  //     if (memberMeta) {
  //         memberMeta.cdCliRole.push(newRole);
  //         return true;
  //     }
  //     return false; // Return false if cdCliProfileship with the given cdCliId was not found
  // }

  /**
   * Get all cdCli roles from a specific cdCliProfileship identified by cdCliId
   * @param profile The member profile to retrieve roles from
   * @param cdCliId The ID of the specific cdCliProfileship
   * @returns An array of ICdCliAcl representing all cdCli roles, or null if not found
   */
  // getCdCliRoles(profile: ICdCliProfileProfile, cdCliId: number): ICdCliRole | null {
  //     const memberMeta = profile.cdCliProfileship.acl?.find(m => m.cdCliId === cdCliId);
  //     return memberMeta ? memberMeta.cdCliRole : null;
  // }

  /**
   * Update an existing role in cdCliRole within a specific cdCliProfileship identified by cdCliId
   * @param profile The member profile to modify
   * @param cdCliId The ID of the specific cdCliProfileship
   * @param scope The scope of the role to update
   * @param updatedRole The updated role data
   * @returns boolean indicating success or failure
   */
  // updateCdCliRole(profile: ICdCliProfileProfile, cdCliId: number, scope: CdClisAclScope, updatedRole: ICdCliAcl): boolean {
  //     const memberMeta = profile.cdCliProfileship.acl?.find(m => m.cdCliId === cdCliId);
  //     if (memberMeta) {
  //         const roleIndex = memberMeta.cdCliRole.findIndex(role => role.scope === scope);
  //         if (roleIndex !== -1) {
  //             memberMeta.cdCliRole[roleIndex] = updatedRole;
  //             return true;
  //         }
  //     }
  //     return false; // Return false if role with the given scope was not found in cdCliRole
  // }

  /**
   * Remove a role from cdCliRole within a specific cdCliProfileship identified by cdCliId
   * @param profile The member profile to modify
   * @param cdCliId The ID of the specific cdCliProfileship
   * @param scope The scope of the role to remove
   * @returns boolean indicating success or failure
   */
  // deleteCdCliRole(profile: ICdCliProfileProfile, cdCliId: number, scope: CdClisAclScope): boolean {
  //     const memberMeta = profile.cdCliProfileship.acl?.find(m => m.cdCliId === cdCliId);
  //     if (memberMeta) {
  //         const roleIndex = memberMeta.cdCliRole.findIndex(role => role.scope === scope);
  //         if (roleIndex !== -1) {
  //             memberMeta.cdCliRole.splice(roleIndex, 1);
  //             return true;
  //         }
  //     }
  //     return false; // Return false if role with the given scope was not found in cdCliRole
  // }
}
