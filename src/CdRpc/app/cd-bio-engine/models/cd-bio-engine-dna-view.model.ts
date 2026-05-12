import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    name: 'cd_bio_engine_dna_view',
    synchronize: false,
    expression: `
        SELECT
            d.cd_bio_engine_dna_id,
            d.cd_bio_engine_dna_guid,
            d.cd_bio_engine_dna_name,
            d.cd_bio_engine_dna_description,
            d.cd_bio_engine_dna_enabled,
            d.doc_id,
            d.cd_bio_engine_dna_data,
            d.cd_bio_engine_dna_src,
            d.cd_bio_engine_dna_type_id,

            t.cd_bio_engine_dna_type_guid,
            t.cd_bio_engine_dna_type_name,
            t.cd_bio_engine_dna_type_description,
            t.doc_id AS cd_bio_engine_dna_type_doc_id

        FROM cd_bio_engine_dna d
        JOIN cd_bio_engine_dna_type t
            ON d.cd_bio_engine_dna_type_id = t.cd_bio_engine_dna_type_id
    `
})
export class CdBioEngineDnaViewModel {

    @ViewColumn({ name: 'cd_bio_engine_dna_id' })
    cdBioEngineDnaId!: number;

    @ViewColumn({ name: 'cd_bio_engine_dna_guid' })
    cdBioEngineDnaGuid!: string;

    @ViewColumn({ name: 'cd_bio_engine_dna_name' })
    cdBioEngineDnaName!: string;

    @ViewColumn({ name: 'cd_bio_engine_dna_description' })
    cdBioEngineDnaDescription!: string;

    @ViewColumn({ name: 'cd_bio_engine_dna_enabled' })
    cdBioEngineDnaEnabled!: boolean;

    @ViewColumn({ name: 'doc_id' })
    docId!: number;

    @ViewColumn({ name: 'cd_bio_engine_dna_data' })
    cdBioEngineDnaData!: any;

    @ViewColumn({ name: 'cd_bio_engine_dna_src' })
    cdBioEngineDnaSrc!: any;

    @ViewColumn({ name: 'cd_bio_engine_dna_type_id' })
    cdBioEngineDnaTypeId!: number;

    // 🔗 TYPE JOINED FIELDS

    @ViewColumn({ name: 'cd_bio_engine_dna_type_guid' })
    cdBioEngineDnaTypeGuid!: string;

    @ViewColumn({ name: 'cd_bio_engine_dna_type_name' })
    cdBioEngineDnaTypeName!: string;

    @ViewColumn({ name: 'cd_bio_engine_dna_type_description' })
    cdBioEngineDnaTypeDescription!: string;

    @ViewColumn({ name: 'cd_bio_engine_dna_type_doc_id' })
    cdBioEngineDnaTypeDocId!: number;
}