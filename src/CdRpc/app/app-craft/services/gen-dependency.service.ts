
import { DevModeAction } from '../../../sys/dev-mode/index.js';
// import { GenDependencyService } from '../services/gen-dependency.service';
import {
  AppType,
  CdCtx,
  CdModelDescriptor,
  CdModuleDescriptor,
  CdServiceDescriptor,
  DependencyDescriptor,
} from '../../../sys/dev-descriptor/index.js';
import { CdFxReturn } from '../../../sys/base/i-base';
import { BaseService } from '../../../sys/base/base.service';
import { ComponentType } from '../../../sys/dev-descriptor/models/component-descriptor.model.js';

export class GenDependencyService {
  b = new BaseService();
  constructor() {}

  /**
   * Entrypoint: reset & rebuild all dependencies
   */
  async rebuildDependencies(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    this.b.logWithContext(this, 'rebuildDependencies:start', { action, moduleData });

    // 0. reset all
    this.resetAllDependencies(moduleData);

    // 1. controllers (Controller + ControllerType)
    this.applyControllerDeps(moduleData);

    // 2. services (Service + ServiceType)
    this.applyServiceDeps(moduleData);

    // 3. models (Model + ModelType)
    this.applyModelDeps(moduleData);

    this.b.logWithContext(this, 'rebuildDependencies:end', { moduleData });
    return { state: true, data: null };
  }

  /**
   * Reset all dependencies in all component types
   */
  private resetAllDependencies(moduleData: CdModuleDescriptor) {
    for (const controller of moduleData.controllers || []) {
      controller.dependencies = [];
    }
    for (const service of moduleData.services || []) {
      service.dependencies = [];
    }
    for (const model of moduleData.models || []) {
      model.dependencies = [];
    }
  }

  // =============================
  // CONTROLLER CASES (1 & 2)
  // =============================
  private applyControllerDeps(moduleData: CdModuleDescriptor) {
    for (const controller of moduleData.controllers || []) {
      if (
        controller.type === ComponentType.Controller ||
        controller.type === ComponentType.ControllerType
      ) {
        controller.dependencies?.push(this.buildBaseServiceDependency());

        for (const service of moduleData.services || []) {
          if (
            service.type === ComponentType.Service ||
            service.type === ComponentType.ServiceType
          ) {
            controller.dependencies?.push(this.buildServiceDependency(service));
          }
        }
      }
    }
  }

  // =============================
  // SERVICE CASES (3 & 4)
  // =============================
  private applyServiceDeps(moduleData: CdModuleDescriptor) {
    for (const service of moduleData.services || []) {
      if (service.type === ComponentType.Service || service.type === ComponentType.ServiceType) {
        // services depend on BaseService
        service.dependencies?.push(this.buildBaseServiceDependency());

        // services may depend on models
        for (const model of moduleData.models || []) {
          if (model.type === ComponentType.Model || model.type === ComponentType.ModelType) {
            service.dependencies?.push(this.buildModelDependency(model));
          }
        }
      }
    }
  }

  // =============================
  // MODEL CASES (5 & 6)
  // =============================
  private applyModelDeps(moduleData: CdModuleDescriptor) {
    for (const model of moduleData.models || []) {
      if (model.type === ComponentType.Model || model.type === ComponentType.ModelType) {
        // models always depend on BaseService
        model.dependencies?.push(this.buildBaseServiceDependency());
      }
    }
  }

  // =============================
  // BUILDERS
  // =============================

  private buildBaseServiceDependency(): DependencyDescriptor {
    return {
      name: 'BaseService',
      category: 'core',
      source: 'local',
      scope: 'module',
      targetApp: AppType.CdApi,
      isCdModule: true,
      cdCtx: CdCtx.Sys,
      resolution: {
        method: 'import',
        path: '../../../sys/base/base.service',
      },
      usage: { usageContext: 'core', classesUsed: ['BaseService'] },
    };
  }

  private buildServiceDependency(service: CdServiceDescriptor): DependencyDescriptor {
    return {
      name: service.name,
      category: 'custom',
      source: 'local',
      scope: 'module',
      targetApp: AppType.CdApi,
      isCdModule: true,
      cdCtx: CdCtx.App,
      resolution: {
        method: 'import',
        path: `../services/${service.fileName ?? service.name}.service`,
      },
      usage: {
        usageContext: 'controller',
        classesUsed: [service.name],
      },
    };
  }

  private buildModelDependency(model: CdModelDescriptor): DependencyDescriptor {
    return {
      name: model.name,
      category: 'custom',
      source: 'local',
      scope: 'module',
      targetApp: AppType.CdApi,
      isCdModule: true,
      cdCtx: CdCtx.App,
      resolution: {
        method: 'import',
        path: `../models/${model.fileName ?? model.name}.model`,
      },
      usage: {
        usageContext: 'service',
        classesUsed: [model.name],
      },
    };
  }

  // 1. Controller (ComponentType.Controller)
  async genDependencyForModule(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    // return this.genDependencyService.generateControllerImports(action, moduleData, ComponentType.Controller);
    return {
      state: false,
      data: null,
    };
  }

  // 2. ControllerType
  async genDependencyForControllerType(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    // return this.genDependencyService.generateControllerImports(action, moduleData, ComponentType.ControllerType);
    return {
      state: false,
      data: null,
    };
  }

  // 3. Service (ComponentType.Service)
  async genDependencyForService(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    // return this.genDependencyService.generateServiceImports(action, moduleData, ComponentType.Service);
    return {
      state: false,
      data: null,
    };
  }

  // 4. ServiceType
  async genDependencyForServiceType(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    // return this.genDependencyService.generateServiceImports(action, moduleData, ComponentType.ServiceType);
    return {
      state: false,
      data: null,
    };
  }

  // 5. Model (ComponentType.Model)
  async genDependencyForModel(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    // return this.genDependencyService.generateModelImports(action, moduleData, ComponentType.Model);
    return {
      state: false,
      data: null,
    };
  }

  // 6. ModelType
  async genDependencyForModelType(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    // return this.genDependencyService.generateModelImports(action, moduleData, ComponentType.ModelType);
    return {
      state: false,
      data: null,
    };
  }

  // 7. Method-level dependency automation (future expansion)
  async genDependencyForMethodLevel(
    action: DevModeAction,
    moduleData: CdModuleDescriptor,
  ): Promise<CdFxReturn<null>> {
    // Stub → real logic to come from descriptors (rfc-0005 aligned)
    // return this.genDependencyService.generateMethodImports(action, moduleData);
    return {
      state: false,
      data: null,
    };
  }
}
