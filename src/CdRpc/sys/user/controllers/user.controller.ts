// src/CdApi/sys/user/controllers/user.controller.ts
import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { GenericController } from "../../base/generic-controller";
import CdCliVaultController from '../../cd-cli/controllers/cd-cli-vault.controller';
import { DEFAULT_ENVELOPE_LOGIN, UserModel } from "../models/user.model";
import CdLog from "../../comm/controllers/cd-logger.controller";
// import inquirer from "inquirer";
import { CdCliProfileController } from "../../cd-cli";
import { SessonController } from "./session.controller";
import config, { CONFIG_FILE_PATH, DEFAULT_SESS } from "../../../../config";
import { HttpService } from "../../base/http.service";
import { existsSync, readFileSync, writeFileSync } from "fs";

// export class UserController extends CdController {
export class UserController extends GenericController<UserModel> {
  service: UserService;

  ctlSession = new SessonController();
  ctlCdCliProfile = new CdCliProfileController();

  constructor() {
    super();
    this.service = new UserService();
  }

  //   /**
  //      * {
  //             "ctx": "Sys",
  //             "m": "User",
  //             "c": "User",
  //             "a": "Login",
  //             "dat": {
  //                 "f_vals": [
  //                     {
  //                         "data": {
  //                             "userName": "jondoo",
  //                             "password": "iiii",
  //                             "consumerGuid": "B0B3DA99-1859-A499-90F6-1E3F69575DCD"
  //                         }
  //                     }
  //                 ],
  //                 "token": ""
  //             },
  //             "args": null
  //         }
  //      * @param req
  //      * @param res
  //      */
  //   async Login(req: Request, res: Response) {
  //     this.logger.logInfo("starting Login()");
  //     try {
  //       await this.service.auth(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserService:Login");
  //     }
  //   }

  //   /**
  //      * {
  //             "ctx": "Sys",
  //             "m": "User",
  //             "c": "User",
  //             "a": "Register",
  //             "dat": {
  //                 "f_vals": [
  //                     {
  //                         "data":{
  //                             "userName": "goremo05",
  //                             "email":"goremo05@gmail.com",
  //                             "password": "yrhuiak",
  //                             "consumerGuid":"B0B3DA99-1859-A499-90F6-1E3F69575DCD" // all clients must have consumer guid which pegs them to a given company
  //                         }
  //                     }
  //                 ],
  //                 "token": ""
  //             },
  //             "args": {}
  //         }
  //      * @param req
  //      * @param res
  //      */
  //   async Register(req: Request, res: Response) {
  //     try {
  //       await this.service.create(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserService:Register");
  //     }
  //   }

  //   /**
  //      * {
  //           "ctx": "Sys",
  //           "m": "User",
  //           "c": "User",
  //           "a": "ActivateUser",
  //           "dat": {
  //               "f_vals": [
  //                   {
  //                       "query": {
  //                           "userId": 13,
  //                           "userGuid": "abdd"
  //                       }
  //                   }
  //               ],
  //               "token": "mT6blaIfqWhzNXQLG8ksVbc1VodSxRZ8lu5cMgda"
  //           },
  //           "args": null
  //       }
  //      * @param req
  //      * @param res
  //      */
  //   async ActivateUser(req: Request, res: Response) {
  //     try {
  //       await this.service.activateUser(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserService:Register");
  //     }
  //   }

  //   // {
  //   //     "ctx": "Sys",
  //   //     "m": "User",
  //   //     "c": "User",
  //   //     "a": "Get",
  //   //     "dat": {
  //   //         "f_vals": [
  //   //             {
  //   //                 "query": {
  //   //                     "where": {
  //   //                         "userGuid": "86faa6df-358b-4e32-8a66-d133921da9fe"
  //   //                     }
  //   //                 }
  //   //             }
  //   //         ],
  //   //         "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //   //     },
  //   //     "args": {}
  //   // }
  //   async Get(req: Request, res: Response) {
  //     try {
  //       await this.service.getUser(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserController:Get");
  //     }
  //   }

  //   /**
  //      *
  //      * {
  //         "ctx": "Sys",
  //         "m": "Moduleman",
  //         "c": "User",
  //         "a": "GetType",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "where": {}
  //                     }
  //                 }
  //             ],
  //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //         },
  //         "args": null
  //     }
  //     async GetType(req: Request, res: Response) {
  //         try {
  //             await this.service.getUserTypeCount(req, res);
  //         } catch (e: any) {
  //             this.b.serviceErr(req, res, e, 'UserController:Get');
  //         }
  //     }

