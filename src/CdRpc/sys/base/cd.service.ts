import { Request, Response } from "express";
import { BaseService } from "./base.service";
import {
  IExtServiceInput,
  ICdResponse,
  IModelRules,
  IRespInfo,
  IServiceInput,
  IUser,
} from "./i-base";
import { ObjectLiteral } from "typeorm/common/ObjectLiteral";

export abstract class CdService<T extends ObjectLiteral> {
  abstract b: BaseService<T>; // instance of BaseService
  abstract cdToken: string;
  // These properties should be defined in the specific service
  abstract serviceModel: any;
  abstract docName: string;
//   user: IUser;
  cRules: any;
  uRules: any;
  dRules: any;

  public abstract create(req: Request, res: Response, extCdObj?: any): Promise<any>;
  // public abstract beforeCreate(req: Request, res: Response):Promise<any>;
  public abstract read(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<any>,
  ): Promise<any>;
  public abstract update(req: Request, res: Response): Promise<any>;
  public abstract delete(req: Request, res: Response): Promise<any>;

  // internal create interface
  public abstract createI(req: Request, res: Response, serviceInputExt: IExtServiceInput<any>): Promise<any>;

  /**
   * methods for transaction rollback
   */
  protected rbCreate(): number {
    return 1;
  }

  protected rbUpdate(): number {
    return 1;
  }

  protected rbDelete(): number {
    return 1;
  }
}
