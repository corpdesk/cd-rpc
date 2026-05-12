import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';


@Entity(
    {
        name: 'inte_ract_link',
        synchronize: false
    }
)

export class InteRactLinkModel {

    @PrimaryGeneratedColumn(
        {
            name: 'inte_ract_link_id'
        }
    )
    inteRactLinkId: number;

    @Column({
        name: 'inte_ract_link_name',
    })
    inteRactLinkName: string;

    @Column({
        name: 'inte_ract_link_description',
    })
    inteRactLinkDescription: string;

    @Column(
        {
            name: 'inte_ract_link_guid',
        }
    )
    inteRactLinkGuid: string;

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
            name: 'inte_ract_link_type_id',
        }
    )
    inteRactLinkTypeId: number;
}
