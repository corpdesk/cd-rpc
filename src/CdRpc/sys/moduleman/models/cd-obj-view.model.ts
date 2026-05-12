import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    name: 'cd_obj_view',
    synchronize: false,
    expression: `
        select
            cd_obj.cd_obj_id AS cd_obj_id,
            cd_obj.cd_obj_guid AS cd_obj_guid,
            cd_obj.cd_obj_name AS cd_obj_name,
            cd_obj.cd_obj_type_guid AS cd_obj_type_guid,
            cd_obj.last_sync_date AS last_sync_date,W
            cd_obj.last_modification_date AS last_modification_date,
            cd_obj.parent_module_guid AS parent_module_guid,
            cd_obj.parent_class_guid AS parent_class_guid,
            cd_obj.parent_obj AS parent_obj,
            cd_obj.cd_obj_disp_name AS cd_obj_disp_name,
            cd_obj.cd_obj_enabled AS cd_obj_enabled,
            cd_obj_type.cd_obj_type_id AS cd_obj_type_id,
            cd_obj_type.cd_obj_type_name AS cd_obj_type_name,
            module.module_name AS module_name,
            cd_obj.show_name AS show_name,
            cd_obj.icon AS icon,
            cd_obj.show_icon AS show_icon,
            cd_obj.curr_val AS curr_val'
        from
            ((cd_obj_type
        join cd_obj on
            (('cd_obj_type.cd_obj_type_guid = cd_obj.cd_obj_type_guid)))
        join module on
            (('module.module_guid' = cd_obj.parent_module_guid)));
    `
})

export class CdObjViewModel {
    @ViewColumn(
        {
            name: 'cd_obj_id'
        }
    )
    cdObjId: number;

    @ViewColumn(
        {
            name: 'cd_obj_guid'
        }
    )
    cdObjGuid?: string;

    @ViewColumn(
        {
            name: 'cd_obj_name'
        }
    )
    cdObjName?: string;

    @ViewColumn(
        {
            name: 'cd_obj_type_guid'
        }
    )
    cdObjTypeGuid?: string;

    @ViewColumn(
        {
            name: 'last_sync_date'
        }
    )
    lastSyncDate?: string;

    @ViewColumn(
        {
            name: 'last_modification_date'
        }
    )
    lastModificationDate?: string;

    @ViewColumn(
        {
            name: 'parent_module_guid'
        }
    )
    parentModuleGuid?: string;

    @ViewColumn(
        {
            name: 'parent_class_guid'
        }
    )
    parentClassGuid?: string;

    @ViewColumn(
        {
            name: 'parent_obj'
        }
    )
    parentObj?: string;

    @ViewColumn(
        {
            name: 'cd_obj_disp_name'
        }
    )
    cdObjDispName?: string;

    @ViewColumn(
        {
            name: 'cd_obj_type_id'
        }
    )
    cdObjTypeId?: number;

    @ViewColumn(
        {
            name: 'cd_obj_type_name'
        }
    )
    cdObjTypeName?: string;

    @ViewColumn(
        {
            name: 'module_name'
        }
    )
    moduleName?: string;

    @ViewColumn(
        {
            name: 'show_name'
        }
    )
    showName?: boolean | number | null;

    @ViewColumn(
        {
            name: 'icon'
        }
    )
    icon?: string;

    @ViewColumn(
        {
            name: 'show_icon'
        }
    )
    showIcon?: boolean | number | null;

    @ViewColumn(
        {
            name: 'curr_val'
        }
    )
    currVal?: string;

    @ViewColumn(
        {
            name: 'cd_obj_enabled'
        }
    )
    cdObjEnabled ?: boolean | number | null;

}