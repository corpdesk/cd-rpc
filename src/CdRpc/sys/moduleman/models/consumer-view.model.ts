import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    name: 'consumer_view',
    synchronize: false,
    expression: `
    SELECT
        consumer.consumer_id AS consumer_id,
        consumer.consumer_name AS consumer_name,
        consumer.consumer_guid AS consumer_guid,
        consumer.doc_id AS doc_id,
        consumer.company_id AS company_id,
        consumer.consumer_enabled AS consumer_enabled,
        company.company_guid AS company_guid,
        company.company_name AS company_name
    FROM
        (company
    JOIN consumer on
        ((convert(company.company_guid
            using utf8mb4) = consumer.company_guid)));
    `
})

export class ConsumerViewModel {
    @ViewColumn(
        {
            name: 'consumer_id'
        }
    )
    consumerId: number;

    @ViewColumn(
        {
            name: 'consumer_guid'
        }
    )
    consumerGuid: number;

    @ViewColumn(
        {
            name: 'consumer_name'
        }
    )
    consumerName: string;

    @ViewColumn(
        {
            name: 'consumer_enabled'
        }
    )
    consumerEnabled: boolean | number | null;

    @ViewColumn(
        {
            name: 'doc_id'
        }
    )
    docId: number;

    @ViewColumn(
        {
            name: 'company_name'
        }
    )
    companyName: string;

    @ViewColumn(
        {
            name: 'company_id'
        }
    )
    companyId: string;


    @ViewColumn(
        {
            name: 'company_guid'
        }
    )
    companyGuid: string;

}