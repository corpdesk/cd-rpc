// import { Request, Response } from "express";
// import { UiSystemDescriptor } from "../../dev-descriptor/models/ui-system-descriptor.model";
// import { IUiSystemAdapter } from "../models/ui-system-adaptor.model";
// import { UiThemeLoaderService } from "./ui-theme-loader.service";

// export class Bootstrap502Adapter implements IUiSystemAdapter {

//   async activate(descriptor: UiSystemDescriptor): Promise<void> {
//     // noop — activation already handled by UiSystemLoaderService
//     return;
//   }

//   async deactivate(): Promise<void> {
//     // Optionally remove data-bs-theme, or leave it
//     document.documentElement.removeAttribute("data-bs-theme");
//   }

//   async applyTheme(themeId: string): Promise<void> {
//     const themeLoader = UiThemeLoaderService.getInstance();
//     const theme = themeLoader.getThemeDescriptor(themeId);

//     // FireFox safe log
//     console.log("[BootstrapAdapter] Applying theme:", themeId, theme);

//     const html = document.documentElement;

//     if (theme.mode === "dark") {
//       html.setAttribute("data-bs-theme", "dark");
//     } else {
//       html.setAttribute("data-bs-theme", "light");
//     }
//   }
// }