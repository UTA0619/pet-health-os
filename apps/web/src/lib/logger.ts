type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === "production";

// ANSI color codes for development
const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m",  // green
  warn: "\x1b[33m",  // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

function log(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...metadata,
  };

  if (isProduction) {
    console.log(JSON.stringify(entry));
  } else {
    const color = COLORS[level];
    const prefix = `${color}[${level.toUpperCase()}]${RESET}`;
    const ts = `\x1b[90m${entry.timestamp}${RESET}`;
    const meta =
      metadata && Object.keys(metadata).length > 0
        ? ` ${JSON.stringify(metadata)}`
        : "";
    console.log(`${ts} ${prefix} ${message}${meta}`);
  }
}

export const logger = {
  debug(message: string, metadata?: Record<string, unknown>): void {
    log("debug", message, metadata);
  },
  info(message: string, metadata?: Record<string, unknown>): void {
    log("info", message, metadata);
  },
  warn(message: string, metadata?: Record<string, unknown>): void {
    log("warn", message, metadata);
  },
  error(message: string, metadata?: Record<string, unknown>): void {
    log("error", message, metadata);
  },
};
