import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';

// SELECT inte_ract_pub_id, inte_ract_pub_guid, inte_ract_pub_name, inte_ract_pub_description, doc_id, inte_ract_pub_type_id, public, m, c, j_val
// FROM cd1213.inte_ract_pub;


@Entity(
    {
        name: 'inte_ract_pub',
        synchronize: false
    }
)

export class InteRactPubModel {

    @PrimaryGeneratedColumn(
        {
            name: 'inte_ract_pub_id'
        }
    )
    inteRactPubId: number;

    @Column({
        name: 'inte_ract_pub_name',
    })
    inteRactPubName: string;

    @Column({
        name: 'inte_ract_pub_description',
    })
    inteRactPubDescription: string;

    @Column(
        {
            name: 'inte_ract_pub_guid',
        }
    )
    inteRactPubGuid: string;

    @Column(
        'int',
        {
            name: 'doc_id',
        }
    )
    docId: number;

    @Column(
        {
            name: 'inte_ract_pub_type_id',
        }
    )
    inteRactPubTypeId: string;

    @Column(
        {
            name: 'public',
        }
    )
    public: boolean;

    @Column(
        {
            name: 'm',
        }
    )
    m: string;

    @Column(
        {
            name: 'module_cd_obj_id',
        }
    )
    moduleCdObjId: number;

    @Column(
        {
            name: 'c',
        }
    )
    c: string;

    @Column(
        {
            name: 'controller_cd_obj_id',
        }
    )
    controllerCdObjId: number;

    @Column(
        {
            name: 'j_val',
        }
    )
    jVal: string;

    @Column(
        {
            name: 'consumer_id',
        }
    )
    consumerId: string;
    
}
