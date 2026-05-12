import { Request, Response } from "express";
import { LoggerService } from "../../../utils/logger.service";
import { UiAdapterMeta } from "../models/ui-system-adaptor.model";

export class UiAdapterValidatorService {
  private logger = new LoggerService();

  assertValid(adapter: any): void {
    if (!adapter) {
      throw new Error("[UiAdapterValidator] Adapter instance is null");
    }

    this.assertMethod(adapter, "getMeta");
    this.assertMethod(adapter, "getCapabilities");
    this.assertMethod(adapter, "activate");

    const meta = adapter.getMeta();

    this.assertMeta(meta);

    this.logger.debug(
      "[UiAdapterValidator]",
      "Adapter validated successfully",
      meta
    );
  }

  private assertMethod(obj: any, name: string) {
    if (typeof obj[name] !== "function") {
      throw new Error(
        `[UiAdapterValidator] Missing required method: ${name}()`
      );
    }
  }

  private assertMeta(meta: UiAdapterMeta) {
    if (!meta.id || !meta.name || !meta.version) {
      throw new Error(
        "[UiAdapterValidator] Adapter meta is incomplete"
      );
    }
  }
}

