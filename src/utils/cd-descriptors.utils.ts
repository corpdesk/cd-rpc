// import { ComponentType } from "../dev-descriptor/models/component-descriptor.model";

import { ComponentType } from "../CdRpc/sys/dev-descriptor/models/component-descriptor.model";

export function isModelComponent(type: ComponentType): boolean {
  return [
    ComponentType.Model,
    ComponentType.ModelType,
    ComponentType.ModelView,
  ].includes(type);
}