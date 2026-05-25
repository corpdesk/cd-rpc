
import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { CdController } from '../../base/cd.controller';
import { CdDevProjectService } from '../services/cd-dev-project.service';
import { GenericController } from "../../base/generic-controller";
import { CdDevProjectModel } from "../models/cd-dev-project.model";
// import { CdCliProfileModel } from "../../cd-cli/models/cd-cli-profile.model";

// export class CdDevProjectController extends CdController {
export class CdDevProjectController extends GenericController<CdDevProjectModel> {
    service: CdDevProjectService;
    

    constructor() {
        super();
        this.b = new BaseService();
        this.service = new CdDevProjectService();

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
            await this.service.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevProjectController:Create');
        }
    }

    // /**
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "CdDevProject",
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
            await this.service.getCdDevProject(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevProjectController:Get');
        }
    }


    // async GetCdDevProjectProfile(req: Request, res: Response) {
    //     try {
    //         await this.service.getCdDevProjectProfile(req, res);
    //     } catch (e: any) {
    //         await this.b.serviceErr(req, res, e, 'CdDevProjectController:GetProfile');
    //     }
    // }

    /**
     * 
     * {
        "ctx": "App",
        "m": "Abcds",
        "c": "CdDevProject",
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
    //         await this.service.activateAbcd(req, res);
    //     } catch (e: any) {
    //         await this.b.serviceErr(req, res, e, 'CdDevProjectController:ActivateAbcd');
    //     }
    // }

    // async GetType(req: Request, res: Response) {
    //     try {
    //         await this.service.getCdDevProjectTypeCount(req, res);
    //     } catch (e: any) {
    //         this.b.serviceErr(req, res, e, 'CdDevProjectController:Get');
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
            await this.service.getCdDevProjectCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevProjectController:GetCount');
        }
    }

    /**
     * curl -k -X POST -H 'Content-Type: application/json' -d '{
        "ctx": "Sys",
        "m": "CdDev",
        "c": "CdDevProject",
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
            await this.service.getCdDevProjectTypeCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevProjectController:GetTypeCount');
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
        console.log('CdDevProjectController::Update()/01');
        try {
            console.log('CdDevProjectController::Update()/02');
            await this.service.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevProjectController:Update');
        }
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
    async UpdateCdDevProject(req: Request, res: Response) {
        console.log('CdDevProjectController::UpdateCdDevProject()/01');
        try {
            console.log('CdDevProjectController::UpdateCdDevProject()/02');
            await this.service.updateCdDevProject(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevProjectController:UpdateCdDevProject');
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
            await this.service.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'CdDevProjectController:Update');
        }
    }

    /**
     * {
            "ctx": "Sys",
            "m": "Abcds",
            "c": "CdDevProject",
            "a": "UpdateCdDevProjectProfile",
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
    // async UpdateCdDevProjectProfile(req: Request, res: Response) {
    //     console.log('CdDevProjectController::UpdateCdDevProjectProfile()/01');
    //     try {
    //         console.log('CdDevProjectController::UpdateCdDevProjectProfile()/02');
    //         await this.service.updateCdDevProjectProfile(req, res);
    //     } catch (e: any) {
    //         await this.b.serviceErr(req, res, e, 'CdDevProjectController::UpdateCdDevProjectProfile');
    //     }
    // }

}