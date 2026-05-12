import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { IQuery, JSDPInstruction } from "../../../sys/base/i-base";

@Entity({
  name: "cd_bio_engine_dna",
  synchronize: false,
})
export class CdBioEngineDnaModel {
  @PrimaryGeneratedColumn({
    name: "cd_bio_engine_dna_id",
  })
  cdBioEngineDnaId?: number;

  @Column({
    name: "cd_bio_engine_dna_guid",
  })
  cdBioEngineDnaGuid!: string;

  @Column({
    name: "cd_bio_engine_dna_name",
  })
  cdBioEngineDnaName!: string;

  @Column({
    name: "cd_bio_engine_dna_description",
    nullable: true,
  })
  cdBioEngineDnaDescription?: string;

  @Column({
    name: "cd_bio_engine_dna_enabled",
    default: true,
  })
  cdBioEngineDnaEnabled?: boolean;

  @Column({
    name: "doc_id",
  })
  docId!: number;

  // 🔥 DNA Payload (RFC Blocks)
  @Column({
    name: "cd_bio_engine_dna_data",
    type: "json",
    nullable: true,
  })
  cdBioEngineDnaData?: any;

  @Column({
    name: "cd_bio_engine_dna_src",
    type: "json",
    nullable: true,
  })
  cdBioEngineDnaSrc?: any;
}

export interface ICdBioEngineDnaUpdatePayload {
  requestQuery: IQuery;
  jsonUpdate: JSDPInstruction[];
}

export interface ISemanticMutationResult {
  targetRow: CdBioEngineDnaModel;
  finalModelUpdates: any;
  requestQuery: IQuery;
}
