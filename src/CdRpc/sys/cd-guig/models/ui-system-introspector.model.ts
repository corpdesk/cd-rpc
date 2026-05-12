export interface IUiSystemIntrospector {
  readonly systemId: string;
  readonly version: string;
}

// legacy / shell-level lifecycle
export enum UiAdapterPhase {
  INIT = "init",
  SHELL_READY = "shell_ready",
  MENU_READY = "menu_ready",
  CONTROLLER_READY = "controller_ready",
  DOM_STABLE = "dom_stable",
}


// adapter-internal lifecycle
export enum UiAdapterLifecycle {
  CREATED = "created",
  INITIALIZED = "initialized",
  ACTIVATED = "activated",
  MAPPED = "mapped",
  OBSERVING = "observing",
  THEMED = "themed",
}

export const ShellToLifecycleHint: Partial<Record<UiAdapterPhase, UiAdapterLifecycle>> = {
  [UiAdapterPhase.INIT]: UiAdapterLifecycle.CREATED,
  [UiAdapterPhase.SHELL_READY]: UiAdapterLifecycle.ACTIVATED,
  [UiAdapterPhase.DOM_STABLE]: UiAdapterLifecycle.OBSERVING,
};

export const UI_ADAPTER_LIFECYCLE_ORDER: UiAdapterLifecycle[] = [
  UiAdapterLifecycle.CREATED,
  UiAdapterLifecycle.INITIALIZED,
  UiAdapterLifecycle.ACTIVATED,
  UiAdapterLifecycle.MAPPED,
  UiAdapterLifecycle.OBSERVING,
  UiAdapterLifecycle.THEMED,
];


