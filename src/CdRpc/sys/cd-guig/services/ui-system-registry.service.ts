import { Request, Response } from "express";
import { IUiSystemAdapter } from "../models/ui-system-adaptor.model";
import { UiSystemSchema } from "../models/ui-system-schema.model";
import { UiThemeLoaderService } from "./ui-theme-loader.service";

// export class UiSystemRegistryService {
//   private static systems: UiSystemSchema[] = [];
//   private static activeSystemId: string = "";
//   private static registry = new Map<string, IUiSystemAdapter>();

//   static register(system: UiSystemSchema): void {
//     this.systems.push(system);
//   }

//   static getActive(): UiSystemSchema | null {
//     return this.systems.find(s => s.id === this.activeSystemId) ?? null;
//   }

//   static list(): UiSystemSchema[] {
//     return [...this.systems];
//   }
// }

export class UiSystemAdapterRegistry {
  private static registry = new Map<string, IUiSystemAdapter>();

  static register(id: string, adapter: IUiSystemAdapter) {
    console.log("[UiSystemAdapterRegistry] register:", id, adapter);
    this.registry.set(id, adapter);
  }

  static get(id: string): IUiSystemAdapter | null {
    return this.registry.get(id) || null;
  }

  static list(): string[] {
    return Array.from(this.registry.keys());
  }
  
}
