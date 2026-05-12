import { ViewEntity, ViewColumn } from 'typeorm';
import { IQuery } from '../../base/i-base';

// export function siGet(q: IQuery) {
//     return {
//         serviceModel: CdCliViewModel,
//         docName: 'CdCliModel::siGet',
//         cmd: {
//             action: 'find',
//             query: q
//         },
//         dSource: 1
//     }
// }

@ViewEntity({
    name: 'cd_cli_view',
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
        'cd_cli'.'cd_cli_id', 
        'cd_cli'.'cd_cli_name',
        'cd_cli'.'cd_cli_description', 
        'cd_cli'.'cd_cli_guid', 
        'cd_cli'.'cd_cli_type_id', 
        'cd_cli'.'cd_cli_enabled', 
        'cd_cli_type'.'cd_cli_type_guid', 
        'cd_cli_type'.'cd_cli_type_id' 
        FROM 
        cd_cli 
        JOIN cd_cli_type ON cd_cli.cd_cli_type_id = cd_cli_type.cd_cli_type_id;

    `
})

export class CdCliViewModel {
    @ViewColumn({ name: 'cd_cli_id' })
    cdCliId: number;

    @ViewColumn({ name: 'cd_cli_name' })
    cdCliName: string;

    @ViewColumn({ name: 'cd_cli_description' })
    cdCliDescription: string;

    @ViewColumn({ name: 'cd_cli_guid' })
    cdCliGuid: string;

    @ViewColumn({ name: 'cd_cli_type_id' })
    cdCliTypeId: number;

    @ViewColumn({ name: 'cd_cli_type_guid' })
    cdCliTypeGuid: string;

    @ViewColumn({ name: 'cd_cli_enabled' })
    cdCliEnabled: boolean; 

}

