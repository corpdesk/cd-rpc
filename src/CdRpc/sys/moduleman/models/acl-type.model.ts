import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

@Entity({
    name: 'acl_type',
    synchronize: false
})
export class AclTypeModel {

    @PrimaryGeneratedColumn({
        name: 'acl_type_id'
    })
    aclTypeId?: number;

    @Column({
        name: 'acl_type_name',
        nullable: true
    })
    aclTypeName?: string;

    @Column({
        name: 'acl_description',
        nullable: true
    })
    aclDescription?: string;

    @Column({
        name: 'acl_type_guid',
        nullable: true
    })
    aclTypeGuid?: string;

    @Column({
        name: 'controller',
        nullable: true
    })
    controller?: string;

    @Column({
        name: 'action',
        nullable: true
    })
    action?: string;

    @Column({
        name: 'module_guid',
        nullable: true
    })
    moduleGuid?: string;

    @Column({
        name: 'label',
        nullable: true
    })
    label?: string;

    @Column({
        name: 'order',
        nullable: true
    })
    order?: number;

    @Column({
        name: 'cd_geo_political_type_id',
        nullable: true
    })
    cdGeoPoliticalTypeId?: number;

    @Column({
        name: 'hr_level_id',
        nullable: true
    })
    hrLevelId?: number;
}
