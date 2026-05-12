/**
 * @file ui-directive.model.ts
 * @description
 * Represents how universal directives (UUD-level) map to
 * concrete UI-system-specific directives or behaviors.
 */

export interface UiSystemDirectiveBinding {
  class?: string; // e.g. 'btn btn-primary' (Bootstrap), 'mat-button' (Material)
  attributes?: Record<string, string>;
  dataAttributes?: Record<string, string>;
  init?: (element: HTMLElement, options?: any) => void; // optional initialization hook
}

export interface DirectiveMap {
  [universalDirective: string]: UiSystemDirectiveBinding;
}
