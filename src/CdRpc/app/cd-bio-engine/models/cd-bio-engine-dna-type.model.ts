import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    BeforeUpdate
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { validateOrReject } from 'class-validator';

@Entity({
    name: 'cd_bio_engine_dna_type',
    synchronize: false
})
// @CdModel
export class CdBioEngineDnaTypeModel {

    @PrimaryGeneratedColumn({
        name: 'cd_bio_engine_dna_type_id'
    })
    cdBioEngineDnaTypeId?: number;

    @Column({
        name: 'cd_bio_engine_dna_type_guid',
        length: 36,
        default: uuidv4()
    })
    cdBioEngineDnaTypeGuid?: string;

    @Column('varchar', {
        name: 'cd_bio_engine_dna_type_name',
        length: 100,
        nullable: true
    })
    cdBioEngineDnaTypeName!: string;

    @Column('varchar', {
        name: 'cd_bio_engine_dna_type_description',
        length: 255,
        nullable: true
    })
    cdBioEngineDnaTypeDescription!: string;

    @Column({
        name: 'doc_id',
        default: null
    })
    docId!: number;

    @Column({
        name: 'parent_guid',
        default: null
    })
    parentGuid!: string;

    @Column({
        name: 'cd_bio_engine_dna_type_enabled',
        default: null
    })
    cdBioEngineDnaTypeEnabled!: boolean;

    // HOOKS
    @BeforeInsert()
    @BeforeUpdate()
    async validate() {
        await validateOrReject(this);
    }
}