  //     {
  //         "ctx": "Sys",
  //         "m": "User",
  //         "c": "User",
  //         "a": "GetCount",
  //         "dat": {
  //             "f_vals": [
  //                 {
  //                     "query": {
  //                         "select": [
  //                             "userName",
  //                             "userGuid"
  //                         ],
  //                         "where": {},
  //                         "take": 5,
  //                         "skip": 0
  //                     }
  //                 }
  //             ],
  //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //         },
  //         "args": null
  //     }
  //      * @param req
  //      * @param res
  //      */
  //   async GetCount(req: Request, res: Response) {
  //     try {
  //       // await this.service.getUserCount(req, res);
  //       await this.service.getUserQB(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserController:GetCount");
  //     }
  //   }

  //   async GetUserProfile(req: Request, res: Response) {
  //     try {
  //       await this.service.getUserProfile(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserController:getUserProfile");
  //     }
  //   }

  //   // /**
  //   //  * {
  //   //         "ctx": "Sys",
  //   //         "m": "Moduleman",
  //   //         "c": "User",
  //   //         "a": "Update",
  //   //         "dat": {
  //   //             "f_vals": [
  //   //                 {
  //   //                     "query": {
  //   //                         "update": {
  //   //                             "consumer-resourceName": "/corp-deskv1.2.1.2/system/modules/comm/controllers"
  //   //                         },
  //   //                         "where": {
  //   //                             "consumer-resourceId": 45762
  //   //                         }
  //   //                     }
  //   //                 }
  //   //             ],
  //   //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //   //         },
  //   //         "args": {}
  //   //     }
  //   //  * @param req
  //   //  * @param res
  //   //  */
  //   async Update(req: Request, res: Response) {
  //     console.log("UserController::Update()/01");
  //     try {
  //       console.log("UserController::Update()/02");
  //       await this.service.update(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserController:Update");
  //     }
  //   }

  //   /**
  //      * To test regiser a new user as below the followed by the update of
  //      * the password in the script that follows the one below:
  //      *
  //      * /////////////////////////////////////////////////////////////////////////////////////////
  //         // 1. create new user
  //         /////////////////////////////////////////////////////////////////////////////////////////
  //      * {
  //             "ctx": "Sys",
  //             "m": "User",
  //             "c": "User",
  //             "a": "Register",
  //             "dat": {
  //                 "f_vals": [
  //                     {
  //                         "data": {
  //                             "userName": "goremo05",
  //                             "email": "goremo05@gmail.com",
  //                             "password": "yrhuiak",
  //                             "consumerGuid": "B0B3DA99-1859-A499-90F6-1E3F69575DCD" // all clients must have consumer guid which pegs them to a given company
  //                         }
  //                     }
  //                 ],
  //                 "token": ""
  //             },
  //             "args": {}
  //         }

  //         /////////////////////////////////////////////////////////////////////////////////////////
  //         // 2. update password
  //         /////////////////////////////////////////////////////////////////////////////////////////
  //         There are circumstances that will require old password but in cases of 'forgotPassword',
  //         some token can be sent to user securely process update without use of 'oldPassword'
  //         {
  //             "ctx": "Sys",
  //             "m": "User",
  //             "c": "User",
  //             "a": "UpdatePassword",
  //             "dat": {
  //                 "f_vals": [
  //                     {
  //                         "forgotPassword":false,
  //                         "oldPassword": "yrhuiak",
  //                         "query": {
  //                             "update": {
  //                                 "password": "emj8a#jul"
  //                             },
  //                             "where": {
  //                                 "userId": 1500
  //                             }
  //                         }
  //                     }
  //                 ],
  //                 "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //             },
  //             "args": {}
  //         }

  //         // see use case for 'forgotPassword'
  //         {
  //             "ctx": "Sys",
  //             "m": "User",
  //             "c": "User",
  //             "a": "UpdatePassword",
  //             "dat": {
  //                 "f_vals": [
  //                     {
  //                         "forgotPassword": true, // optional: used securely when oldPassword is not avialble (developer option...NOT end user)
  //                         "oldPassword": null, // can be set to oldPassword text or set to null by develper to use in case of forgotPassword === true;
  //                         "query": {
  //                             "update": {
  //                                 "password": "iiii"
  //                             },
  //                             "where": {
  //                                 "userId": 1003
  //                             }
  //                         }
  //                     }
  //                 ],
  //                 "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //             },
  //             "args": {}
  //         }
  //      * @param req
  //      * @param res
  //      */
  //   async UpdatePassword(req: Request, res: Response) {
  //     console.log("UserController::UpdatePassword()/01");
  //     try {
  //       console.log("UserController::UpdatePassword()/02");
  //       await this.service.updatePassword(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserController:UpdatePassword");
  //     }
  //   }

