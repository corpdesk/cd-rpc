import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Generated,
    BeforeInsert,
    BeforeUpdate,
    IsNull,
    Not,
    UpdateDateColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import {
    validate,
    validateOrReject,
    Contains,
    IsInt,
    Length,
    IsEmail,
    IsFQDN,
    IsDate,
    Min,
    Max,
    IsJSON,
} from 'class-validator';

@Entity()
export class ExportModel {
    @PrimaryGeneratedColumn(
        {
            name: 'export_id'
        }
    )
    exportId?: number;

    @Column({
        name: 'export_guid'
    })
    exportGuid!: string;

    @Column(
        {
            name: 'export_name'
        }
    )
    exportName!: string;

    @Column(
        {
            name: 'export_description',
        })
    companyDescription!: string;

    @Column(
        {
            name: 'doc_id',
        }
    )
    docId!: number;

}
