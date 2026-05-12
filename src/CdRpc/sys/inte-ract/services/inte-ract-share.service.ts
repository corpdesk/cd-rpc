import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';


@Entity(
    {
        name: 'inte_ract_share',
        synchronize: false
    }
)

export class InteRactShareModel {

    @PrimaryGeneratedColumn(
        {
            name: 'inte_ract_share_id'
        }
    )
    inteRactShareId: number;

    @Column({
        name: 'inte_ract_share_name',
    })
    inteRactShareName: string;

    @Column({
        name: 'inte_ract_share_description',
    })
    inteRactShareDescription: string;

    @Column(
        {
            name: 'inte_ract_share_guid',
        }
    )
    inteRactShareGuid: string;

    @Column(
        {
            name: 'doc_id',
        }
    )
    docId: number;

    @Column(
        {
            name: 'inte_ract_enabled',
        }
    )
    inteRactEnabled: boolean;

    @Column(
        {
            name: 'inte_ract_share_type_id',
        }
    )
    inteRactShareTypeId: number;
}
