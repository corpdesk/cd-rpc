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
        name: 'cd_obj_type',
        synchronize: false
    }
)
// @CdModel
export class CdObjTypeModel {

    @PrimaryGeneratedColumn(
        {
            name: 'cd_obj_type_id'
        }
    )
    cdObjTypeId?: number;

    @Column({
        name: 'cd_obj_type_guid',
        length: 36,
        default: uuidv4()
    })
    cdObjTypeGuid?: string;

    @Column(
        'varchar',
        {
            name: 'cd_obj_type_name',
            length: 50,
            nullable: true
        }
    )
    cdObjTypeName: string;

    @Column(
        {
            name: 'doc_id',
            default: null
        })
    docId?: number;

    @Column(
        'varchar',
        {
            name: 'mod_craft_controller',
            length: 50,
            nullable: true
        }
    )
    modCraftController?: string;

    // HOOKS
    // @BeforeInsert()
    // @BeforeUpdate()
    // async validate() {
    //     await validateOrReject(this);
    // }

}
