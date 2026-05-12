import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
  name: "cd_cli_profile_view",
  /**
   * This is managed by Corpdesk engine so that when
   * typeorm is not implemented, the process continues without
   * dependency on typorm
   */
  synchronize: false,
  /**
   * The expression below can be auto-generated from
   * cd-cli or cd-ai
   */
  expression: `
        SELECT 
            'cd_cli_profile'.'cd_cli_profile_id' AS 'cd_cli_profile_id',
            'cd_cli_profile'.'cd_cli_profile_guid' AS 'cd_cli_profile_guid',
            'cd_cli_profile'.'cd_cli_profile_name' AS 'cd_cli_profile_name',
            'cd_cli_profile'.'cd_cli_profile_description' AS 'cd_cli_profile_description',
            'cd_cli_profile'.'cd_cli_profile_enabled' AS 'cd_cli_profile_enabled',
            'cd_cli_profile'.'cd_cli_profile_profile' AS 'cd_cli_profile_profile',
            'cd_cli_profile_type'.'cd_cli_profile_type_id' AS 'cd_cli_profile_type_id',
            'cd_cli_profile_type'.'cd_cli_profile_type_guid' AS 'cd_cli_profile_type_guid'
        FROM
            'cd_cli_profile'
            JOIN 'cd_cli_profile_type' ON 'cd_cli_profile'.'cd_cli_profile_type_id' = 'cd_cli_profile_type'.'cd_cli_profile_type_id'
    `,
})
export class CdCliProfileViewModel {
  @ViewColumn({ name: "cd_cli_profile_id" })
  cdCliProfileId?: number;

  @ViewColumn({ name: "cd_cli_profile_guid" })
  cdCliProfileGuid?: string;

  @ViewColumn({ name: "cd_cli_profile_name" })
  cdCliProfileName?: string;

  @ViewColumn({ name: "cd_cli_profile_description" })
  cdCliProfileDescription?: string;

  @ViewColumn({ name: 'cd_cli_profile_data' })
  cdCliProfileData: string;

  @ViewColumn({ name: "cd_cli_profile_enabled" })
  cdCliProfileEnabled?: boolean;

  @ViewColumn({ name: "cd_cli_profile_type_id" })
  cdCliProfileTypeId?: number;

  @ViewColumn({ name: "cd_cli_profile_type_guid" })
  cdCliProfileTypeGuid?: string;

  @ViewColumn({ name: "user_id" })
  userId?: number;
}
