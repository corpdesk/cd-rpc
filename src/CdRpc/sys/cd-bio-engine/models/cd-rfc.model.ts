import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";

import { validateOrReject } from "class-validator";
import { v4 as uuidv4 } from "uuid";

@Entity({
  name: "cd_rfc",
  synchronize: false,
})
export class CdRfcModel {
  @PrimaryGeneratedColumn({
    name: "cd_rfc_id",
  })
  cdRfcId?: number;

  @Column({
    name: "cd_rfc_guid",
    length: 36,
    default: uuidv4(),
  })
  cdRfcGuid?: string;

  @Column({
    name: "rfc_id",
  })
  rfcId: string;

  @Column({
    name: "ref",
  })
  ref: string;

  @Column({
    name: "version",
    default: "1.0.0",
  })
  version?: string;

  @Column("text", {
    name: "rules",
  })
  rules: string;

  @Column("text", {
    name: "expressions",
  })
  expressions: string;

  @Column("text", {
    name: "policies",
    nullable: true,
  })
  policies?: string;

  @Column({
    name: "source",
    default: "git",
  })
  source?: string;

  @Column({
    name: "doc_id",
    default: null,
  })
  docId?: number;

  @BeforeInsert()
  @BeforeUpdate()
  async validate?() {
    await validateOrReject(this);
  }
}

/**
 * =============================
 * MACHINE RFC INTERFACES
 * =============================
 */

export interface ICdRfc {
  ref: string;
  rfcId: string;
  version?: string;
  rules: ICdRfcRule[];
  expressions: ICdRfcExpression[];
  policies?: ICdRfcPolicy[];
}

export interface ICdRfcRule {
  id: string;
  type: "naming" | "structure" | "constraint" | "behavior";
  target: string;
  condition: string;
  error: string;
}

export interface ICdRfcExpression {
  id: string;
  expression: string;
  description?: string;
}

export interface ICdRfcPolicy {
  id: string;
  type: "compliance" | "classification" | "prohibition";
  statement: string;
}

export interface ICdRfcTranscription {
  rfc: ICdRfc;
  rawMarkdown?: string;
  checksum?: string;
}
