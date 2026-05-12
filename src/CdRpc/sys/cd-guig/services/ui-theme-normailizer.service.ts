import { Request, Response } from "express";
import { LoggerService } from "../../../utils/logger.service";
import { UiThemeDescriptor } from "../../dev-descriptor/models/ui-theme-descriptor.model";

export class UiThemeNormalizer {
  private static logger = new LoggerService("UiThemeNormalizer");

  static normalize(
    raw: UiThemeDescriptor | any,
    options?: {
      uiSystemId?: string;
      source?: UiThemeDescriptor["meta"]["source"];
    }
  ): UiThemeDescriptor {
    if (!raw || typeof raw !== "object") {
      throw new Error("[UiThemeNormalizer] Invalid theme input");
    }

    const source = options?.source ?? "legacy";

    // ---- Merge legacy + new CSS definitions ----
    const cssPaths = new Set<string>();

    if (Array.isArray(raw.stylesheets)) {
      raw.stylesheets.forEach((p: string) => cssPaths.add(p));
    }

    if (raw.css?.paths) {
      raw.css.paths.forEach((p: string) => cssPaths.add(p));
    }

    const descriptor: UiThemeDescriptor = {
      ...raw,

      // ---- Normalize mode ----
      mode: raw.mode ?? "auto",

      // ---- Unified CSS descriptor ----
      css:
        cssPaths.size || raw.css?.inline
          ? {
              paths: cssPaths.size ? Array.from(cssPaths) : undefined,
              inline: raw.css?.inline,
            }
          : undefined,

      // ---- Runtime metadata ----
      meta: {
        source,
        uiSystem: options?.uiSystemId,
        version: raw.meta?.version,
        normalizedAt: Date.now(),
      },
    };

    this.logger.debug("Theme normalized", {
      id: descriptor.id,
      source,
      uiSystem: options?.uiSystemId,
    });

    return descriptor;
  }
}
