import { Entity, PrimaryGeneratedColumn, Column, } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { IQuery } from '../../base/i-base';
import { GroupInvitationService } from '../services/group-invitation.service';

export function siCreate(serviceInstance:GroupInvitationService){
    return {
        serviceModel: GroupInvitationModel,
        serviceModelInstance: serviceInstance.serviceModel,
        docName: 'Create invitation to a group',
        dSource: 1,
    }
}

export function getGroupInvitationParams(q:IQuery){
    return {
        serviceModel: GroupInvitationModel,
        docName: 'GroupInvitationService::getGroupInvitation',
        cmd: {
            action: 'find',
            query: q
        },
        dSource: 1
    }
}

@Entity(
    {
        name: 'group_invitation',
        synchronize: false
    }
)
// SELECT group_invitation_id, group_invitation_guid, group_invitation_name, group_invitation_description, group_id, hostUser, guestUser, accept, doc_id, group_invitation_type_id, `left`, module_name, notification_id


export class GroupInvitationModel {

    @PrimaryGeneratedColumn(
        {
            name: 'group_invitation_id'
        }
    )
    groupInvitationId?: number;

    @Column({
        name: 'group_invitation_guid',
        length: 36,
        default: uuidv4()
    })
    groupInvitationGuid?: string;

    @Column(
        'varchar',
        {
            name: 'group_invitation_name',
            length: 50,
            nullable: true
        }
    )
    groupInvitationName: string;

    @Column(
        'varchar',
        {
            name: 'group_invitation_description',
            length: 50,
            nullable: true
        }
    )
    groupInvitationDescription: string;

    @Column(
        {
            name: 'doc_id',
            nullable: true
        }
    )
    docId: number;

    @Column(
        {
            name: 'group_id',
            nullable: true
        }
    )
    groupId: number;

    @Column(
        {
            name: 'host_user',
            nullable: true
        }
    )
    hostUser: number;

    @Column(
        {
            name: 'guest_user',
            nullable: true
        }
    )
    guestUser: number;

    @Column(
        {
            name: 'accept',
            nullable: true
        }
    )
    accept: boolean;

    @Column(
        {
            name: 'group_invitation_type_id',
            nullable: true
        }
    )
    groupInvitationTypeId: number;

    @Column(
        {
            name: 'left',
            nullable: true
        }
    )
    left: boolean;

    @Column(
        {
            name: 'module_name',
            nullable: true
        }
    )
    moduleName: string;

    @Column(
        {
            name: 'notification_id',
            nullable: true
        }
    )
    notificationId: number;
}