  //   /**
  //      * {
  //             "ctx": "Sys",
  //             "m": "Moduleman",
  //             "c": "User",
  //             "a": "GetCount",
  //             "dat": {
  //                 "f_vals": [
  //                     {
  //                         "query": {
  //                             "where": {"consumer-resourceId": 45763}
  //                         }
  //                     }
  //                 ],
  //                 "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //             },
  //             "args": null
  //         }
  //      * @param req
  //      * @param res
  //      */
  //   async Delete(req: Request, res: Response) {
  //     try {
  //       await this.service.delete(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserController:Update");
  //     }
  //   }

  //   /**
  //      * {
  //             "ctx": "Sys",
  //             "m": "User",
  //             "c": "User",
  //             "a": "PugeUser",
  //             "dat": {
  //                 "f_vals": [
  //                     {
  //                         "query": {
  //                             "where": {"userGuid":"abcd"}
  //                         }
  //                     }
  //                 ],
  //                 "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //             },
  //             "args": null
  //         }
  //      * @param req
  //      * @param res
  //      */
  //   async PugeUser(req: Request, res: Response) {
  //     try {
  //       await this.service.purgeUser(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserController:Update");
  //     }
  //   }

  //   /**
  //      * {
  //             "ctx": "Sys",
  //             "m": "User",
  //             "c": "User",
  //             "a": "UpdateUserProfile",
  //             "dat": {
  //                 "f_vals": [
  //                     {
  //                         "query": {
  //                             "update": null,
  //                             "where": {
  //                                 "userId": 1010
  //                             }
  //                         },
  //                         "jsonUpdate": [
  //                             {
  //                                 "path": [
  //                                     "fieldPermissions",
  //                                     "userPermissions",
  //                                     [
  //                                         "userName"
  //                                     ]
  //                                 ],
  //                                 "value": {
  //                                     "userId": 1010,
  //                                     "field": "userName",
  //                                     "hidden": false,
  //                                     "read": true,
  //                                     "write": false,
  //                                     "execute": false
  //                                 }
  //                             },
  //                             {
  //                                 "path": [
  //                                     "fieldPermissions",
  //                                     "groupPermissions",
  //                                     [
  //                                         "userName"
  //                                     ]
  //                                 ],
  //                                 "value": {
  //                                     "groupId": 0,
  //                                     "field": "userName",
  //                                     "hidden": false,
  //                                     "read": true,
  //                                     "write": false,
  //                                     "execute": false
  //                                 }
  //                             }
  //                         ]
  //                     }
  //                 ],
  //                 "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
  //             },
  //             "args": {}
  //         }
  //      * @param req
  //      * @param res
  //      */
  //   //  * @param req
  //   //  * @param res
  //   //  */
  //   async UpdateUserProfile(req: Request, res: Response) {
  //     console.log("UserController::UpdateUserProfile()/01");
  //     try {
  //       console.log("UserController::UpdateUserProfile()/02");
  //       await this.service.updateUserProfile(req, res);
  //     } catch (e: any) {
  //       await this.b.serviceErr(req, res, e, "UserController::UpdateUserProfile");
  //     }
  //   }

  //////////////////////////////////////////////
  // New

