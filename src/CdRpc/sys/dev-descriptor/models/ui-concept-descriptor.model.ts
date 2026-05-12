export interface UiConceptDescriptor {
  id: string; // e.g. 'button'
  title?: string;
  category?: string; // 'form-control' | 'layout' | 'data-display'
  description?: string;
  defaultProps?: Record<string, any>;
  events?: string[];
  children?: string[]; // allowed child concept ids
  semanticHints?: Record<string, any>;
}

/**
 * Responsibilities:
    Defines basic identity and metadata.
    Allows nesting (through children).
    Enables traversal and reflection.
 */
export interface UiDescriptorBase {
  id: string;
  type: string; // e.g. "layout", "control", "theme"
  name?: string;
  label?: string;
  description?: string;
  attributes?: Record<string, any>;
  children?: UiDescriptorBase[];
}

export interface UiConceptDescriptor {
  id: string; // e.g. "button"
  title?: string; // "Button"
  category?: string; // "form-control" | "layout" | "data-display"
  description?: string;
  defaultProps?: Record<string, any>; // default API contract (label, disabled, size, variant)
  events?: string[]; // allowed events, e.g. ['click','hover','focus']
  children?: string[]; // allowed child concepts, e.g. ['icon','label']
  semanticHints?: Record<string, any>; // optional AI hints (e.g., accessibility role)
}

// export interface UiThemeDescriptor {
//   name: string;
//   file: string; // relative to assetPath
//   default?: boolean;
// }

export interface UiLayoutDescriptor {
  layoutType: "grid" | "flex" | "stack" | "absolute";
  direction?: "row" | "column";
  regions?: UiRegionDescriptor[];
}

export interface UiRegionDescriptor {
  regionName: string;
  slot?: string; // For system-specific slot naming
  // content?: UiComponentDescriptor[];
}


