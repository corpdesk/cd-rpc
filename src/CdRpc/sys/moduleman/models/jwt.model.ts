import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';
import { IQuery } from '../../base/i-base';


@Entity(
    {
        name: 'jwt',
        synchronize: false
    }
)
export class JwtModel {

    @PrimaryGeneratedColumn(
        {
            name: 'jwt_id'
        }
    )
    jwtId?: number;

    @Column({
        name: 'jwt_guid',
    })
    jwtGuid?: string;

    @Column(
        {
            name: 'jwt_name',
            nullable: true
        }
    )
    jwtName!: string;

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