  /**
   * Authentication Methods - Specific to User
   */
  async Login(req: Request, res: Response) {
    this.logger.logInfo("starting Login()");
    try {
      await this.service.auth(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserService:Login");
    }
  }

  async Register(req: Request, res: Response) {
    try {
      await this.service.create(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserService:Register");
    }
  }

  async ActivateUser(req: Request, res: Response) {
    try {
      await this.service.activateUser(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserService:ActivateUser");
    }
  }

  /**
   * User Profile Methods
   */
  async GetUserProfile(req: Request, res: Response) {
    try {
      await this.service.getUserProfile(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserController:GetUserProfile");
    }
  }

  async UpdateUserProfile(req: Request, res: Response) {
    console.log("UserController::UpdateUserProfile()/01");
    try {
      console.log("UserController::UpdateUserProfile()/02");
      await this.service.updateUserProfile(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserController:UpdateUserProfile");
    }
  }

  async UpdatePassword(req: Request, res: Response) {
    console.log("UserController::UpdatePassword()/01");
    try {
      console.log("UserController::UpdatePassword()/02");
      await this.service.updatePassword(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserController:UpdatePassword");
    }
  }

  /**
   * User Management Methods
   */
  async PurgeUser(req: Request, res: Response) {
    try {
      await this.service.purgeUser(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserController:PurgeUser");
    }
  }

  /**
   * Override Generic Methods with User-specific logic if needed
   */

  // Override Get to include user-specific logic
  async Get(req: Request, res: Response) {
    // try {
    //   // Add user-specific logic before getting
    //   // Example: Only allow users to get their own data unless admin
    //   const userId = (req as any).user?.id;
    //   if (userId && !(req as any).user?.isAdmin) {
    //     // Add filter for non-admin users
    //     req.query.filter = JSON.stringify({ id: userId });
    //   }

    //   // Use the generic implementation
    //   await super.Get(req, res);
    // } catch (e: any) {
    //   await this.b.serviceErr(req, res, e, "UserController:Get");
    // }
    try {
      await this.service.getUser(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserController:GetUser");
    }
  }

  // Override Update to include user-specific validation
  async Update(req: Request, res: Response) {
    // console.log("UserController::Update()/01");
    // try {
    //   console.log("UserController::Update()/02");

    //   // Add user-specific validation before update
    //   const updateData = req.body;
    //   if (updateData.email) {
    //     // Validate email format or uniqueness
    //     await this.service.validateEmail(updateData.email);
    //   }

    //   // Use the generic implementation
    //   await super.Update(req, res);
    // } catch (e: any) {
    //   await this.b.serviceErr(req, res, e, "UserController:Update");
    // }
    try {
      await this.service.update(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserController:GetUser");
    }
  }

  // Override Delete to add user-specific logic
  async Delete(req: Request, res: Response) {
    // try {
    //   // Add user-specific logic before delete
    //   // Example: Prevent deletion of admin users
    //   const userId = req.params.id;
    //   const isAdmin = await this.service.isAdminUser(userId);

    //   if (isAdmin) {
    //     throw new Error("Cannot delete admin users");
    //   }

    //   await super.Delete(req, res);
    // } catch (e: any) {
    //   await this.b.serviceErr(req, res, e, "UserController:Delete");
    // }
    try {
      await this.service.delete(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserController:GetUser");
    }
  }

  // Override GetCount to use query builder like in original
  async GetCount(req: Request, res: Response) {
    try {
      // Use the specific service method instead of generic
      await this.service.getUserQB(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserController:GetCount");
    }
  }

  // Override SoftDelete to use purgeUser for hard delete
  async SoftDelete(req: Request, res: Response) {
    try {
      // For User, soft delete might not be needed - use purge instead
      await this.service.purgeUser(req, res);
    } catch (e: any) {
      await this.b.serviceErr(req, res, e, "UserController:SoftDelete");
    }
  }

  async auth(userName: string, password: string): Promise<void> {
    try {
      const ctlCdCliProfile = new CdCliProfileController();
      // Load the configuration file
      const resultProfile = await ctlCdCliProfile.loadProfiles();
      if (!resultProfile.state || !resultProfile.data) {
        return;
      }

      const cdCliConfig = resultProfile.data;
      // Find the profile named config.cdApiLocal
      const profile = cdCliConfig.items.find(
        (item: any) => item.cdCliProfileName === config.cdApiLocal,
      );

      CdLog.debug('UserController::auth()/profile:', profile);

      if (!profile || !profile.cdCliProfileData?.details?.consumerToken) {
        throw new Error(
          `Profile config.cdApiLocal with 'consumerToken' not found in configuration.`,
        );
      }

      // Handle deferred value in consumerToken
      let consumerGuid = profile.cdCliProfileData.details.consumerToken;
      CdLog.debug('UserController::auth()/consumerGuid:', {
        ct: consumerGuid,
      });

      if (
        typeof consumerGuid === 'string' &&
        consumerGuid.startsWith('#cdVault[')
      ) {
        const vaultName = consumerGuid.match(/#cdVault\['(.+?)'\]/)?.[1];
        if (!vaultName) {
          throw new Error(
            `Invalid cdVault reference in consumerToken: ${consumerGuid}`,
          );
        }

        // Find the matching cdVault item
        const cdVaultItem = profile.cdCliProfileData.cdVault?.find(
          (vault: any) => vault.name === vaultName,
        );

        CdLog.debug('UserController::auth()/cdVaultItem:', cdVaultItem);

        if (!cdVaultItem) {
          throw new Error(`cdVault item '${vaultName}' not found.`);
        }

        // Extract value or decrypt if encrypted
        if (cdVaultItem.isEncrypted && cdVaultItem.encryptedValue) {
          consumerGuid = CdCliVaultController.getSensitiveData(cdVaultItem);
        } else {
          consumerGuid = cdVaultItem.value;
        }

        if (!consumerGuid) {
          throw new Error(
            `ConsumerToken could not be resolved for '${vaultName}'.`,
          );
        }
      }

      // Prompt for password if not provided
      if (!password) {
        const inquirer:any = await import('inquirer');
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'password',
            message: 'Please enter your password:',
            mask: '*',
          },
        ]);
        password = answers.password;
      }

      // Prepare payload using DEFAULT_ENVELOPE_LOGIN
      const payload = { ...DEFAULT_ENVELOPE_LOGIN };
      payload.dat.f_vals[0].data.userName = userName;
      payload.dat.f_vals[0].data.password = password;
      payload.dat.f_vals[0].data.consumerGuid = consumerGuid;

      CdLog.info('Authenticating...');
      CdLog.info('Payload:', payload);

      // Initialize HttpService
      const httpService = new HttpService(true); // Enable debug mode
      const baseUrl = await httpService.getCdApiUrl(config.cdApiLocal);

      if (baseUrl) {
        await httpService.init();
        const responseResult = await httpService.proc(payload);
        if (!responseResult.state || !responseResult.data) {
          return;
        }

        const response = responseResult.data;
        CdLog.info('Response:', response);

        if (response.app_state?.success) {
          if (response.app_state?.sess) {
            this.ctlSession.saveSession(
              response.app_state.sess,
              config.cdApiLocal,
            );

            const cdToken = response.app_state.sess.cd_token;
            const profileController = new CdCliProfileController();

            if (cdToken) {
              await profileController.fetchAndSaveProfiles(cdToken);
            } else {
              CdLog.error('Could not save profiles due to an invalid session.');
            }
          }
        } else {
          CdLog.error(
            'Login failed:',
            response.app_state?.info || { error: 'Unknown error' },
          );
          throw new Error(
            'Login failed. Please check your credentials and try again.',
          );
        }
      } else {
        CdLog.error('Could not get base url for HTTP connection.');
      }
    } catch (error: any) {
      CdLog.error('Error during login:', error.message);
    }
  }

  // Login wizard method with retry attempts
  async loginWithRetry() {
    const inquirer: any = await import('inquirer');
    let attempts = 0;
    while (attempts < 3) {
      try {
        attempts++;

        CdLog.info(`Attempt ${attempts} of 3: Please log in.`);

        // Prompt for username
        const usernameAnswer = await inquirer.prompt([
          {
            type: "input",
            name: "userName",
            message: "Enter your username:",
          },
        ]);

        // Call auth method from UserController to handle login
        await this.auth(usernameAnswer.userName, "");

        // Check if login was successful by verifying session
        if (await this.ctlSession.getSession(config.cdApiLocal)) {
          CdLog.success("Login successful!");
          return; // Exit login retry loop if successful
        } else {
          CdLog.error("Login failed. Please try again.");
        }
      } catch (error: any) {
        CdLog.error("Error during login attempt:", error.message);
      }

      // If the user exceeds 3 attempts, exit with an error message
      if (attempts >= 3) {
        CdLog.error("Too many failed login attempts. Exiting.");
        break;
      }
    }
  }

  /**
   * Log out by clearing the session.
   */
  logout(): void {
    try {
      if (existsSync(CONFIG_FILE_PATH)) {
        const config = JSON.parse(readFileSync(CONFIG_FILE_PATH, 'utf-8'));
        // Clear session section from config
        config.session = { ...DEFAULT_SESS }; // Set session to default

        // Write updated config to file
        writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
        CdLog.info('Logged out successfully and session cleared.');
      } else {
        CdLog.error('Config file not found.');
      }
    } catch (error) {
      CdLog.error(`Error during logout: ${(error as Error).message}`);
    }
  }

}
