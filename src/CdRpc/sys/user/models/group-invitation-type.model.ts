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
import { BaseService } from '../../base/base.service';

// SELECT group_invitation_type_id, group_invitation_type_guid, group_invitation_type_name, group_invitation_type_description, doc_id


@Entity(
    {
        name: 'group_invitation_type',
        synchronize: false
    }
)
// @CdModel
export class GroupInvitationTypeModel {
    // b!: BaseService<any>;

    @PrimaryGeneratedColumn(
        {
            name: 'group_invitation_type_id'
        }
    )
    groupInvitationTypeId?: number;

    @Column({
        name: 'group_invitation_type_name',
        length: 40,
    })
    groupInvitationTypeName!: string;

    @Column(
        'varchar',
        {
            name: 'group_invitation_type_guid',
            length: 40,
            nullable: true
        }
    )
    groupInvitationTypeGuid!: string;

    @Column(
        'varchar',
        {
            name: 'group_invitation_type_description',
            length: 160,
            nullable: true
        }
    )
    groupInvitationTypeDescription!: string;

    @Column(
        {
            name: 'doc_id',
            default: null
        }
    )
    docId?: number;

}
