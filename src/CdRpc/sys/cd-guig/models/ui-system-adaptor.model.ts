import { UiSystemDescriptor } from "../../dev-descriptor/models/ui-system-descriptor.model";
import { UiThemeDescriptor } from "../../dev-descriptor/models/ui-theme-descriptor.model";
import { BaseUiAdapter } from "../services/base-ui-adapter.service";

export interface IUiSystemAdapter {
  activate(descriptor: UiSystemDescriptor): Promise<void>;
  deactivate(): Promise<void>;
  applyTheme(theme: UiThemeDescriptor): Promise<void>;
  /** Injected by UiSystemLoaderService before activation */
  setMeta(meta: UiAdapterMeta): void;
}

/**
 * A single concept's mapping information.
 * Example concepts:
 * - "button"
 * - "input"
 * - "formGroup"
 * - "card"
 */
export interface UiConceptMapping {
  /** CSS class string to apply to the rendered element */
  class?: string;

  /** Inline style overrides (rarely used, but supported) */
  style?: Record<string, string>;

  /** Attribute overrides (e.g., {"data-bs-toggle": "tooltip"}) */
  attrs?: Record<string, string>;

  /** Optional: transform raw DOM before render */
  transform?: (el: HTMLElement) => void;

  /** Optional: metadata for future AI/plugin use */
  metadata?: Record<string, any>;
}

/**
 * Collection of mappings for a single UI system.
 * Maps concept → mapping configuration
 */
export type UiSystemMapping = Record<string, UiConceptMapping>;



/**
 * 1. Define specific IDs as a Union type or Enum to prevent
 * "string" vs "specific string" mismatches.
 */
// export type UiSystemId = "bootstrap-538" | "material-design" | "tailwind" | string;

export type UiSystemId =
  | "bootstrap-538"
  | "bootstrap-502"
  | "tailwind"
  | "material-mui"
  | "material-design"
  | "custom";

/**
 * 2. Harmonized DEFAULT_SYSTEM
 * Ensure no trailing commas or hidden characters are present.
 */
export const DEFAULT_SYSTEM: UiSystemDescriptor = {
  id: "bootstrap-538",
  version: "5.3.8",
  themeActive: "light",
};

/**
 * Defines the high-level role of a descriptor
 */
export enum CdUiRole {
  LAYOUT = "layout",
  CONTAINER = "container",
  CONTROL = "control",
  COMPOSITE = "composite",
}

export enum CdUiLayoutType {
  GRID = "grid",
  FLEX = "flex",
  STACK = "stack",
  MASONRY = "masonry",
}

export type CdUiResponsiveMap = {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
};

export interface CdUiLayoutDescriptor extends CdUiDescriptor {
  role: CdUiRole.LAYOUT;
  layoutType: CdUiLayoutType;
  responsive?: CdUiResponsiveMap;
}

export interface CdUiGridDescriptor extends CdUiLayoutDescriptor {
  layoutType: CdUiLayoutType.GRID;

  columns?: number;                 // semantic intent
  gap?: string | number;
}

export interface CdUiGridDescriptor extends CdUiLayoutDescriptor {
  layoutType: CdUiLayoutType.GRID;

  columns?: number; // total columns (default = 12)
  span?: number;    // how many columns THIS child spans

  responsive?: Partial<Record<
    "sm" | "md" | "lg" | "xl" | "xxl",
    number
  >>;
}

/** * Strict catalog of structural containers
 */
export enum CdUiContainerType {
  TABS = "tabs",
  TAB = "tab",
  CARD = "card",
  ACCORDION = "accordion",
  SECTION = "section",
  DIALOG = "dialog",
}

/** * Strict catalog of atomic controls
 */
export enum CdUiControlType {
  BUTTON = "button",
  TEXT_FIELD = "textField",
  CHECKBOX = "checkbox",
  SELECT = "select",
  SWITCH = "switch",
}

export interface CdUiDescriptor {
  id: string;
  role: CdUiRole; // Use Enum
  children?: CdUiDescriptor[];
}

export interface CdUiContainerDescriptor extends CdUiDescriptor {
  role: CdUiRole.CONTAINER;
  containerType: CdUiContainerType; // Use Enum
  label?: string;
  icon?: string;
}

export interface CdUiControlDescriptor extends CdUiDescriptor {
  role: CdUiRole.CONTROL;
  controlType: CdUiControlType; // Use Enum
  value?: any;
  placeholder?: string;
}

export interface CdUiAction {
  type: "navigate" | "submit" | "call_fx" | "toggle_target";
  target?: string; // e.g., a route or a component ID
  params?: Record<string, any>;
}

export interface CdUiControlDescriptor extends CdUiDescriptor {
  role: CdUiRole.CONTROL;
  controlType: CdUiControlType;
  action?: CdUiAction; // The semantic intent of the interaction
}

export function isContainerDescriptor(
  d: CdUiDescriptor
): d is CdUiContainerDescriptor {
  return d.role === CdUiRole.CONTAINER;
}

export function isTabDescriptor(
  d: CdUiDescriptor
): d is CdUiContainerDescriptor {
  return (
    d.role === CdUiRole.CONTAINER &&
    (d as CdUiContainerDescriptor).containerType === CdUiContainerType.TAB
  );
}

export enum UiAdapterCapability {
  LAYOUT = "layout",
  CONTAINER = "container",
  CONTROL = "control",
}


export interface UiAdapterCapabilities {
  layouts?: CdUiLayoutType[];
  containers?: CdUiContainerType[];
  controls?: CdUiControlType[];
}

export interface UiDescriptorValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export enum UiAdapterStatus {
  ACTIVE = "ACTIVE",
  MARKED_FOR_DEPRECATION = "MARKED_FOR_DEPRECATION",
  LEGACY = "LEGACY",
}

export interface UiAdapterMeta {
  // readonly id: string;
  // readonly version: string;
  // readonly status: UiAdapterStatus;
  id: string;              // "bootstrap-538"
  name?: string;           // "Bootstrap 5 Adapter"
  version?: string;        // "5.3.8"
  status?: "ACTIVE" | "MARKED_FOR_DEPRECATION";
  vendor?: string;       // "Bootstrap"
}

export function isUiAdapterConstructor(
  value: unknown
): value is new () => BaseUiAdapter {
  return (
    typeof value === "function" &&
    value.prototype instanceof BaseUiAdapter
  );
}










