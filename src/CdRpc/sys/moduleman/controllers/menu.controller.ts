import { Request, Response } from "express";
import { BaseService } from '../../base/base.service';
import { MenuService } from '../services/menu.service';
import { MenuModel } from "../models/menu.model";
import { GenericController } from "../../base/generic-controller";

export class MenuController extends GenericController<MenuModel> {

    b: BaseService<MenuModel>;
    service: MenuService;

    constructor() {
        super();
        this.b = new BaseService();
        this.service = new MenuService();
    }

    async Create(req: Request, res: Response) {
        try {
            await this.service.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Create');
        }
    }

    async menuCollection(req: Request, res: Response) {
        try {
            // await this.service.testMenu(req, res, userMenuData$);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'RxTestController:menuCollection');
        }
    }

    async Get(req: Request, res: Response) {
        try {
            await this.service.getMenu(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    // /** Pageable request:
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Module",
    //         "a": "GetCount",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "select":["moduleId","moduleGuid"],
    //                         "where": {},
    //                         "take": 5,
    //                         "skip": 1
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
    async GetCount(req: Request, res: Response) {
        console.log('starting GetCounter()')
        try {
            console.log('MenuController::GetCount()/reached 1')
            // await this.service.getMenuCount(req, res); // has a bug at typeorm when 'OR' is used
            await this.service.getMenuQB(req, res); // substitute for above
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    // GetQB
    async GetQB(req: Request, res: Response) {
        console.log('starting GetCounter()')
        try {
            console.log('MenuController::GetCount()/reached 1')
            await this.service.getMenuQB(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'ModuleController:Get');
        }
    }

    // /**
    //  *
    //  * {
    //         "ctx": "Sys",
    //         "m": "Moduleman",
    //         "c": "Menu",
    //         "a": "Update",
    //         "dat": {
    //             "f_vals": [
    //                 {
    //                     "query": {
    //                         "update": {
    //                             "menuName": "TesterMenu"
    //                         },
    //                         "where": {"menuId":93}
    //                     }
    //                 }
    //             ],
    //             "token": "08f45393-c10e-4edd-af2c-bae1746247a1"
    //         },
    //         "args": {}
    //     }
    //  * @param req
    //  * @param res
    //  */
    async Update(req: Request, res: Response) {
        try {
            await this.service.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'MenuController:Update');
        }
    }

    async Delete(req: Request, res: Response) {
        try {
            await this.service.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, 'MenuController:Update');
        }
    }

}