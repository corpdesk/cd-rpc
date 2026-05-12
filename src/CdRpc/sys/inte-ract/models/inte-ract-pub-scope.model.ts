import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';


@Entity(
    {
        name: 'inte_ract_pub_scope',
        synchronize: false
    }
)

export class InteRactPubScopeModel {

    @PrimaryGeneratedColumn(
        {
            name: 'inte_ract_pub_scope_id'
        }
    )
    inteRactPubScopeId: number;

    @Column({
        name: 'inte_ract_pub_scope_name',
    })
    inteRactPubScopeName: string;

    @Column({
        name: 'inte_ract_pub_scope_description',
    })
    inteRactPubScopeDescription: string;

    @Column(
        {
            name: 'inte_ract_pub_scope_guid',
        }
    )
    inteRactPubScopeGuid: string;

    @Column(
        'int',
        {
            name: 'doc_id',
        }
    )
    docId: number;
}
