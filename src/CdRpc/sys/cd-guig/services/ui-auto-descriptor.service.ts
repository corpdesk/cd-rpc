// import { UiComponentDescriptor } from "../../dev-descriptor/models/ui-concept-descriptor.model";
import { Request, Response } from "express";
import { IUiSystemIntrospector } from "../models/ui-system-introspector.model";

export class UiAutoDescriptorService {
  constructor(private introspector: IUiSystemIntrospector) {}

  // async generateDescriptors(): Promise<UiComponentDescriptor[]> {
  //   const raw = await this.introspector.scanComponents();
  //   return raw.map(r => this.mapToUUD(r: any));
  // }

  // private mapToUUD(raw: RawUiComponentMeta): UiComponentDescriptor {
  //   return {
  //     id: raw.name,
  //     componentType: this.normalizeType(raw.type),
  //     label: raw.displayName,
  //     properties: raw.inputs?.map(i => ({ name: i.name, type: i.type })),
  //     events: raw.outputs?.map(o => ({ name: o.name })),
  //     systemId: this.introspector.systemId,
  //   };
  // }
}
