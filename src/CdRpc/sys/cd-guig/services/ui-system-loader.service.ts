import { Request, Response } from "express";
import { LoggerService } from "../../../utils/logger.service";
import { IShellConfig } from "../../base";
import { UiSystemDescriptor } from "../../dev-descriptor/models/ui-system-descriptor.model";
import { UiConfig } from "../../moduleman/models/config.model";
import { MenuItem } from "../../moduleman/models/menu.model";
import { ConfigService } from "../../moduleman/services/config.service";
import { MenuService } from "../../moduleman/services/menu.service";
import { SysCacheService } from "../../moduleman/services/sys-cache.service";
import { ITheme } from "../../theme/models/themes.model";
import { diag_css, diag_sidebar } from "../../utils/diagnosis";
import { DEFAULT_SYSTEM } from "../models/ui-system-adaptor.model";
import { UiSystemAdapterRegistry } from "./ui-system-registry.service";
import { UiThemeLoaderService } from "./ui-theme-loader.service";
import { UiThemeNormalizer } from "./ui-theme-normailizer.service";

/**
 * @class UiSystemLoaderService
 * @description
 * Centralized runtime manager for UI systems (Material, Bootstrap, etc.)
 * Handles discovery, loading, caching, activation, and theme switching.
 *
 * Expected directory structure:
 * public/assets/ui-systems/
 * ├── material/
 * │   ├── descriptor.json
 * │   ├── css/
 * │   ├── js/
 * │   └── templates/
 * ├── bootstrap/
 * │   ├── descriptor.json
 * │   └── ...
 *
 * Each `descriptor.json` must comply with `UiSystemDescriptor` format.
 */

export class UiSystemLoaderService {
  private logger = new LoggerService();
  private static instance: UiSystemLoaderService | null = null;
  private activeSystem: UiSystemDescriptor | null = null;
  private sysCache!: SysCacheService;
  splashAnimDone = false;
  appReady = false;
  uiReady = false;
  private uiMutationTimer: number | null = null;

  constructor(sysCache: SysCacheService) {
    this.sysCache = sysCache;
  }

  public static getInstance(sysCache?: SysCacheService): UiSystemLoaderService {
    if (!UiSystemLoaderService.instance) {
      if (!sysCache)
        throw new Error(
          "UiSystemLoaderService.getInstance requires SysCacheService on first call."
        );
      UiSystemLoaderService.instance = new UiSystemLoaderService(sysCache);
    }
    return UiSystemLoaderService.instance;
  }

