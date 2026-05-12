// import { UiSystemDescriptor } from "../../dev-descriptor/models/ui-system-descriptor.model";
// import { ConfigService } from "../../moduleman/services/config.service";
// import { SysCacheService } from "../../moduleman/services/sys-cache.service";
// import { IUiSystemAdapter } from "../models/ui-system-adaptor.model";
// import { UiThemeLoaderService } from "./ui-theme-loader.service";

// export class MaterialAdapter implements IUiSystemAdapter {
//   private descriptor?: UiSystemDescriptor;
//   private themeChangeHandler: ((e: Event) => void) | null = null;
//   private activated = false;

//   async activate(descriptor: UiSystemDescriptor): Promise<void> {
//     if (this.activated) return;
//     this.activated = true;
//     this.descriptor = descriptor;

//     // Listen for app-level theme change events and apply theme when they occur.
//     this.themeChangeHandler = (e: Event) => {
//       // support CustomEvent with detail.themeId or detail being the string
//       const ce = e as CustomEvent;
//       const themeId = ce?.detail?.themeId ?? ce?.detail;
//       if (typeof themeId === "string") {
//         // fire-and-forget; applyTheme is async
//         this.applyTheme(themeId).catch(() => {
//           /* swallow errors to avoid unhandled rejections from event handler */
//         });
//       }
//     };
//     window.addEventListener("cd-theme-change", this.themeChangeHandler);

//     // Try to apply an initial theme from descriptor if present
//     const maybeTheme =
//       (descriptor as any)?.themeId ??
//       (descriptor as any)?.properties?.themeId ??
//       (descriptor as any)?.metadata?.themeId;
//     if (typeof maybeTheme === "string") {
//       try {
//         await this.applyTheme(maybeTheme);
//       } catch {
//         // ignore failures during startup
//       }
//     }
//   }

//   deactivate(): Promise<void> {
//     throw new Error("Method not implemented.");
//   }

//   async applyTheme(themeId: string) {
//     const svConfig = ConfigService.getInstance();
//     const svSysCache = SysCacheService.getInstance(svConfig);
//     const svThemeLoader = UiThemeLoaderService.getInstance(svSysCache);
//     const theme = await svThemeLoader.getThemeDescriptor(themeId);

//     if (theme.mode === "dark") {
//       document.documentElement.classList.add("md-dark");
//     } else {
//       document.documentElement.classList.remove("md-dark");
//     }
//   }
// }
