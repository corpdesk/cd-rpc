import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { BaseService } from "../../base/base.service";

@Entity({
  name: "cd_scheduler_calendar",
  synchronize: false,
})
// @CdModel
export class CdSchedulerCalendarModel {
  b?: BaseService<CdSchedulerCalendarModel>;

  @PrimaryGeneratedColumn({
    name: "cd_scheduler_calendar_id",
  })
  cdSchedulerCalendarId?: number;

  @Column({
    name: "cd_scheduler_calendar_guid",
    length: 36,
    default: uuidv4(),
  })
  cdSchedulerCalendarGuid?: string;

  @Column({
    name: "doc_id",
    type: "int",
    nullable: true,
    default: null,
  })
  docId?: number;

  @Column({
    name: "cd_scheduler_calendar_name",
    type: "varchar",
    length: 100,
    nullable: true,
    default: null,
  })
  cdSchedulerCalendarName?: string;

  @Column({
    name: "cd_scheduler_calendar_description",
    type: "varchar",
    length: 324,
    nullable: true,
    default: null,
  })
  cdSchedulerCalendarDescription?: string;

  @Column({
    name: "cd_scheduler_subscriber_status_id",
    type: "int",
    nullable: true,
    default: null,
  })
  cdSchedulerSubscriberStatusId?: number;
}