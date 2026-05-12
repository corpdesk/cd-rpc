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
        name: 'cd_cli_profile_type',
        synchronize: false
    }
)
// @CdModel
export class CdCliProfileTypeModel {

    @PrimaryGeneratedColumn(
        {
            name: 'cd_cli_profile_type_id'
        }
    )
    cdCliProfileTypeId?: number;

    @Column({
        name: 'cd_cli_profile_type_guid',
        length: 36,
        default: uuidv4()
    })
    abcdTypeGuid?: string;

    @Column(
        'varchar',
        {
            name: 'cd_cli_profile_type_name',
            length: 50,
            nullable: true
        }
    )
    cdCliProfileTypeName: string;

    @Column(
        'varchar',
        {
            name: 'cd_cli_profile_type_description',
            length: 50,
            nullable: true
        }
    )
    cdCliProfileTypeDescription: string;

    @Column(
        {
            name: 'doc_id',
            default: null
        })
    docId: number;

}
