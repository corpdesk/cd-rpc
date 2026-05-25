import type { FunctionDescriptor } from './function-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model';
import { ComponentDescriptor, ComponentType } from './component-descriptor.model';
import type { DependencyDescriptor } from './dependancy-descriptor.model';


export interface CdServiceDescriptor extends ComponentDescriptor {
  type: ComponentType.Service | ComponentType.ServiceType;
  parentController?: string; // Optional, if the service is associated with a specific controller
}
