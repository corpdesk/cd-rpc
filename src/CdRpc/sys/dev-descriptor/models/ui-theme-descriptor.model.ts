/**
 * @file ui-theme-descriptor.model.ts
 * @description
 * Represents metadata and configuration for a UI theme.
 */


// export interface UiThemeDescriptor {
//   /** Primary identifier */
//   id: string;

//   /** Human-readable label */
//   name: string;

//   /** Is default theme */
//   isDefault?: boolean;

//   /* ---------- Assets ---------- */

//   stylesheets?: string[];
//   scripts?: string[];

//   /* ---------- Styling ---------- */

//   /** CSS custom properties (without -- prefix) */
//   variables?: Record<string, string>;

//   /**
//    * Global classes to apply at root level.
//    * These should be treated as THEME-OWNED classes.
//    */
//   classes?: string[];

//   /**
//    * Optional namespace for theme-owned classes.
//    * Used to safely remove previous theme classes.
//    * Example: "theme-" or "bs-theme-"
//    */
//   classPrefix?: string;

//   /* ---------- Semantic Metadata ---------- */

//   metadata?: {
//     colorScheme?: Record<string, string>;
//     typography?: Record<string, string>;
//     spacing?: Record<string, string>;
//     animations?: Record<string, string>;
//   };

//   /* ---------- Governance ---------- */

//   author?: string;
//   license?: string;
//   repository?: string;

//   extensions?: Record<string, any>;
// }

/**
 * Canonical UI Theme Descriptor
 *
 * NOTE:
 * - This interface is intentionally backward-compatible.
 * - Legacy themes may populate only a subset of fields.
 * - New architecture components should prefer newer fields
 *   (mode, css, layout, meta) but MUST tolerate legacy ones.
 */

/**
 * MIGRATION NOTES:
 *
 * 1. stylesheets[] → css.paths[]
 *    - Normalizer will merge both
 *
 * 2. classes[] remains authoritative for DOM root
 *
 * 3. mode is OPTIONAL
 *    - Absence means legacy / auto
 *
 * 4. metadata is SEMANTIC, not imperative
 *    - Adapters may ignore unsupported keys
 *
 * 5. meta is RUNTIME-ONLY
 *    - Never store in JSON theme files
 */

export interface UiThemeDescriptor {
  /* ============================================================
   * Identity
   * ============================================================
   */

  /** Primary identifier */
  id: string;

  /** Human-readable label */
  name: string;

  /** Marks the default theme (legacy + supported) */
  isDefault?: boolean;

  /* ============================================================
   * Mode & System Awareness (NEW)
   * ============================================================
   */

  /**
   * Theme mode preference.
   * - auto: system / OS decides
   * - light | dark: explicit
   *
   * NOTE: Legacy themes may not define this.
   */
  mode?: "light" | "dark" | "auto";

  /* ============================================================
   * Assets (LEGACY + EXTENDED)
   * ============================================================
   */

  /**
   * Legacy flat stylesheet list.
   * Still supported.
   */
  stylesheets?: string[];

  /**
   * Legacy scripts (rare but preserved).
   */
  scripts?: string[];

  /**
   * New structured CSS descriptor.
   * Preferred by new adapters.
   */
  css?: {
    paths?: string[];
    inline?: string;
  };

  /* ============================================================
   * Styling
   * ============================================================
   */

  /**
   * CSS custom properties (without -- prefix).
   * Shared by legacy and new systems.
   */
  variables?: Record<string, string>;

  /**
   * Theme-owned global classes.
   *
   * LEGACY: string[]
   * NEW SYSTEMS may namespace or map internally.
   */
  classes?: string[];

  /**
   * Namespace for theme-owned classes.
   * Used to safely remove previous theme classes.
   */
  classPrefix?: string;

  /* ============================================================
   * Layout & Typography (NEW, NON-BREAKING)
   * ============================================================
   */

  layout?: {
    density?: "compact" | "comfortable" | "spacious";
    borderRadius?: string;
  };

  typography?: {
    fontFamily?: string;
    baseFontSize?: string;
  };

  /* ============================================================
   * Semantic Metadata (LEGACY, STRUCTURED)
   * ============================================================
   */

  /**
   * High-level semantic hints.
   * Used by adapters, inspectors, editors.
   */
  metadata?: {
    colorScheme?: Record<string, string>;
    typography?: Record<string, string>;
    spacing?: Record<string, string>;
    animations?: Record<string, string>;
  };

  /* ============================================================
   * Governance (LEGACY)
   * ============================================================
   */

  author?: string;
  license?: string;
  repository?: string;

  /* ============================================================
   * Extensions & Experimental
   * ============================================================
   */

  /**
   * Free-form extension point.
   * NEVER interpreted by core directly.
   */
  extensions?: Record<string, any>;

  /* ============================================================
   * Normalization & Provenance (NEW)
   * ============================================================
   */

  /**
   * Runtime metadata added by UiThemeNormalizer.
   * NOT expected to be present in static definitions.
   */
  meta?: {
    source?: "legacy" | "static" | "dynamic" | "user";
    uiSystem?: string;
    version?: string;
    normalizedAt?: number;
  };
}

