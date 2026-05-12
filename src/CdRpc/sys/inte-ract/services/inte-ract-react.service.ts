import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';


@Entity(
    {
        name: 'inte_ract_react',
        synchronize: false
    }
)

// SELECT inte_ract_react_id, inte_ract_react_guid, inte_ract_react_name, inte_ract_react_description, doc_id, inte_ract_react_type_id, inte_ract_react_type_optval, j_val, inte_ract_pub_id, parent_id
// FROM cd1213.inte_ract_react;

export class InteRactReactModel {

    @PrimaryGeneratedColumn(
        {
            name: 'inte_ract_react_id'
        }
    )
    inteRactReactId: number;

    @Column({
        name: 'inte_ract_react_name',
    })
    inteRactReactName: string;

    @Column({
        name: 'inte_ract_react_description',
    })
    inteRactReactDescription: string;

    @Column(
        {
            name: 'inte_ract_react_guid',
        }
    )
    inteRactReactGuid: string;

    @Column(
        'int',
        {
            name: 'doc_id',
        }
    )
    docId: number;

    @Column(
        {
            name: 'inte_ract_react_type_id',
        }
    )
    inteRactReactTypeId: number;

    @Column(
        {
            name: 'inte_ract_react_type_optval',
        }
    )
    inteRactReactTypeOptval: number;

    @Column(
        {
            name: 'j_val',
        }
    )
    jVal: JSON;

    @Column(
        {
            name: 'inte_ract_pub_id',
        }
    )
    inteRactPubId: number;

    @Column(
        {
            name: 'parent_id',
        }
    )
    parentId: number;
}
