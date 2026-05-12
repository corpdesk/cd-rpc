import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { validateOrReject } from "class-validator";
import { IShellConfig } from "../../base/i-base";

@Entity({
  name: "consumer",
  synchronize: false,
})
// @CdModel
export class ConsumerModel {
  @PrimaryGeneratedColumn({
    name: "consumer_id",
  })
  consumerId?: number;

  @Column({
    name: "consumer_guid",
    length: 36,
    default: uuidv4(),
  })
  consumerGuid?: string;

  @Column("varchar", {
    name: "consumer_name",
    length: 50,
    nullable: true,
  })
  consumerName!: string;

  @Column("tinyint", {
    name: "consumer_enabled",
    default: null,
  })
  consumerEnabled!: boolean | number | null;

  @Column({
    name: "doc_id",
    default: null,
  })
  docId?: number;

  @Column({
    name: "company_id",
    default: null,
  })
  companyId?: number;

  @Column({
    name: "company_guid",
    default: null,
  })
  companyGuid?: string;

  /**
   * Consumer/tenant profile is stored as JSON in DB
   * Same pattern as UserModel.userProfile
   */
  @Column({
    name: "consumer_profile",
    default: null,
  })
  consumerProfile?: string; // JSON-encoded IConsumerProfile
}

export const consumerProfileDefault: IConsumerProfile = {
  logo: {
    url: `/assets/images/company/default-logo.png`,
  },

  fieldPermissions: {
    userPermissions: [
      {
        userId: 0, // consumer admin
        field: "consumerName",
        hidden: false,
        read: true,
        write: true,
        execute: false,
      },
    ],
    groupPermissions: [
      {
        groupId: 0, // public group
        field: "consumerName",
        hidden: false,
        read: true,
        write: false,
        execute: false,
      },
    ],
  },

  // /**
  //  * minimal consumer data placeholder
  //  */
  // consumerData: {
  //   consumerName: "",
  //   companyId: null,
  //   consumerEnabled: true,
  // },

  shellConfig: {
    appName: "default-consumer-config",
    userPersonalizationAllowed: true,
    defaultUiSystemId: "bootstrap-538",
    defaultThemeId: "default-light",
    defaultFormVariant: "outlined",
    enforcedPolicies: {
      lockTheme: true,
      lockUiSystem: true,
      lockFormVariant: true,
    },
  },
};

/**
 * CONSUMER SHELL CONFIG
 * ----------------------
 * This mirrors IUserShellConfig but expresses consumer-wide policies.
 */

export interface IConsumerShellConfig extends IShellConfig {
  // /**
  //  * Whether users under this consumer are allowed
  //  * to personalize their UI system, theme, formVariant.
  //  */
  // userPersonalizationAllowed?: boolean;

  // /**
  //  * Default UI settings for this consumer (tenant).
  //  * These override system defaults, but user settings
  //  * may override these IF personalization is allowed.
  //  */
  // defaultUiSystemId?: string;
  // defaultThemeId?: string;
  // defaultFormVariant?: string;

  // /**
  //  * Consumer-level enforced UI policies
  //  * (e.g., lock UI system or theme).
  //  */
  // enforcedPolicies?: {
  //   lockUiSystem?: boolean;
  //   lockTheme?: boolean;
  //   lockFormVariant?: boolean;
  // };

  /**
   * Whether users under this consumer are allowed
   * to personalize their UI system, theme, formVariant.
   */
  userPersonalizationAllowed?: boolean;

  /**
   * Default UI settings for this consumer (tenant).
   * These override system defaults, but user settings
   * may override these IF personalization is allowed.
   */
  defaultUiSystemId?: string;
  defaultThemeId?: string;
  defaultFormVariant?: string;

  /**
   * Consumer-level enforced UI policies
   * (e.g., lock UI system or theme).
   */
  enforcedPolicies?: {
    lockUiSystem?: boolean;
    lockTheme?: boolean;
    lockFormVariant?: boolean;
  };

  /**
   * NEW: Track configuration source for debugging and merging
   * CHANGED: Moved from IShellConfig to here since consumer-specific
   */
  source?: "system" | "consumer" | "user";
}

/**
 * ACCESS STRUCTURES
 * ------------------
 * Mirrors IUserProfileAccess but now consumer-level access.
 * This governs which USERS and which GROUPS can access consumer fields/settings.
 */

export interface IConsumerProfileAccess {
  userPermissions: IProfileConsumerUserAccess[];
  groupPermissions: IProfileConsumerGroupAccess[];
}

/**
 * Same structure as IProfileUserAccess but adapted
 * for consumer profile domain.
 */
export interface IProfileConsumerUserAccess {
  userId: number; // which user is being granted access
  field: string; // field/setting being controlled
  hidden: boolean;
  read: boolean;
  write: boolean;
  execute: boolean;
}

/**
 * Same structure as IProfileGroupAccess but adapted
 * for consumer profile domain.
 */
export interface IProfileConsumerGroupAccess {
  groupId: number; // group controlling access
  field: string;
  hidden: boolean;
  read: boolean;
  write: boolean;
  execute: boolean;
}

/**
 * MAIN CONSUMER PROFILE
 * ----------------------
 * Mirrors IUserProfile closely.
 *
 * IUserProfile.userData      → IConsumerProfile.consumerData
 * IUserProfile.avatar        → IConsumerProfile.logo
 * IUserProfile.fieldPermissions → IConsumerProfile.fieldPermissions
 * IUserProfile.shellConfig   → IConsumerProfile.shellConfig
 */

export interface IConsumerProfile {
  // fieldPermissions: IConsumerProfileAccess; // consumer ACL
  // logo?: object; // consumer/company logo metadata
  // // consumerData: ConsumerModel;                // base object like userData in IUserProfile

  // /**
  //  * OPTIONAL consumer-level metadata
  //  */
  // description?: string;
  // tags?: string[];
  // branches?: string[];
  // socialLinks?: string[];
  // partners?: string[];

  // /**
  //  * Shell configuration (UI systems, themes, policies)
  //  */
  // shellConfig?: IConsumerShellConfig;
  fieldPermissions: IConsumerProfileAccess; // consumer ACL
  logo?: object; // consumer/company logo metadata

  /**
   * OPTIONAL consumer-level metadata
   */
  description?: string;
  tags?: string[];
  branches?: string[];
  socialLinks?: string[];
  partners?: string[];

  /**
   * Shell configuration (UI systems, themes, policies)
   */
  shellConfig?: IConsumerShellConfig;
}
