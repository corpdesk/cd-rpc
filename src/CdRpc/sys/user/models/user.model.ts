// src/CdApi/sys/user/models/user.model.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  BeforeInsert,
  BeforeUpdate,
  IsNull,
  Not,
  UpdateDateColumn,
  OneToMany,
  ObjectLiteral,
} from "typeorm";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import {
  validate,
  validateOrReject,
  Contains,
  IsInt,
  Length,
  IsEmail,
  IsFQDN,
  IsDate,
  Min,
  Max,
  IsJSON,
} from "class-validator";
import { CdModel, IsUnique } from "../../base/decorators/validators";
import { UniqueOnDatabase } from "../../base/decorators/UniqueValidation";
import { BaseService } from "../../base/base.service";
import { DocModel } from "../../moduleman/models/doc.model";
import { env } from "process";
import config from "../../../../config";
import { IShellConfig } from "../../base/i-base";

@Entity({
  name: "user",
  synchronize: false,
})
// @CdModel
export class UserModel {
  b?: BaseService<UserModel>;

  @PrimaryGeneratedColumn({
    name: "user_id",
  })
  userId?: number;

  @Column({
    name: "user_guid",
    length: 36,
    default: uuidv4(),
  })
  userGuid?: string;

  @Column("varchar", {
    name: "user_name",
    length: 50,
    nullable: true,
  })
  userName?: string;

  @Column("char", {
    name: "password",
    length: 60,
    default: null,
  })
  password?: string;

  @Column("varchar", {
    length: 60,
    unique: true,
    nullable: true,
  })
  @IsEmail()
  email?: string;

  @Column({
    name: "company_id",
    default: null,
  })
  // @IsInt()
  companyId?: number;

  @Column({
    name: "doc_id",
    default: null,
  })
  // @IsInt()
  docId?: number;

  @Column({
    name: "mobile",
    default: null,
  })
  mobile?: string;

  @Column({
    name: "gender",
    default: null,
  })
  gender?: number;

  @Column({
    name: "birth_date",
    default: null,
  })
  // @IsDate()
  birthDate?: Date;

  @Column({
    name: "postal_addr",
    default: null,
  })
  postalAddr?: string;

  @Column({
    name: "f_name",
    default: null,
  })
  fName?: string;

  @Column({
    name: "m_name",
    default: null,
  })
  mName?: string;

  @Column({
    name: "l_name",
    default: null,
  })
  lName?: string;

  @Column({
    name: "national_id",
    default: null,
  })
  // @IsInt()
  nationalId?: number;

  @Column({
    name: "passport_id",
    default: null,
  })
  // @IsInt()
  passportId?: number;

  @Column({
    name: "user_enabled",
    default: null,
  })
  userEnabled?: boolean;

  @Column("char", {
    name: "zip_code",
    length: 5,
    default: null,
  })
  zipCode?: string;

  @Column({
    name: "activation_key",
    length: 36,
    default: uuidv4(),
  })
  activationKey?: string;

  @Column({
    name: "user_type_id",
    default: null,
  })
  userTypeId?: number;

  @Column({
    name: "user_profile",
    default: null,
  })
  // userProfile?: string | ObjectLiteral;
  userProfile?: string;

  @OneToMany((type) => DocModel, (doc) => doc.user) // note: we will create user property in the Docs class
  docs?: DocModel[];

  // // HOOKS
  // @BeforeInsert()
  // @BeforeUpdate()
  // async validate?() {
  //   await validateOrReject(this);
  // }
}

export interface IUserProfileAccess {
  userPermissions: IProfileUserAccess[];
  groupPermissions: IProfileGroupAccess[];
}

/**
 * Improved versin should have just one interface and
 * instead of userId or groupId, cdObjId is applied.
 * This would then allow any object permissions to be set
 * Automation and 'role' concept can then be used to manage permission process
 */
export interface IProfileUserAccess {
  userId: number;
  hidden: boolean;
  field: string;
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface IProfileGroupAccess {
  groupId: number;
  field: string;
  hidden: boolean;
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface IUserProfile {
  fieldPermissions: IUserProfileAccess;
  avatar?: object; //
  userData: UserModel;
  areasOfInterest?: string[];
  bio?: string;
  affiliatedInstitutions?: string[];
  following?: string[]; // Limit to X entries (e.g., 1000) to avoid abuse
  followers?: string[]; // Limit to X entries (e.g., 1000)
  friends?: string[]; // Limit to X entries (e.g., 500)
  groups?: string[]; // Limit to X entries (e.g., 100)
  shellConfig?: IUserShellConfig;
}

export interface IUserShellConfig extends IShellConfig {
  /** Flags that user can personalize or not */
  personalizationEnabled?: boolean;

  /**
   * A user may optionally override UI system/theme if allowed by consumer.
   */
  userPreferences?: {
    uiSystemId?: string;
    themeId?: string;
    formVariant?: string;
  };
}

export const profileDefaultConfig = [
  {
    path: ["fieldPermissions", "userPermissions", ["userName"]],
    value: {
      userId: 1000,
      field: "userName",
      hidden: false,
      read: true,
      write: false,
      execute: false,
    },
  },
  {
    path: ["fieldPermissions", "groupPermissions", ["userName"]],
    value: {
      groupId: 0,
      field: "userName",
      hidden: false,
      read: true,
      write: false,
      execute: false,
    },
  },
];

/**
 * the data below can be managed under with 'roles'
 * there needs to be a function that set the default 'role' for a user
 */
export const userProfileDefault: IUserProfile = {
  avatar: {
    url: `https://${config.http.hostName}/assets/images/users/avatar-anon.jpg`,
  },
  fieldPermissions: {
    /**
     * specified permission setting for given users to specified fields
     */
    userPermissions: [
      {
        userId: 1000,
        field: "userName",
        hidden: false,
        read: true,
        write: false,
        execute: false,
      },
    ],
    groupPermissions: [
      {
        groupId: 0, // "_public"
        field: "userName",
        hidden: false,
        read: true,
        write: false,
        execute: false,
      },
    ],
  },
  userData: {
    userName: "",
    fName: "",
    lName: "",
  },
};
