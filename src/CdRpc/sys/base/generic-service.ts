import { EntityTarget, ObjectLiteral, UpdateResult } from "typeorm";
import { Request, Response } from "express";
import { BaseService } from "./base.service";
import config from "../../../config";
import {
  CD_FX_FAIL,
  CdFxReturn,
  IExtServiceInput,
  ICdResponse,
  IQuery,
  IServiceInput,
} from "./i-base";
import { Logging } from "./winston.log";
import { UserModel } from "../user/models/user.model";
import { CdService } from "./cd.service";

export abstract class GenericService<
  T extends ObjectLiteral,
> extends CdService<T> {
  // These properties should be defined in the specific service
  abstract serviceModel: new () => T;
  abstract docName: string;
  b: BaseService<T>;
  logger: Logging;
  protected defaultDs = config.ds.sqlite;

  constructor(private model: new () => T) {
    super();
    this.b = new BaseService<T>();
    this.logger = new Logging();
  }

  /**
   * The Template Method for Create
   */
  async create(req: Request, res: Response, extCdObj?: any): Promise<void> {
    try {
      // 1. Validation Hook
      const isValid = await this.validateCreate(req, res);
      if (!isValid) {
        return await this.handleError(req, res, "validateCreate");
      }

      // 2. Before Create Hook (Mutations, GUIDs, Hashing)
      await this.beforeCreate(req, res);

      // 3. Prepare Service Input
      const serviceInput: IServiceInput<T> = {
        serviceInstance: this,
        serviceModel: this.serviceModel,
        docName: this.docName,
        dSource: 1,
        data: this.b.getPlData(req as any), // Assuming plData is populated
      };

      // 4. Execution via BaseService
      const result: T = await this.b.create(req, res, serviceInput);

      // 5. After Create Hook (Notifications, Side Effects)
      await this.afterCreate(req, res, result);

      // 6. Final Response
      this.b.cdResp.data = result;
      this.b.cdResp.app_state.success = true;
      await this.b.respond(req, res);
    } catch (e: any) {
      await this.handleError(req, res, `${this.docName}:create`, e);
    }
  }

  /**
   * Default Hooks - Overridden by specific services as needed
   */
  async validateCreate(req: Request, res: Response): Promise<boolean> {
    return true;
  }

  async beforeCreate(req: Request, res: Response): Promise<any> {
    return;
  }

  async afterCreate(req: Request, res: Response, data: T): Promise<any> {
    return data;
  }

  /**
   * Centralized Error Handler for the lifecycle
   */
  async handleError(
    req: Request,
    res: Response,
    code: string,
    err?: any,
  ): Promise<void> {
    const i = {
      messages: this.b.err,
      code: code,
      app_msg: err ? err.toString() : "",
    };
    await this.b.setAppState(false, i, null);
    await this.b.respond(req, res);
  }

  async createI(
    req: Request,
    res: Response,
    serviceInputExt: IExtServiceInput<T>,
  ): Promise<T | boolean> {
    return await this.b.createI(req, res, serviceInputExt);
  }

  async read(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<T>,
  ): Promise<void> {
    // const serviceInput = {
    //   serviceModel: this.model,
    //   docName: `Read ${this.model.name}`,
    //   cmd: { action: 'find', query: q },
    //   dSource: this.defaultDs,
    // };

    const result = await this.b.read(req as any, req as any, serviceInput);

    // return "state" in result ? result : CD_FX_FAIL;
  }

  async update(
    req: Request,
    res: Response,
    // serviceInput?: any,
  ): Promise<void> {
    // const serviceInput = {
    //   serviceModel: this.model,
    //   docName: `Update ${this.model.name}`,
    //   cmd: { action: 'update', query: q },
    //   dSource: this.defaultDs,
    // };
    // const result = await this.b.update(req, res, serviceInput);
    // return "state" in result ? result : CD_FX_FAIL;
  }


  async updateI(
    req: Request,
    res: Response,
    serviceInput: IServiceInput<T>,
  ): Promise<any> {
    return this.b.updateI(req, res, serviceInput);
  }

  async beforeUpdate(q: any){
    return q;
  }

  async delete(
    req: Request,
    res: Response,
    // serviceInput: IServiceInput<T>,
  ): Promise<void> {
    // const serviceInput = {
    //   serviceModel: this.model,
    //   docName: `Delete ${this.model.name}`,
    //   cmd: { action: 'delete', query: q },
    //   dSource: this.defaultDs,
    // };
    // const result = await this.b.delete(req, res, serviceInput);
    // return "state" in result ? result : CD_FX_FAIL;
  }

  async getCount(req: Request, res: Response): Promise<void> {
    // Default implementation
    // const serviceInput = {
    //   serviceModel: this.serviceModel,
    //   docName: `${this.docName}:getCount`,
    //   cmd: { action: "count" },
    //   dSource: this.defaultDs,
    // };
    const q = this.b.getQuery(req);
    const serviceInput = {
      serviceModel: this.serviceModel,
      docName: `${this.docName}:getCount`,
      cmd: {
        action: "find",
        query: q,
      },
      dSource: 1,
    };

    await this.b.read(req, res, serviceInput);
  }

  async getById(req: Request, res: Response): Promise<void> {
    // Default implementation
    const id = req.params.id;
    const serviceInput = {
      serviceModel: this.serviceModel,
      docName: `${this.docName}:getById`,
      cmd: { action: "findOne", query: { where: { id } } },
      dSource: this.defaultDs,
    };
    await this.b.read(req, res, serviceInput);
  }

  async bulkCreate(req: Request, res: Response): Promise<void> {
    // Default implementation
    const items = req.body;
    const serviceInput = {
      serviceModel: this.serviceModel,
      docName: `${this.docName}:bulkCreate`,
      data: items,
      dSource: this.defaultDs,
    };
    await this.b.create(req, res, serviceInput);
  }

  async bulkUpdate(req: Request, res: Response): Promise<void> {
    // Default implementation
    const updates = req.body;
    const serviceInput = {
      serviceModel: this.serviceModel,
      docName: `${this.docName}:bulkUpdate`,
      cmd: { action: "update", query: updates },
      dSource: this.defaultDs,
    };
    await this.b.update(req, res, serviceInput);
  }

  async softDelete(req: Request, res: Response): Promise<void> {
    // Default implementation - assumes a 'deletedAt' field
    const id = req.params.id;
    const serviceInput = {
      serviceModel: this.serviceModel,
      docName: `${this.docName}:softDelete`,
      cmd: {
        action: "update",
        query: {
          where: { id },
          update: { deletedAt: new Date() },
        },
      },
      dSource: this.defaultDs,
    };
    await this.b.update(req, res, serviceInput);
  }

  async restore(req: Request, res: Response): Promise<void> {
    // Default implementation
    const id = req.params.id;
    const serviceInput = {
      serviceModel: this.serviceModel,
      docName: `${this.docName}:restore`,
      cmd: {
        action: "update",
        query: {
          where: { id },
          update: { deletedAt: null },
        },
      },
      dSource: this.defaultDs,
    };
    await this.b.update(req, res, serviceInput);
  }

  async search(req: Request, res: Response): Promise<void> {
    // Default implementation - override for specific search logic
    const searchParams = req.query;
    const serviceInput = {
      serviceModel: this.serviceModel,
      docName: `${this.docName}:search`,
      cmd: { action: "find", query: { where: searchParams } },
      dSource: this.defaultDs,
    };
    await this.b.read(req, res, serviceInput);
  }

  async getPaginated(req: Request, res: Response): Promise<void> {
    const q = this.b.getQuery(req);
    const page = parseInt(q.page as string) || 1;
    const limit = parseInt(q.limit as string) || 10;
    const skip = (page - 1) * limit;

    const serviceInput = {
      serviceModel: this.serviceModel,
      docName: `${this.docName}:getPaginated`,
      cmd: {
        action: "findAndCount",
        query: {
          skip,
          take: limit,
        } as IQuery,
      },
      dSource: this.defaultDs,
    };
    await this.b.read(req, res, serviceInput);
  }
}
