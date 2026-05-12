import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';
import { IQuery } from '../../base/i-base';


@Entity(
    {
        name: 'acl',
        synchronize: false
    }
)
export class CdLogModel {

    @PrimaryGeneratedColumn(
        {
            name: 'cd_log_id'
        }
    )
    cdLogId?: number;

    @Column({
        name: 'cd_log_guid',
    })
    cdLogGuid?: string;

    @Column(
        {
            name: 'cd_log_name',
            nullable: true
        }
    )
    cdLogName!: string;

    @Column(
        {
            name: 'doc_id',
            default: null
        }
    )
    docId?: number;

}

// export function siGet(q:IQuery){
//     return {
//         serviceModel: CdLogModel,
//         docName: 'CdLogModel::siGet',
//         cmd: {
//             action: 'find',
//             query: q
//         },
//         dSource: 1
//     }
// }
