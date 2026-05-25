// src/CdApi/sys/base/cd.controller.ts
import { Request, Response } from "express";
import { BaseService } from './base.service';
import { Logging } from './winston.log';

export abstract class CdController {
    protected b: BaseService<any>;
    protected logger: Logging;

    constructor() {
        this.b = new BaseService();
        this.logger = new Logging();
    }

    /**
     * Base error handler for controller methods
     */
    protected async handleError(
        req: Request, 
        res: Response, 
        error: any, 
        methodName: string
    ): Promise<void> {
        await this.b.serviceErr(req, res, error, `${this.constructor.name}:${methodName}`);
    }

    /**
     * Base success response handler
     */
    protected async sendSuccess(
        req: Request,
        res: Response,
        data?: any,
        message?: string
    ): Promise<void> {
        this.b.cdResp.data = data || null;
        this.b.cdResp.app_state.success = true;
        if (message) {
            this.b.cdResp.app_state.info = {
                code: "SUCCESS",
                app_msg: message,
                messages:[]
            };
        }
        await this.b.respond(req, res);
    }

    /**
     * Extract query parameters from request
     */
    protected getQueryParams(req: Request): any {
        const query = req.query.query ? JSON.parse(req.query.query as string) : {};
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const sort = req.query.sort as string || 'id';
        const order = req.query.order as string || 'ASC';
        
        return { query, page, limit, sort, order };
    }

    /**
     * Extract body data from request
     */
    protected getBodyData(req: Request): any {
        return req.body;
    }

    /**
     * Extract ID from request params
     */
    protected getId(req: Request): string | number {
        return req.params.id as string;
    }

    /**
     * Check if user is authenticated
     */
    protected isAuthenticated(req: Request): boolean {
        return !!(req as any).user;
    }

    /**
     * Get current user from request
     */
    protected getCurrentUser(req: Request): any {
        return (req as any).user || null;
    }

    /**
     * Validate required fields
     */
    protected validateRequiredFields(data: any, requiredFields: string[]): boolean {
        for (const field of requiredFields) {
            if (!data[field] && data[field] !== 0) {
                this.logger.logError(`Missing required field: ${field}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Log controller method entry
     */
    protected logEntry(methodName: string): void {
        this.logger.logInfo(`${this.constructor.name}::${methodName}()/01`);
    }

    /**
     * Log controller method exit
     */
    protected logExit(methodName: string): void {
        this.logger.logInfo(`${this.constructor.name}::${methodName}()/02`);
    }

    /**
     * Abstract methods that should be implemented by child classes
     */
    abstract Create(req: Request, res: Response): Promise<void>;
    abstract Get(req: Request, res: Response): Promise<void>;
    abstract Update(req: Request, res: Response): Promise<void>;
    abstract Delete(req: Request, res: Response): Promise<void>;
}