

import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdController } from '../../base/cd.controller';
import { CdCliProfileService } from '../services/cd-cli-profile.service';
import { CdCliProfileModel } from "../models/cd-cli-profile.model";

// export class CdCliProfileController extends CdController {
export class CdCliProfileController extends GenericController<CdCliProfileModel> {
    b: BaseService;
    svCdCliProfile: CdCliProfileService;

    constructor() {
        super();
        this.b = new BaseService();
        this.svCdCliProfile = new CdCliProfileService();

    }

    /**
     * curl -k -X POST -H 'Content-Type: application/json' -d '{
        "ctx": "App",
        "m": "Abcds",
        "c": "AbcdRef",
        "a": "Create",
        "dat": {
            "f_vals": [
            {
                "data": {
                "abcdRefName": "DemoRef:28:11:2024:11:55",
                "abcdRefDescription": "test create"
                }
            }
            ],
            "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
        },
        "args": {}
        }' https://localhost:3001/api -v | jq '.'\
     * @param req
     * @param res
     */
    async Create(req: Request, res: Response) {
        try {
            await this.svCdCliProfile.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliProfileController:Create');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "CdCliProfile",
    //         "a": "Get",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "where": {"companyId": 45763}
    //                     }
    //                 }
    //             ],
    //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
    //         },
    //         "args": null
    //     }
    //  * @param req
    //  * @param res
    //  */
    async Get(req: Request, res: Response) {
        try {
            await this.svCdCliProfile.getCdCliProfile(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliProfileController:Get');
        }
    }


    // async GetCdCliProfileProfile(req: Request, res: Response) {
    //     try {
    //         await this.svCdCliProfile.getCdCliProfileProfile(req, res);
    //     } catch (e: any) {
    //         await this.b.serviceErr(req, res, e, 'CdCliProfileController:GetProfile');
    //     }
    // }

    /**
     * 
     * {
        "ctx": "App",
        "m": "Abcds",
        "c": "CdCliProfile",
        "a": "ActivateAbcd",
        "dat": {
            "f_vals": [
            {
                "data": {
                "abcdId": 3
                }
            }
            ],
            "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
        },
        "args": {}
        }
     * @param req 
     * 
     * @param res 
     */
    // async ActivateAbcd(req: Request, res: Response) {
    //     try {
    //         await this.svCdCliProfile.activateAbcd(req, res);
    //     } catch (e: any) {
    //         await this.b.serviceErr(req, res, e, 'CdCliProfileController:ActivateAbcd');
    //     }
    // }

    // async GetType(req: Request, res: Response) {
    //     try {
    //         await this.svCdCliProfile.getCdCliProfileTypeCount(req, res);
    //     } catch (e: any) {
    //         this.b.serviceErr(req, res, e, 'CdCliProfileController:Get');
    //     }
    // }

    /** Pageable request:
    curl -k -X POST -H 'Content-Type: application/json' -d '{
        "ctx": "App",
        "m": "Abcds",
        "c": "AbcdRef",
        "a": "GetCount",
        "dat": {
          "f_vals": [
            {
              "query": {
                "select": [
                  "abcdRefId",
                  "abcdRefName"
                ],
                "where": {}
              }
            }
          ],
          "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
        },
        "args": null
      }' https://localhost:3001/api -v | jq '.'
    //  * @param req
    //  * @param res
    //  */
    async GetCount(req: Request, res: Response) {
        try {
            await this.svCdCliProfile.getCdCliProfileCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliProfileController:GetCount');
        }
    }

    /**
     * curl -k -X POST -H 'Content-Type: application/json' -d '{
        "ctx": "Sys",
        "m": "CdCli",
        "c": "CdCliProfile",
        "a": "GetTypeCount",
        "dat": {
            "f_vals": [
            {
                "query": {"where":{}}
            }
            ],
            "token": "d33bb2d3-f4d5-42b4-8e31-44fed3e29826"
        },
        "args": null
        }' https://localhost:3001/api -v | jq '.'
     * @param req 
     * @param res 
     */
    async GetTypeCount(req: Request, res: Response) {
        try {
            await this.svCdCliProfile.getCdCliProfileTypeCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliProfileController:GetTypeCount');
        }
    }

    /**
    curl -k -X POST -H 'Content-Type: application/json' -d '{
        "ctx": "App",
        "m": "Abcds",
        "c": "AbcdRef",
        "a": "Update",
        "dat": {
          "f_vals": [
            {
              "query": {
                "update": {
                  "abcdRefDescription": "updated version"
                },
                "where": {
                  "abcdRefId": 114
                }
              }
            }
          ],
          "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
        },
        "args": null
      }' https://localhost:3001/api -v | jq '.'
    //  * @param req
    //  * @param res
    //  */
    async Update(req: Request, res: Response) {
        console.log('CdCliProfileController::Update()/01');
        try {
            console.log('CdCliProfileController::Update()/02');
            await this.svCdCliProfile.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliProfileController:Update');
        }
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
    async UpdateCdCliProfile(req: Request, res: Response) {
        console.log('CdCliProfileController::UpdateCdCliProfile()/01');
        try {
            console.log('CdCliProfileController::UpdateCdCliProfile()/02');
            await this.svCdCliProfile.updateCdCliProfile(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliProfileController:UpdateCdCliProfile');
        }
    }

    /**
    //  * curl -k -X POST -H 'Content-Type: application/json' -d '{
        "ctx": "App",
        "m": "Abcds",
        "c": "AbcdRef",
        "a": "Delete",
        "dat": {
            "f_vals": [
            {
                "query": {
                "where": {
                    "abcdRefId": 114
                }
                }
            }
            ],
            "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
        },
        "args": null
        }' https://localhost:3001/api -v | jq '.'
    //  * @param req
    //  * @param res
    //  */
    async Delete(req: Request, res: Response) {
        try {
            await this.svCdCliProfile.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdCliProfileController:Update');
        }
    }

    /**
     * {
            "ctx": "Sys",
            "m": "Abcds",
            "c": "CdCliProfile",
            "a": "UpdateCdCliProfileProfile",
            "dat": {
                "f_vals": [
                    {
                        "query": {
                            "update": null,
                            "where": {
                                "userId": 1010
                            }
                        },
                        "jsonUpdate": [
                            {
                                "path": [
                                    "fieldPermissions",
                                    "userPermissions",
                                    [
                                        "userName"
                                    ]
                                ],
                                "value": {
                                    "userId": 1010,
                                    "field": "userName",
                                    "hidden": false,
                                    "read": true,
                                    "write": false,
                                    "execute": false
                                }
                            },
                            {
                                "path": [
                                    "fieldPermissions",
                                    "groupPermissions",
                                    [
                                        "userName"
                                    ]
                                ],
                                "value": {
                                    "groupId": 0,
                                    "field": "userName",
                                    "hidden": false,
                                    "read": true,
                                    "write": false,
                                    "execute": false
                                }
                            }
                        ]
                    }
                ],
                "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
            },
            "args": {}
        }
     * @param req 
     * @param res 
     */
    //  * @param req
    //  * @param res
    //  */
    // async UpdateCdCliProfileProfile(req: Request, res: Response) {
    //     console.log('CdCliProfileController::UpdateCdCliProfileProfile()/01');
    //     try {
    //         console.log('CdCliProfileController::UpdateCdCliProfileProfile()/02');
    //         await this.svCdCliProfile.updateCdCliProfileProfile(req, res);
    //     } catch (e: any) {
    //         await this.b.serviceErr(req, res, e, 'CdCliProfileController::UpdateCdCliProfileProfile');
    //     }
    // }

}