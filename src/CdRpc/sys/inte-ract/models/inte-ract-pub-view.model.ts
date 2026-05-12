import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    name: 'bill_item_view',
    expression: `
    CREATE VIEW inte_ract_pub_view AS
    SELECT DISTINCT
        inte_ract_pub.inte_ract_pub_id,
        inte_ract_pub.inte_ract_pub_guid,
        inte_ract_pub.inte_ract_pub_name,
        inte_ract_pub.inte_ract_pub_description,
        inte_ract_pub.doc_id,
        inte_ract_pub.inte_ract_pub_type_id,
        inte_ract_pub.public,
        inte_ract_media.location,
        doc.doc_from,
        doc.doc_date,
        'user'.mobile,
        'user'.gender,
        'user'.birth_date,
        'user'.f_name,
        'user'.m_name,
        'user'.l_name,
        'user'.user_enabled 
    FROM
        inte_ract_pub
        INNER JOIN inte_ract_media ON inte_ract_pub.inte_ract_pub_id = inte_ract_media.inte_ract_pub_id
        INNER JOIN doc ON inte_ract_pub.doc_id = doc.doc_id
        INNER JOIN USER ON doc.doc_from = USER.user_id
        `
})

export class InteRactPubViewModel {
    @ViewColumn(
        {
            name: 'inte_ract_pub_id'
        }
    )
    inteRactPubId: number;

    @ViewColumn({
        name: 'inte_ract_pub_name',
    })
    inteRactPubName: string;

    @ViewColumn({
        name: 'inte_ract_pub_description',
    })
    inteRactPubDescription: string;

    @ViewColumn(
        {
            name: 'inte_ract_pub_guid',
        }
    )
    inteRactPubGuid: string;

    @ViewColumn(
        {
            name: 'doc_id',
        }
    )
    docId: number;

    @ViewColumn(
        {
            name: 'inte_ract_pub_type_id',
        }
    )
    inteRactPubTypeId: string;

    @ViewColumn(
        {
            name: 'public',
        }
    )
    public: boolean;

    @ViewColumn(
        {
            name: 'location',
        }
    )
    location: boolean;

    @ViewColumn(
        {
            name: 'doc_from',
        }
    )
    docFrom: number;

    @ViewColumn(
        {
            name: 'doc_date',
        }
    )
    docDate: number;

    @ViewColumn(
        {
            name: 'mobile',
        }
    )
    mobile: string;

    @ViewColumn(
        {
            name: 'gender',
        }
    )
    gender: string;

    @ViewColumn(
        {
            name: 'birth_date',
        }
    )
    birthDate: string;

    @ViewColumn(
        {
            name: 'f_name',
        }
    )
    fName: string;

    @ViewColumn(
        {
            name: 'm_name',
        }
    )
    mName: string;

    @ViewColumn(
        {
            name: 'l_name',
        }
    )
    lName: string;

    @ViewColumn(
        {
            name: 'user_enabled',
        }
    )
    userEnabled: boolean;

}