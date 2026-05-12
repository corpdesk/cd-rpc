
import { Request, Response } from "express";
import { GenericController } from "../../base/generic-controller";
import { GenericService } from "../../base/generic-service";
import { CdSchedulerCalendarModel } from "../models/cd-scheduler-calendar.model";
// export class CalendarService{
export class CdSchedulerCalendarService extends GenericService<CdSchedulerCalendarModel> {
    cdToken: string = "";
    serviceModel = CdSchedulerCalendarModel;
    docName: string = "";

    constructor(){
        super(CdSchedulerCalendarModel)
    }

    getCalendarSumm(cuid: string){
        return [{}];
    }
}