  async fetchAvailableSystems(
    uiConfig: UiConfig
  ): Promise<UiSystemDescriptor[]> {
    const baseFolder =
      uiConfig.uiSystemBasePath || "/public/assets/ui-systems/";

    const systemIds = UiSystemAdapterRegistry.list();
    console.log("[UiSystemLoaderService] Registered UI Systems:", systemIds);

    const descriptors: UiSystemDescriptor[] = [];

    for (const id of systemIds) {
      const descriptorUrl = `${baseFolder}${id}/descriptor.json`;

      try {
        console.log(
          `[UiSystemLoaderService] Loading descriptor: ${descriptorUrl}`
        );

        const res = await fetch(descriptorUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();

        // Build absolute path prefix
        const prefix = `${baseFolder}${id}/`;

        descriptors.push({
          ...json,

          // ensure id (in case descriptor uses a different internal id)
          id,

          // Expand asset URLs
          cssUrl: json.cssUrl ? prefix + json.cssUrl : undefined,
          jsUrl: json.jsUrl ? prefix + json.jsUrl : undefined,

          stylesheets: (json.stylesheets || []).map(
            (file: string) => prefix + file
          ),

          scripts: (json.scripts || []).map((file: string) => prefix + file),

          // keep themes as-is, they already define absolute paths typically
          themesAvailable: json.themesAvailable || [],
          themeActive: json.themeActive || null,

          conceptMappings: json.conceptMappings || {},
          directiveMap: json.directiveMap || {},
        });
      } catch (err) {
        console.warn(
          `[UiSystemLoaderService] Failed to load ${descriptorUrl}`,
          err
        );

        // fallback minimal descriptor (bootstrap-538 had wrong mappings before)
        const prefix = `${baseFolder}${id}/`;

        descriptors.push({
          id,
          name: id,
          version: "unknown",

          cssUrl: `${prefix}${id}.min.css`,
          jsUrl: `${prefix}${id}.min.js`,

          stylesheets: [],
          scripts: [],
          conceptMappings: {},
          themesAvailable: [],
          themeActive: null,
        });
      }
    }

    return descriptors;
  }

  list(): UiSystemDescriptor[] {
    return this.sysCache.get("uiSystems") || [];
  }

  getSystemById(id: string): UiSystemDescriptor | undefined {
    const available = this.sysCache.get("uiSystems") || [];
    return available.find((s: any) => s.id === id);
  }

  public async activate(id: string): Promise<void> {
    diag_css("[UiSystemLoaderService.activate] START", { id });

    await this.sysCache.ensureReady();

    if (!id) {
      const auto = (this as any).detectUiSystem?.();
      if (auto?.id) id = auto.id;
    }

    // 🔥 FIXED: USE FULL DESCRIPTOR
    const descriptorFromCache = this.getFullDescriptor(id);

    console.log(
      "[UiSystemLoaderService.activate] descriptorFromCache:",
      descriptorFromCache
    );

    const fallbackDescriptor: any = {
      id,
      cssUrl: `/assets/ui-systems/${id}/${id}.min.css`,
      jsUrl: `/assets/ui-systems/${id}/${id}.min.js`,
      assetPath: `/assets/ui-systems/${id}`,
      stylesheets: [],
      scripts: [],
      conceptMappings: {}, // included for safety
      directiveMap: {},
      metadata: {},
      extensions: {},
    };

    const descriptor = descriptorFromCache || fallbackDescriptor;
    this.activeSystem = descriptor;

    const adapter = UiSystemAdapterRegistry.get(id);

    adapter.setMeta({
      id: descriptor.id,
      name: descriptor.name,
      version: descriptor.version,
      status: descriptor.deprecated ? "MARKED_FOR_DEPRECATION" : "ACTIVE",
    });

    // Expose runtime descriptor (adapters/services read this)
    try {
      (window as any).CdActiveUiDescriptor = descriptor;
      (window as any).CD_ACTIVE_UISYSTEM = id;
      (window as any).CdShellActiveUiSystem = id;
    } catch (err) {
      console.warn(
        "[UiSystemLoaderService.activate] Could not set global descriptor",
        err
      );
    }

    // 3) Remove previous ui-system assets
    document
      .querySelectorAll("link[data-cd-uisystem], script[data-cd-uisystem]")
      .forEach((el) => el.remove());
    diag_css("[UiSystemLoaderService.activate] REMOVED OLD SYSTEM ASSETS", {});

    // 4) Resolve paths
    const cssPath =
      descriptor.cssUrl ||
      `${descriptor.assetPath || `/assets/ui-systems/${id}`}/bootstrap.min.css`;
    const jsPath =
      descriptor.jsUrl ||
      `${descriptor.assetPath || `/assets/ui-systems/${id}`}/${id}.min.js`;
    const bridgeCssPath = `${descriptor.assetPath || `/assets/ui-systems/${id}`}/bridge.css`;

    diag_css("[UiSystemLoaderService.activate] RESOLVED PATHS", {
      cssPath,
      jsPath,
      bridgeCssPath,
    });

    // 5) Load main CSS
    try {
      await this.loadCSS(cssPath, id);
      diag_css("[UiSystemLoaderService.activate] CSS LOADED", { cssPath });
    } catch (err) {
      diag_css("[UiSystemLoaderService.activate] CSS LOAD FAILED", {
        cssPath,
        err,
      });
    }

    // 6) Load optional bridge.css (non-fatal)
    try {
      await this.loadCSS(bridgeCssPath, `${id}-bridge`);
      diag_css("[UiSystemLoaderService.activate] BRIDGE CSS LOADED", {
        bridgeCssPath,
      });
    } catch (err) {
      console.log(
        `[UiSystemLoaderService.activate] bridge.css not found for ${id} (optional)`
      );
      diag_css("[UiSystemLoaderService.activate] BRIDGE CSS LOAD FAILED", {
        bridgeCssPath,
        err,
      });
    }

    // 7) Load system JS (optional)
    try {
      await this.loadScript(jsPath, id);
      diag_css("[UiSystemLoaderService.activate] SCRIPT LOADED", { jsPath });
    } catch (err) {
      console.warn("[UiSystemLoaderService.activate] script load failed", err);
      diag_css("[UiSystemLoaderService.activate] SCRIPT LOAD FAILED", {
        jsPath,
        err,
      });
    }

    // 8) Tell the in-app adapter (registered via UiSystemAdapterRegistry) to activate
    try {
      // UiSystemAdapterRegistry should expose a `get(id)` (or similar) that returns a registered adapter instance
      const { UiSystemAdapterRegistry } = await import(
        "./ui-system-registry.service"
      );
      const adapter = UiSystemAdapterRegistry.get(id);

      if (adapter && typeof adapter.activate === "function") {
        await adapter.activate(descriptor);
        diag_css("[UiSystemLoaderService.activate] ADAPTER ACTIVATED", { id });
      } else {
        console.log(
          `[UiSystemLoaderService.activate] No in-app adapter registered for ${id} (skipping)`
        );
      }
    } catch (err) {
      console.warn(
        "[UiSystemLoaderService.activate] adapter activation failed",
        err
      );
    }

    // 9) Done
    diag_css("[UiSystemLoaderService.activate] COMPLETE", { activeSystem: id });
  }

  /**
   * applyTheme(systemId, themeId)
   * - find adapter for systemId, fetch theme descriptor via SysCacheService / UiThemeLoaderService
   * - call adapter.applyTheme(themeDescriptor)
   */
  public async applyTheme(systemId: string, themeId: string): Promise<void> {
    diag_css("[UiSystemLoaderService.applyTheme] start", { systemId, themeId });
    // const adapter = UiSystemAdapterFactory.getAdapter(systemId);
    const adapter = UiSystemAdapterRegistry.get(systemId);
    console.log(
      "[UiSystemLoaderService.applyTheme] adapter received:",
      adapter
    );
    if (!adapter) {
      console.warn(
        "[UiSystemLoaderService.applyTheme] no adapter for",
        systemId
      );
      return;
    }

    // get theme descriptor from cache
    const descriptors = this.sysCache.get("themeDescriptors") || [];
    console.log(
      "[UiSystemLoaderService][applyTheme] descriptors:",
      descriptors
    );
    const themeDescriptor = descriptors.find((d: any) => d.id === themeId);
    console.log(
      "[UiSystemLoaderService][applyTheme] descriptors:",
      themeDescriptor
    );

    // supply descriptor if found, else just themeId
    await adapter.applyTheme(themeDescriptor || themeId);
    diag_css("[UiSystemLoaderService.applyTheme] done", { systemId, themeId });
  }

  public async loadCSS(path: string, id: string): Promise<string> {
    diag_css("[UiSystemLoaderService.loadCSS] REQUEST", { path, id });

    return new Promise((resolve, reject) => {
      try {
        const head = document.head || document.getElementsByTagName("head")[0];
        if (!head) return reject(new Error("document.head missing"));

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = path;
        link.setAttribute("data-cd-uisystem", id);
        link.setAttribute("data-cd-origin", "ui-system");

        link.onload = () => {
          const resolved = (link as HTMLLinkElement).href;
          diag_css("[UiSystemLoaderService.loadCSS] LOADED", {
            path,
            id,
            resolved,
            order: Array.from(head.querySelectorAll("link")).map(
              (l) => (l as HTMLLinkElement).href
            ),
          });
          resolve(resolved);
        };

        link.onerror = (ev) => {
          diag_css("[UiSystemLoaderService.loadCSS] ERROR", { path, id, ev });
          reject(new Error(`Failed to load CSS: ${path}`));
        };

        head.insertAdjacentElement("beforeend", link);
      } catch (err) {
        diag_css("[UiSystemLoaderService.loadCSS] EXCEPTION", {
          path,
          id,
          err,
        });
        reject(err);
      }
    });
  }

  public async loadScript(path: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement("script");
        script.src = path;
        script.async = true;
        script.setAttribute("data-cd-uisystem", id);
        script.setAttribute("data-cd-origin", "ui-system");
        script.onload = () => resolve();
        script.onerror = (ev) => reject(ev);

        const body = document.body || document.getElementsByTagName("body")[0];
        if (!body) return reject(new Error("document.body missing"));
        body.appendChild(script);
      } catch (err) {
        reject(err);
      }
    });
  }

  getActive(): UiSystemDescriptor | null {
    console.log(`[UiSystemLoaderService][getActive] start.`);
    return this.activeSystem;
  }

  private detectFromRuntime(): string | null {
    return window.CdShellActiveUiSystem || window.CD_ACTIVE_UISYSTEM || null;
  }

  private detectFromMeta(): string | null {
    const meta = document.querySelector(
      'meta[name="cd-uiform"]'
    ) as HTMLMetaElement | null;

    return meta?.content || null;
  }

  public detectUiSystem(): UiSystemDescriptor {
    const runtimeId = this.detectFromRuntime();
    if (runtimeId) {
      return { ...DEFAULT_SYSTEM, id: runtimeId };
    }

    const metaId = this.detectFromMeta();
    if (metaId) {
      return { ...DEFAULT_SYSTEM, id: metaId };
    }

    return DEFAULT_SYSTEM;
  }

  private getFullDescriptor(id: string): UiSystemDescriptor | undefined {
    this.logger.debug("[UiSystemLoaderService.getFullDescriptor()] start");
    const list = this.sysCache.get("uiSystemDescriptors") || [];
    return list.find((d: any) => d.id === id);
  }

  async applyStartupUiSettings(svSysCache: SysCacheService): Promise<void> {
    this.logger.debug("[UiSystemLoaderService.applyStartupUiSettings()] start");

    // ------------------------------------------------------------------
    // 0) Ensure cache readiness
    // ------------------------------------------------------------------
    await svSysCache.ensureReady();

    const uiConfig = svSysCache.get("uiConfig") as UiConfig;
    if (!uiConfig) {
      this.logger.warn("[applyStartupUiSettings] uiConfig missing");
      return;
    }

    const systemId = uiConfig.defaultUiSystemId;
    const themeId = uiConfig.defaultThemeId;

    diag_css("[MAIN.applyStartupUiSettings] start", { systemId, themeId });

    const uiSystemLoader = UiSystemLoaderService.getInstance(svSysCache);
    const uiThemeLoader = UiThemeLoaderService.getInstance(svSysCache);

    // ------------------------------------------------------------------
    // 1) Activate UI system
    // ------------------------------------------------------------------
    try {
      await uiSystemLoader.activate(systemId);
      diag_css("[MAIN.applyStartupUiSettings] ui-system activated", {
        systemId,
      });
    } catch (err) {
      this.logger.error("[applyStartupUiSettings] activate failed", err);
      return;
    }

    // ------------------------------------------------------------------
    // 2) Structural shell CSS
    // ------------------------------------------------------------------
    try {
      await uiSystemLoader.loadCSS("/themes/common/base.css", "shell-base");
      await uiSystemLoader.loadCSS("/assets/css/index.css", "shell-index");
      diag_css("[MAIN.applyStartupUiSettings] shell CSS loaded");
    } catch (err) {
      this.logger.warn("[applyStartupUiSettings] shell CSS load failed", err);
    }

    // ------------------------------------------------------------------
    // 3) Load raw theme assets (CSS only)
    // ------------------------------------------------------------------
    try {
      await uiThemeLoader.loadThemeById(themeId);
      diag_css("[MAIN.applyStartupUiSettings] theme assets loaded", {
        themeId,
      });
    } catch (err) {
      this.logger.warn("[applyStartupUiSettings] theme load failed", err);
    }

    // ------------------------------------------------------------------
    // 4) 🔑 Normalize ONCE (new architecture)
    // ------------------------------------------------------------------
    const rawTheme = svSysCache.getThemeById(themeId);
    if (!rawTheme) {
      this.logger.warn(
        "[applyStartupUiSettings] theme descriptor missing",
        themeId
      );
    }

    const normalizedTheme = rawTheme
      ? UiThemeNormalizer.normalize(rawTheme, {
          uiSystemId: systemId,
          source: "static",
        })
      : null;

    // Cache normalized theme for downstream legacy use
    if (normalizedTheme) {
      svSysCache.set("theme:normalized", normalizedTheme, "runtime");
    }

    // ------------------------------------------------------------------
    // 5) Legacy-compatible applyTheme (TRANSITION POINT)
    // ------------------------------------------------------------------
    try {
      await uiSystemLoader.applyTheme(systemId, themeId);
      diag_css("[MAIN.applyStartupUiSettings] system applyTheme complete");
    } catch (err) {
      this.logger.warn("[applyStartupUiSettings] applyTheme failed", err);
    }

    diag_css("[MAIN.applyStartupUiSettings] done");
  }

  async showSplash(svConfig: ConfigService): Promise<void> {
    return new Promise(async (resolve) => {
      const splash = document.getElementById("cd-splash");
      if (!splash) return resolve();

      const shellConfig = await svConfig.loadConfig();
      const path = shellConfig.splash?.path;
      const minDuration = shellConfig.splash?.minDuration ?? 3000;

      this.logger.debug("[Splash] loading", { path, minDuration });

      const html = await fetch(path).then((r: any) => r.text());
      splash.innerHTML = html;
      splash.style.display = "block";

      // Animation latch
      setTimeout(() => {
        this.logger.debug("[Splash] animation completed");
        this.splashAnimDone = true;
        this.tryHideSplash();
      }, minDuration);

      resolve();
    });
  }

  async tryHideSplash() {
    if (!this.splashAnimDone || !this.appReady) {
      this.logger.debug("[Splash] waiting", {
        splashAnimDone: this.splashAnimDone,
        appReady: this.appReady,
      });
      return;
    }

    this.logger.debug("[Splash] conditions met → hiding splash");
    await this.hideSplash();
  }

  async hideSplash(): Promise<void> {
    return new Promise<void>((resolve) => {
      const splash = document.getElementById("cd-splash");
      const root = document.getElementById("cd-root");

      if (!splash) return resolve();

      const container = splash.querySelector(
        "#splash-container"
      ) as HTMLElement;
      container?.classList.add("fade-out");

      setTimeout(() => {
        splash.remove();
        if (root) root.style.visibility = "visible";
        this.logger.debug("[Splash] removed, app revealed");
        resolve();
      }, 800);
    });
  }

  revealApp() {
    const root = document.getElementById("cd-root");
    if (root) {
      root.style.visibility = "visible";
    }
  }

  /////////////////////////////////////////
  // new decomposed methods go here
  /////////////////////////////////////////
  /**
   * STEP 3
   * Purpose:
   * Apply UI-System and Theme pipeline.
   *
   * IMPORTANT:
   * - This method is a PURE extraction.
   * - It must remain behavior-identical to the original inline code.
   * - Do not add logic here.
   */
  async bootstrapUiSystemAndTheme(svSysCache: SysCacheService): Promise<void> {
    this.logger.debug(
      "[UiSystemLoaderService.bootstrapUiSystemAndTheme()] start"
    );
    await this.applyStartupUiSettings(svSysCache);
    diag_css("UI-System + Theme applied");
  }

  /**
   * STEP 6
   * Purpose:
   * Render sidebar menu.
   *
   * CRITICAL:
   * - Must execute AFTER UI system + theme CSS
   * - Must execute BEFORE default controller load
   */
  async renderSidebar(
    svMenu: MenuService,
    preparedMenu: MenuItem[],
    shellConfig: IShellConfig
  ): Promise<void> {
    try {
      const resTheme = await fetch(shellConfig.themeConfig.currentThemePath);
      const theme = (await resTheme.json()) as ITheme;

      svMenu.renderMenuWithSystem(preparedMenu, theme);

      const sidebarEl = document.getElementById("cd-sidebar");
      if (
        sidebarEl &&
        (!sidebarEl.innerHTML || sidebarEl.innerHTML.trim() === "")
      ) {
        svMenu.renderPlainMenu(preparedMenu, "cd-sidebar");
      }

      diag_css("Sidebar rendered");
      diag_sidebar();
    } catch (err) {
      console.error("[Main] Failed rendering menu", err);
    }
  }

  /**
   * STEP 8
   * Purpose:
   * Wire up mobile sidebar UX (burger menu + overlay).
   *
   * Characteristics:
   * - DOM-only
   * - No async
   * - Safe to call once
   */
  setupMobileUx(): void {
    const burger = document.getElementById("cd-burger");
    const sidebar = document.getElementById("cd-sidebar");
    const overlay = document.getElementById("cd-overlay");

    if (!burger || !sidebar || !overlay) return;

    const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

    const applyMobileState = () => {
      if (!isMobile()) {
        sidebar.classList.remove("open");
        overlay.classList.add("hidden");
        burger.classList.remove("open");
      }
    };

    burger.addEventListener("click", () => {
      burger.classList.toggle("open");
      sidebar.classList.toggle("open");
      overlay.classList.toggle("hidden");
    });

    overlay.addEventListener("click", () => {
      burger.classList.remove("open");
      sidebar.classList.remove("open");
      overlay.classList.add("hidden");
    });

    window.addEventListener("resize", applyMobileState);
    applyMobileState();
  }

  notifyUiMutation() {
    if (this.uiMutationTimer) {
      clearTimeout(this.uiMutationTimer);
    }

    this.uiMutationTimer = window.setTimeout(() => {
      this.uiReady = true;
      this.tryReveal();
    }, 150); // 100–200ms works well
  }

  tryReveal() {
    if (this.appReady && this.uiReady) {
      this.hideSplash();
      this.revealApp();
    }
  }
}
