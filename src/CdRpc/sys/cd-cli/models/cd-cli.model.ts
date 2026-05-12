/**
 * Root Entity
 * Base Name: cdCli
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity(
    {
        name: 'cd_cli',
        synchronize: false
    }
)
export class CdCliModel {
    @PrimaryGeneratedColumn(
        {
            name: 'cd_cli_id'
        }
    )
    cdCliId?: number;

    @Column({
        name: 'cd_cli_guid',
        length: 36,
        default: uuidv4()
    })
    cdCliGuid?: string;

    @Column(
        {
            name: 'cd_cli_name',
            length: 50,
            nullable: true
        }
    )
    cdCliName: string;

    @Column(
        {
            name: 'cd_cli_description',
            length: 60,
            default: null
        })
    cdCliDescription: string;

    /**
     *link to DocModel
     * Doc model stores metadata for all transaction 
     * See Documentation on Doc Processing 
     */
    @Column(
        {
            name: 'doc_id',
            default: null
        }
    )
    docId?: number;

    @Column(
        {
            name: 'cd_cli_type_id',
            default: null
        }
    )
    cdCliTypeId?: number;

    @Column(
        'boolean',
        {
            name: 'cd_cli_enabled',
            default: null
        }
    )
    cdCliEnabled?: boolean;  
}
