import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';


@Entity(
    {
        name: 'inte_ract_subscriber',
        synchronize: false
    }
)

// SELECT inte_ract_subscriber_id, inte_ract_subscriber_guid, inte_ract_subscriber_name, inte_ract_subscriber_description, doc_id, inte_ract_subscriber_type_id, group_id, user_id, inte_ract_pub_id
// FROM cd1213.inte_ract_subscriber;

export class InteRactSubscriberModel {

    @PrimaryGeneratedColumn(
        {
            name: 'inte_ract_subscriber_id'
        }
    )
    inteRactSubscriberId: number;

    @Column({
        name: 'inte_ract_subscriber_name',
    })
    inteRactSubscriberName: string;

    @Column({
        name: 'inte_ract_subscriber_description',
    })
    inteRactSubscriberDescription: string;

    @Column(
        {
            name: 'inte_ract_subscriber_guid',
        }
    )
    inteRactSubscriberGuid: string;

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
            name: 'inte_ract_subscriber_type_id',
        }
    )
    inteRactSubscriberTypeId: number;

    @Column(
        {
            name: 'group_id',
        }
    )
    groupId: number;

    @Column(
        {
            name: 'user_id',
        }
    )
    userId: number;

    @Column(
        {
            name: 'inte_ract_pub_id',
        }
    )
    inteRactPubId: number;
}
