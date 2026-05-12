
import { MysqlDataSource } from "./data-source"
import { NextFunction, Request, Response } from "express"
import { IExtServiceInput, ICdRequest, ICdResponse, IControllerContext, IQuery, IRespInfo, IServiceInput, ISessResp, ObjectItem, CacheData, IQbInput } from './i-base';
// import { User } from "../entity/User"
// import { UserModel } from "../CdApi/sys/user/serviceModels/user.serviceModel"
// import { Repository } from "typeorm"

export class Base {

    // private repo = MysqlDataSource.getRepository(UserModel)
    private repo: any;

    setRepo(serviceModel){
        this.repo = MysqlDataSource.getRepository(serviceModel)
    }

    async all(request: Request, response: Response, next: NextFunction) {
        return this.repo.find()
    }

    async one(request: Request, response: Response, next: NextFunction) {
        const id = parseInt(request.params.userId)


        const user = await this.repo.findOne({
            where: { userId: id }
        })

        if (!user) {
            return "unregistered user"
        }
        return user
    }

    async save(request: Request, response: Response, serviceInput:IServiceInput, next: NextFunction) {
        const item = Object.assign(serviceInput.serviceInstance, serviceInput.data)
        return this.repo.save(item)
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        const id = parseInt(request.params.id)

        let userToRemove = await this.repo.findOneBy({ userId: id })

        if (!userToRemove) {
            return "this user not exist"
        }

        await this.repo.remove(userToRemove)

        return "user has been removed"
    }

}