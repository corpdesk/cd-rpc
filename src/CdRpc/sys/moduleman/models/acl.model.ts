import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';
import { IQuery } from '../../base/i-base';


@Entity(
    {
        name: 'acl',
        synchronize: false
    }
)
export class AclModel {

    @PrimaryGeneratedColumn(
        {
            name: 'acl_id'
        }
    )
    aclId?: number;

    @Column({
        name: 'acl_guid',
    })
    aclGuid?: string;

    @Column(
        {
            name: 'acl_name',
            nullable: true
        }
    )
    aclName: string;

    @Column(
        {
            name: 'acl_type_guid',
            default: null
        })
    cdObjTypeGuid: string;

    @Column(
        {
            name: 'last_sync_date',
            default: null
        }
    )
    lastSyncDate?: string;

    @Column(
        'datetime',
        {
            name: 'last_modification_date',
            default: null
        }
    )
    lastModificationDate?: string;

    @Column(
        {
            name: 'parent_module_guid',
            default: null
        }
    )
    parentModuleGuid?: string;

    @Column(
        {
            name: 'parent_class_guid',
            default: null
        }
    )
    parentClassGuid?: string;

    @Column(
        {
            name: 'parent_obj',
            default: null
        }
    )
    parentObj?: string;

    @Column(
        'datetime',
        {
            name: 'acl_disp_name',
            default: null
        }
    )
    cdObjDispName?: string;

    @Column(
        {
            name: 'doc_id',
            default: null
        }
    )
    docId?: number;

    @Column(
        'bit',
        {
            name: 'show_name',
            default: null
        }
    )
    showName?: boolean;

    @Column(
        'varchar',
        {
            name: 'icon',
            default: null
        }
    )
    icon?: string;

    @Column(
        'bit',
        {
            name: 'show_icon',
            default: null
        }
    )
    showIcon?: boolean;

    @Column(
        'varchar',
        {
            name: 'curr_val',
            default: null
        }
    )
    currVal?: string;

    @Column(
        'bit',
        {
            name: 'enabled',
            default: null
        }
    )
    enabled?: boolean;

}

export function siGet(q:IQuery){
    return {
        serviceModel: AclModel,
        docName: 'AclModel::siGet',
        cmd: {
            action: 'find',
            query: q
        },
        dSource: 1
    }
}
