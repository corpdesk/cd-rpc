import { Request, Response } from "express";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    BeforeUpdate,
    OneToMany
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
    validateOrReject,
} from 'class-validator';


@Entity(
    {
        name: 'cd_cli_type',
        synchronize: false
    }
)
// @CdModel
export class CdDevTypeModel {

    @PrimaryGeneratedColumn(
        {
            name: 'cd_cli_type_id'
        }
    )
    cdDevTypeId?: number;

    @Column({
        name: 'cd_cli_type_guid',
        length: 36,
        default: uuidv4()
    })
    cdDevTypeGuid?: string;

    @Column(
        'varchar',
        {
            name: 'cd_cli_type_name',
            length: 50,
            nullable: true
        }
    )
    cdDevTypeName: string;

    @Column(
        'varchar',
        {
            name: 'cd_cli_type_description',
            length: 50,
            nullable: true
        }
    )
    cdDevTypeDescription: string;

    @Column(
        {
            name: 'doc_id',
            default: null
        })
    docId: number;

    // HOOKS
    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        await validateOrReject(this);
    }

}
