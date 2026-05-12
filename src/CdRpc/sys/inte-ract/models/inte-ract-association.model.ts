import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';


@Entity(
    {
        name: 'inte_ract_association',
        synchronize: false
    }
)

export class InteRactAssociationModel {

    @PrimaryGeneratedColumn(
        {
            name: 'inte_ract_association_id'
        }
    )
    inteRactAssociationId: number;

    @Column({
        name: 'inte_ract_association_name',
    })
    inteRactAssociationName: string;

    @Column(
        {
            name: 'inte_ract_association_guid',
        }
    )
    inteRactAssociationGuid: string;

    @Column(
        'int',
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
}
