/**
 * Root Entity
 * Base Name: cdDev
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
export class CdDevModel {
    @PrimaryGeneratedColumn(
        {
            name: 'cd_cli_id'
        }
    )
    cdDevId?: number;

    @Column({
        name: 'cd_cli_guid',
        length: 36,
        default: uuidv4()
    })
    cdDevGuid?: string;

    @Column(
        {
            name: 'cd_cli_name',
            length: 50,
            nullable: true
        }
    )
    cdDevName: string;

    @Column(
        {
            name: 'cd_cli_description',
            length: 60,
            default: null
        })
    cdDevDescription: string;

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
    cdDevTypeId?: number;

    @Column(
        'boolean',
        {
            name: 'cd_cli_enabled',
            default: null
        }
    )
    cdDevEnabled?: boolean;  
}
