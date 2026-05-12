// import { UiSystemDescriptor } from "../../dev-descriptor/models/ui-system-descriptor.model";
// import { IUiSystemAdapter } from "../models/ui-system-adaptor.model";

// /**
//  * Bootstrap502Adapter: sets data-bs-theme on <html> for Bootstrap v5.0.2
//  */
// export class Bootstrap502Adapter implements IUiSystemAdapter {
//   async activate(descriptor: UiSystemDescriptor): Promise<void> {
//     console.log(
//       `[${this.constructor.name}] activate() descriptor.id =`,
//       descriptor?.id
//     );
//     console.log(
//       `[${this.constructor.name}] activate() descriptor.version =`,
//       descriptor?.version
//     );
//     return;
//   }

//   async deactivate(): Promise<void> {
//     document.documentElement.removeAttribute("data-bs-theme");
//   }

//   async applyTheme(themeDescriptorOrId: any): Promise<void> {
//     try {
//       if (!themeDescriptorOrId) return;

//       let mode: string | undefined;

//       if (typeof themeDescriptorOrId === "string") {
//         mode = themeDescriptorOrId === "dark" ? "dark" : "light";
//       } else if (typeof themeDescriptorOrId === "object") {
//         mode =
//           themeDescriptorOrId.mode ||
//           (themeDescriptorOrId.id === "dark" ? "dark" : "light");
//       }

//       document.documentElement.setAttribute(
//         "data-bs-theme",
//         mode === "dark" ? "dark" : "light"
//       );

//       console.log("[Bootstrap502Adapter] applied bs-theme:", mode);
//     } catch (err) {
//       console.warn("[Bootstrap502Adapter] applyTheme error", err);
//     }
//   }
// }

// /**
//  * Bootstrap538Adapter — supports Bootstrap 5.3.8 with official dark-mode variables
//  * Dark mode works natively using the <html data-bs-theme="dark">
//  */
// export class Bootstrap538Adapter implements IUiSystemAdapter {
//   async activate(descriptor: UiSystemDescriptor): Promise<void> {
//     // No-op: CSS/JS already injected by UiSystemLoaderService
//     console.log(
//       `[${this.constructor.name}] activate() descriptor.id =`,
//       descriptor?.id
//     );
//     console.log(
//       `[${this.constructor.name}] activate() descriptor.version =`,
//       descriptor?.version
//     );
//     return;
//   }

//   async deactivate(): Promise<void> {
//     document.documentElement.removeAttribute("data-bs-theme");
//   }

//   async applyTheme(themeDescriptorOrId: any): Promise<void> {
//     console.log('[Bootstrap538Adapter][applyTheme] start')
//     console.log('[Bootstrap538Adapter][applyTheme] themeDescriptorOrId:', themeDescriptorOrId)
//     try {
//       if (!themeDescriptorOrId) return;

//       let mode: string | undefined;

//       if (typeof themeDescriptorOrId === "string") {
//         mode = themeDescriptorOrId === "dark" ? "dark" : "light";
//       } else if (typeof themeDescriptorOrId === "object") {
//         mode =
//           themeDescriptorOrId.mode ||
//           (themeDescriptorOrId.id === "dark" ? "dark" : "light");
//       }

//       // Bootstrap 5.3.x controls dark mode via:
//       // <html data-bs-theme="dark">
//       document.documentElement.setAttribute(
//         "data-bs-theme",
//         mode === "dark" ? "dark" : "light"
//       );

//       console.log("[Bootstrap538Adapter] applied bs-theme:", mode);
//     } catch (err) {
//       console.warn("[Bootstrap538Adapter] applyTheme error", err);
//     }
//   }
// }

// /**
//  * MaterialAdapter — applies Material Design theme logic
//  */
// export class MaterialAdapter implements IUiSystemAdapter {
//   async activate(descriptor: UiSystemDescriptor): Promise<void> {
//     console.log(
//       `[${this.constructor.name}] activate() descriptor.id =`,
//       descriptor?.id
//     );
//     console.log(
//       `[${this.constructor.name}] activate() descriptor.version =`,
//       descriptor?.version
//     );
//     return;
//   }

//   async deactivate(): Promise<void> {
//     document.documentElement.removeAttribute("data-md-theme");
//   }

//   async applyTheme(themeDescriptorOrId: any): Promise<void> {
//     if (!themeDescriptorOrId) return;

//     const mode =
//       typeof themeDescriptorOrId === "string"
//         ? themeDescriptorOrId
//         : themeDescriptorOrId.mode;

//     if (mode === "dark") {
//       document.documentElement.classList.add("md-dark");
//       document.documentElement.classList.remove("md-light");
//     } else {
//       document.documentElement.classList.remove("md-dark");
//       document.documentElement.classList.add("md-light");
//     }

//     console.log("[MaterialAdapter] applyTheme:", mode);
//   }
// }

// /**
//  * Factory for UI system adapters
//  */
// export class UiSystemAdapterFactory {
//   public static getAdapter(systemId: string): IUiSystemAdapter | null {
//     console.group("[UiSystemAdapterFactory] Adapter Lookup");
//     console.log("Requested systemId:", JSON.stringify(systemId));

//     let adapter: IUiSystemAdapter | null = null;

//     switch (systemId) {
//       case "bootstrap-502":
//         adapter = new Bootstrap502Adapter();
//         break;

//       case "bootstrap-538":
//         adapter = new Bootstrap538Adapter();
//         break;

//       case "material":
//       case "material-design":
//         adapter = new MaterialAdapter();
//         break;

//       default:
//         console.warn(
//           "[UiSystemAdapterFactory] ❌ Unknown systemId — returning null"
//         );
//         console.groupEnd();
//         return null;
//     }

//     console.log("Resolved adapter instance:", adapter?.constructor.name);
//     console.groupEnd();
//     return adapter;
//   }
// }
