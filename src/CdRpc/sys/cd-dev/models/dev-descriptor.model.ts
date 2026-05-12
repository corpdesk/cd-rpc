import { CdObjModel } from "../../moduleman/models/cd-obj.model";
import { safeStringify } from "../../utils/safe-stringify";

export interface TypeDescriptor {
  field: string;
  optional: boolean;
  typeDetails: TypeDetails;
  description: string;
}

export interface TypeDetails {
  cdObjId?: number; // reference to the type id in the cd_obj table
  isEnum?: boolean;
  isInterface?: boolean;
  isDescriptor?: boolean;
  isArray?: boolean;
  isPrimitive?: boolean;
}

export interface CdDescriptor {
  cdObjId: number;
  cdObjName: string;
  cdObjGuid?: string;
  jDetails?: TypeDescriptor[] | string; // allow string coversion for database entry
}

/**
 * Utility function to convert CdObjModel into CdDescriptor
 */
export function mapCdObjToDescriptor(cdObj: CdObjModel): CdDescriptor {
  return {
    cdObjId: cdObj.cdObjId!,
    cdObjName: cdObj.cdObjName,
    cdObjGuid: cdObj.cdObjGuid,
    jDetails: cdObj.jDetails
      ? (JSON.parse(cdObj.jDetails) as TypeDescriptor[])
      : undefined,
  };
}

/**
 * Utility function to convert CdDescriptor into CdObjModel
 */
export function mapDescriptorToCdObj(descriptor: CdDescriptor): CdObjModel {
  console.log("DevDescriptorModel::mapDescriptorToCdObj()/starting...");
  const cdObj = new CdObjModel();
  cdObj.cdObjId = descriptor.cdObjId;
  cdObj.cdObjName = descriptor.cdObjName;
  cdObj.cdObjGuid = descriptor.cdObjGuid;
  cdObj.jDetails = descriptor.jDetails
    ? JSON.stringify(descriptor.jDetails)
    : null;
  return cdObj;
}
