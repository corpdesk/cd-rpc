import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    BeforeUpdate,
    OneToMany
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
    validateOrReject,
} from 'class-validator';
import { BaseService } from '../../base/base.service';
import { DocModel } from './doc.model';
import { IQuery } from '../../base/i-base';
import { CompanyViewModel } from './company-view.model';


// export function siGet(q:IQuery){
//     return {
//         serviceModel: CompanyViewModel,
//         docName: 'CompanyModel::siGet',
//         cmd: {
//             action: 'find',
//             query: q
//         },
//         dSource: 1
//     }
// }

// SELECT company_id, company_type_id, directory_category_id, company_name, postal_address, phone, e_mail, website, physical_location, city, country, area_of_specialization, logo, fax, password, trusted, doc_id, city_id, county_id, company_guid, company_description, parent_id, consumer_id
// FROM cd1213.company;



@Entity(
    {
        name: 'company',
        synchronize: false
    }
)
// @CdModel
export class CompanyModel {

    @PrimaryGeneratedColumn(
        {
            name: 'company_id'
        }
    )
    companyId?: number;

    @Column({
        name: 'company_guid',
    })
    companyGuid!: string;

    @Column(
        {
            name: 'company_name',
        }
    )
    companyName!: string;

    @Column(
        {
            name: 'company_type_guid',
        }
    )
    companyTypeGuid?: string;

    @Column(
        {
            name: 'company_type_id',
        }
    )
    companyTypeId?: number;

    @Column(
        {
            name: 'directory_category_guid',
        }
    )
    directoryCategoryGuid!: string;

    @Column(
        'int',
        {
            name: 'doc_id',
        }
    )
    docId!: number;

    @Column(
        {
            name: 'company_enabled',
        }
    )
    companyEnabled?: boolean;

    @Column(
        {
            name: 'postal_address',
        }
    )
    postalAddress!: string;

    @Column(
        {
            name: 'phone',
        }
    )
    phone!: string;
    

    @Column(
        {
            name: 'mobile',
        }
    )
    mobile!: string;

    @Column(
        {
            name: 'email',
        }
    )
    email!: string;

    @Column(
        {
            name: 'physical_location',
        }
    )
    physicalLocation!: string;

    @Column(
        {
            name: 'city',
        }
    )
    city!: string;

    @Column(
        {
            name: 'country',
        }
    )
    country!: string;

    @Column(
        {
            name: 'logo',
        }
    )
    logo!: string;

    @Column(
        {
            name: 'city_guid',
        }
    )
    cityGuid!: string;

    @Column({
        name: 'company_description',
    })
    company_description?: string;

    @Column({
        name: 'parent_guid',
    })
    parentGuid?: string;

    @Column({
        name: 'consumer_guid',
    })
    consumerGuid?: string;

    @Column({
        name: 'search_tags',
    })
    searchTags!: string;
}
