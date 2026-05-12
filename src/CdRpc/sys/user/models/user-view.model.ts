import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity(
    {
        name: 'user_view',
        synchronize: false,
        expression: `
        select
            user.user_id AS user_id,
            user.user_guid AS user_guid,
            user.user_name AS user_name,
            user.password AS password,
            user.email AS email,
            user.doc_id AS doc_id,
            user.mobile AS mobile,
            user.gender AS gender,
            user.birth_date AS birth_date,
            user.postal_addr AS postal_addr,
            user.f_name AS f_name,
            user.m_name AS m_name,
            user.l_name AS l_name,
            user.national_id AS national_id,
            user.passport_id AS passport_id,
            user.user_enabled AS user_enabled,
            user.zip_code AS zip_code,
            user.activation_key AS activation_key,
            user.user_type_id AS user_type_id,
            (
            select
                sys_config.config_value'
            from
                sys_config'
            where
                (sys_config.sys_config_name'= active_company)
            limit 1) AS company_id
        from
            \`user\`;
    `
    })
export class UserViewModel {
    @ViewColumn(
        {
            name: 'user_id'
        }
    )
    userId: number;

    @ViewColumn(
        {
            name: 'user_guid'
        }
    )
    userGuid: string;

    @ViewColumn(
        {
            name: 'user_name'
        }
    )
    userName: number;

    @ViewColumn(
        {
            name: 'password'
        }
    )
    password: number;

    @ViewColumn(
        {
            name: 'email'
        }
    )
    email: number;

    @ViewColumn(
        {
            name: 'doc_id'
        }
    )
    docId: string;

    @ViewColumn(
        {
            name: 'mobile'
        }
    )
    mobile: string;
    //////////////////////////////
    @ViewColumn(
        {
            name: 'gender'
        }
    )
    gender: string;

    @ViewColumn(
        {
            name: 'birth_date'
        }
    )
    birthDate: string;

    @ViewColumn(
        {
            name: 'postal_addr'
        }
    )
    postalAddr: number;

    @ViewColumn(
        {
            name: 'f_name'
        }
    )
    fName: string;

    @ViewColumn(
        {
            name: 'm_name'
        }
    )
    mName: string;

    @ViewColumn(
        {
            name: 'l_name'
        }
    )
    lName: string;

    @ViewColumn(
        {
            name: 'user_profile'
        }
    )
    userProfile: number;

    @ViewColumn(
        {
            name: 'national_id'
        }
    )
    nationalId: string;

    @ViewColumn(
        {
            name: 'passport_id'
        }
    )
    passportId: number;

    @ViewColumn(
        {
            name: 'user_enabled'
        }
    )
    userEnabled: string;

    @ViewColumn(
        {
            name: 'zip_code'
        }
    )
    zipCode: number;

    @ViewColumn(
        {
            name: 'activation_key'
        }
    )
    activationKey: number;

    @ViewColumn(
        {
            name: 'user_type_id'
        }
    )
    userTypeId: number;

    @ViewColumn(
        {
            name: 'company_id'
        }
    )
    companyId: number;

    

}