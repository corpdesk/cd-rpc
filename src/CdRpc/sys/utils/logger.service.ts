/**
 * Initialization options for the LoggerService.
 * new LoggerService(); // legacy default
new LoggerService({ context: "Shell", level: "debug" }); // existing
new LoggerService("UiThemeNormalizer"); // new ergonomic form
new LoggerService("UiThemeNormalizer", { level: "warn" }); // optional extension

 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  context?: string;
  level?: LogLevel;
  silent?: boolean;
}

export class LoggerService {
  private context: string;
  private level: LogLevel;
  private silent: boolean;

  // constructor(options: LoggerOptions = {}) {
  //   this.context = options.context || "Shell";
  //   this.level = options.level || "debug";
  //   this.silent = options.silent || false;
  // }
  constructor(
    contextOrOptions: string | LoggerOptions = {},
    options?: LoggerOptions
  ) {
    let resolvedOptions: LoggerOptions;

    // --- NEW ergonomic constructor support ---
    if (typeof contextOrOptions === "string") {
      resolvedOptions = {
        context: contextOrOptions,
        ...options,
      };
    } else {
      resolvedOptions = contextOrOptions;
    }

    // --- Existing defaults preserved ---
    this.context = resolvedOptions.context || "Shell";
    this.level = resolvedOptions.level || "debug";
    this.silent = resolvedOptions.silent || false;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.level];
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    if (this.silent || !this.shouldLog(level)) return;

    const prefix = `[${this.context.toUpperCase()}] [${level.toUpperCase()}]`;

    switch (level) {
      case "debug":
        console.debug(prefix, message, ...args);
        break;
      case "info":
        console.info(prefix, message, ...args);
        break;
      case "warn":
        console.warn(prefix, message, ...args);
        break;
      case "error":
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]) {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    this.log("error", message, ...args);
  }

  setContext(context: string) {
    this.context = context;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  silence() {
    this.silent = true;
  }

  unsilence() {
    this.silent = false;
  }
}

