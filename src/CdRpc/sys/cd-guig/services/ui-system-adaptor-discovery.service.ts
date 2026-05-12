import { Request, Response } from "express";
import { LoggerService } from "../../../utils/logger.service";
import { isUiAdapterConstructor } from "../models/ui-system-adaptor.model";
import { BaseUiAdapter } from "./base-ui-adapter.service";
import { UiAdapterValidatorService } from "./ui-adaptor-validator.service";
import { UiSystemAdapterRegistry } from "./ui-system-registry.service";

export class UiSystemAdapterDiscoveryService {
  static logger = new LoggerService();

  static discoverAndRegister(): void {
    const validator = new UiAdapterValidatorService();

    // 1. Use a relative path (assuming this service is in ui-adaptor-port/services or nearby)
    // 2. Fix the casing to match your file names (*-adapter.service.ts)
    const modules = import.meta.glob(
      "../../../app/ui-adaptor-port/services/**/*-adapter.service.ts",
      { eager: true }
    );

    this.logger.debug("[UiAdapterDiscovery] Raw Modules found:", modules);

    const paths = Object.keys(modules);

    if (!paths.length) {
      // Diagnostic log to help you fix the path
      this.logger.error(
        "Glob failed. Current directory hint:",
        import.meta.url
      );
      throw new Error(
        "[BOOT] No UI adapters discovered. Check glob path casing and relative depth."
      );
    }

    for (const path of paths) {
      const mod = modules[path] as any;

      // Handle both 'export default class' and 'export class'
      const AdapterClass = mod?.default || mod[Object.keys(mod)[0]];

      if (!AdapterClass || typeof AdapterClass !== "function") {
        this.logger.warn("Module found but no valid class export detected", {
          path,
        });
        continue;
      }

      try {
        const instance = new AdapterClass();

        // Ensure the instance has the required methods before registering
        if (typeof instance.getMeta !== "function") {
          this.logger.warn("Adapter instance missing getMeta()", { path });
          continue;
        }

        const meta = instance.getMeta();
        validator.assertValid(instance);

        UiSystemAdapterRegistry.register(meta.id, instance);

        this.logger.info("UI adapter registered", {
          id: meta.id,
          version: meta.version,
          path: path,
        });
      } catch (err) {
        this.logger.error("Failed to instantiate adapter", {
          path,
          error: err,
        });
      }
    }
  }

  private static tryRegister(candidate: unknown, source: string) {
    if (!isUiAdapterConstructor(candidate)) {
      return;
    }

    try {
      const instance = new candidate();

      // Phase-safe validation before registration
      if (!this.validate(instance)) {
        console.warn(
          "[UiAdapterDiscovery] Invalid adapter skipped:",
          source,
          instance
        );
        return;
      }

      const meta = instance.getMeta();

      UiSystemAdapterRegistry.register(meta.id, instance);

      console.info(
        "[UiAdapterDiscovery] Registered adapter:",
        meta.id,
        meta.version
      );
    } catch (err) {
      console.error(
        "[UiAdapterDiscovery] Failed to register adapter:",
        source,
        err
      );
    }
  }

  private static validate(adapter: BaseUiAdapter): boolean {
    const meta = adapter.getMeta();
    return !!meta?.id && !!meta?.version && !!adapter.getCapabilities();
  }
}
