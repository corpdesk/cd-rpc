export {};

declare global {
  interface CdShellNotify {
    success(msg: string): void;
    error(msg: string): void;
    info?(msg: string): void;
    warn?(msg: string): void;
  }

  interface CdShellProgress {
    start(label?: string): void;
    done(): void;
    set?(percent: number): void;
  }

  interface Window {
    /**
     * Runtime-injected UI system identifiers
     */
    CD_ACTIVE_UISYSTEM?: string; // 👈 supports legacy/global constant
    CdShellActiveUiSystem?: string; // 👈 supports camelCase variant
    /** Full active descriptor injected by UiSystemLoader */
    CdActiveUiDescriptor?: UiSystemDescriptor;

    /**
     * Existing cdShell API surface
     */
    cdShell?: {
      logger?: {
        debug?: (...args: any[]) => void;
        warn?: (...args: any[]) => void;
        error?: (...args: any[]) => void;
      };
      lifecycle?: {
        onViewLoaded?: (item?: any, cdToken?: string) => void;
      };
      notify?: CdShellNotify;
      progress?: CdShellProgress;
    };
  }
}
