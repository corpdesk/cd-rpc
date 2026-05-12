import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';


@Entity(
    {
        name: 'inte_ract',
        synchronize: false
    }
)

export class InteRactModel {

    @PrimaryGeneratedColumn(
        {
            name: 'inte_ract_id'
        }
    )
    inteRactId: number;

    @Column({
        name: 'inte_ract_name',
    })
    inteRactName: string;

    @Column(
        {
            name: 'inte_ract_guid',
        }
    )
    inteRactGuid: string;

    @Column(
        {
            name: 'doc_id',
        }
    )
    docId: number;

    @Column(
        {
            name: 'inte_ract_type_id',
        }
    )
    inteRactTypeId: boolean;
}
