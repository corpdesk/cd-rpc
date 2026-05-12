import config from "../../../config";
import { RunMode } from "../base/i-base";

/**
 * CdLogger routes log messages to the appropriate console method
 * based on current global RunMode configuration.
 *
 * This class assumes that `RunMode` values are incrementally
 * ordered from least to most verbose/open.
 */
export class CdLogger {
    private static readonly runMode: RunMode = config.runMode;
  
    /**
     * Internal check to determine if a message of the given level should be logged.
     * Allows comparison-based control rather than hardcoded mode lists.
     */
    private static shouldLog(minLevel: RunMode): boolean {
      return this.runMode >= minLevel;
    }
  
    /**
     * Log standard operational messages.
     */
    static log(...args: any[]) {
      if (this.shouldLog(RunMode.NORMAL_OPERATION)) {
        console.log('[LOG]', ...args);
      }
    }
  
    /**
     * Log fine-grained debug messages.
     */
    static debug(...args: any[]) {
      if (this.shouldLog(RunMode.VERBOSE_MONITORING)) {
        console.debug('[DEBUG]', ...args);
      }
    }
  
    /**
     * Warn about unexpected or potentially problematic conditions.
     */
    static warn(...args: any[]) {
      if (this.shouldLog(RunMode.SAFE_DEBUG_MODE)) {
        console.warn('[WARN]', ...args);
      }
    }
  
    /**
     * Log critical errors that should always be visible above CRITICAL_ONLY.
     */
    static error(...args: any[]) {
      if (this.shouldLog(RunMode.CRITICAL_ONLY)) {
        console.error('[ERROR]', ...args);
      }
    }
  
    /**
     * Trace execution flow with call stacks.
     */
    static trace(...args: any[]) {
      if (this.shouldLog(RunMode.DIAGNOSTIC_TRACE)) {
        console.trace('[TRACE]', ...args);
      }
    }
  
    /**
     * Force log something regardless of run mode (use sparingly).
     */
    static force(...args: any[]) {
      console.log('[FORCE]', ...args);
    }
  }
  
