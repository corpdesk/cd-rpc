// src/CdApi/sys/base/generic-controller.ts
import { Request, Response } from "express";
import { BaseService } from './base.service';
import { CdController } from './cd.controller';
import { Logging } from './winston.log';
import { GenericService } from './generic-service';
import { ObjectLiteral } from "typeorm";

export abstract class GenericController<T extends ObjectLiteral> extends CdController {
    logger: Logging;
    b: BaseService<T>;
    abstract service: GenericService<T>;

    constructor() {
        super();
        this.b = new BaseService<T>();
        this.logger = new Logging();
    }

    /**
     * Generic Create method
     */
    async Create(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::Create()`);
        try {
            await this.service.create(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:Create`);
        }
    }

    /**
     * Generic Read/Get method
     */
    async Get(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::Get()`);
        try {
            await this.service.read(req, res, {} as any);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:Get`);
        }
    }

    /**
     * Generic GetCount method
     */
    async GetCount(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::GetCount()`);
        try {
            // You can override this in specific controllers to use different methods
            await this.service.getCount(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:GetCount`);
        }
    }

    /**
     * Generic Update method
     */
    async Update(req: Request, res: Response): Promise<void> {
        console.log(`${this.constructor.name}::Update()/01`);
        try {
            console.log(`${this.constructor.name}::Update()/02`);
            await this.service.update(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:Update`);
        }
    }

    /**
     * Generic Delete method
     */
    async Delete(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::Delete()`);
        try {
            await this.service.delete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:Delete`);
        }
    }

    /**
     * Generic method to get by ID
     */
    async GetById(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::GetById()`);
        try {
            await this.service.getById(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:GetById`);
        }
    }

    /**
     * Generic method for bulk operations
     */
    async BulkCreate(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::BulkCreate()`);
        try {
            await this.service.bulkCreate(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:BulkCreate`);
        }
    }

    /**
     * Generic method for bulk update
     */
    async BulkUpdate(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::BulkUpdate()`);
        try {
            await this.service.bulkUpdate(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:BulkUpdate`);
        }
    }

    /**
     * Generic soft delete method
     */
    async SoftDelete(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::SoftDelete()`);
        try {
            await this.service.softDelete(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:SoftDelete`);
        }
    }

    /**
     * Generic restore method for soft deleted records
     */
    async Restore(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::Restore()`);
        try {
            await this.service.restore(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:Restore`);
        }
    }

    /**
     * Generic method for searching
     */
    async Search(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::Search()`);
        try {
            await this.service.search(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:Search`);
        }
    }

    /**
     * Generic method for pagination
     */
    async GetPaginated(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Starting ${this.constructor.name}::GetPaginated()`);
        try {
            await this.service.getPaginated(req, res);
        } catch (e: any) {
            await this.b.serviceErr(req, res, e, `${this.constructor.name}:GetPaginated`);
        }
    }
}