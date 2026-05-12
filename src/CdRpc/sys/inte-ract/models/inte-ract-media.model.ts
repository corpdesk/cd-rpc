import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from 'typeorm';


@Entity(
    {
        name: 'inte_ract_media',
        synchronize: false
    }
)

export class InteRactMediaModel {

    @PrimaryGeneratedColumn(
        {
            name: 'inte_ract_media_id'
        }
    )
    inteRactMediaId: number;

    @Column({
        name: 'inte_ract_media_name',
    })
    inteRactMediaName: string;

    @Column({
        name: 'inte_ract_media_description',
    })
    inteRactMediaDescription: string;

    @Column(
        {
            name: 'inte_ract_media_guid',
        }
    )
    inteRactMediaGuid: string;

    @Column(
        'int',
        {
            name: 'doc_id',
        }
    )
    docId: number;

    // inte_ract_media_type_id, inte_ract_pub_id, inte_ract_react_id, location, mime_type

    @Column(
        {
            name: 'inte_ract_media_type_id',
        }
    )
    inteRactMediaTypeId: number;

    @Column(
        {
            name: 'inte_ract_pub_id',
        }
    )
    inteRactPubId: number;

    @Column(
        {
            name: 'inte_ract_react_id',
        }
    )
    inteRactReactId: number;

    @Column(
        {
            name: 'location',
        }
    )
    location: string;

    @Column(
        {
            name: 'mime_type',
        }
    )
    mimeType: string;

    
}
