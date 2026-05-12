import { Request, Response } from "express";
import { GenericController } from "../../base/generic-controller";

// export class SchedulerService{
export class SchedulerService extends GenericController<SchedulerModel> {
    getCalendarSumm(cuid){
        return [{}];
    }

}