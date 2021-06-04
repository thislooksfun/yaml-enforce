// This file adapted from https://github.com/prettier/prettier/blob/d3b777dd7d3ca533c81cf9b51e5963b429adb181/src/cli/logger.js

import type { WriteStream } from "tty";
import type { Color } from "chalk";
import readline from "readline";
import chalk from "chalk";
import stripAnsi from "strip-ansi";
import wcwidth from "wcwidth";

const countLines = (stream: WriteStream, text: string) => {
  process.stderr.columns;
  const columns = stream.columns || 80;
  let lineCount = 0;
  for (const line of stripAnsi(text).split("\n")) {
    lineCount += Math.max(1, Math.ceil(wcwidth(line) / columns));
  }
  return lineCount;
};

const clear = (stream: WriteStream, text: string) => () => {
  const lineCount = countLines(stream, text);

  for (let line = 0; line < lineCount; line++) {
    if (line > 0) {
      readline.moveCursor(stream, 0, -1);
    }

    readline.clearLine(stream, 0);
    readline.cursorTo(stream, 0);
  }
};

export type LogLevels = "silent" | "debug" | "log" | "warn" | "error";
export type MsgOpts = { newline?: boolean; prefix?: string };

export type Clearable = { clear: () => void };
export type LoggerFn = (message: string, options?: MsgOpts) => Clearable;

const emptyLogResult = { clear: () => {} };
export function createLogger(logLevel: LogLevels = "log") {
  return {
    logLevel,
    warn: createLogFunc("warn", "yellow"),
    error: createLogFunc("error", "red"),
    debug: createLogFunc("debug", "blue"),
    log: createLogFunc("log"),
  };

  function createLogFunc(loggerName: string, color?: typeof Color): LoggerFn {
    if (!shouldLog(loggerName)) {
      return () => emptyLogResult;
    }

    const levelPrefix = color ? `[${chalk[color](loggerName)}] ` : "";
    const stream = process[loggerName === "log" ? "stdout" : "stderr"];

    return (message: string, options?: MsgOpts) => {
      options = {
        newline: true,
        prefix: "",
        ...options,
      };
      const prefix = levelPrefix + options.prefix!;
      message = message.replace(/^/gm, prefix) + (options.newline ? "\n" : "");
      stream.write(message);

      return {
        clear: clear(stream, message),
      };
    };
  }

  function shouldLog(loggerName: string) {
    if (logLevel === "silent") return false;
    const levels = ["debug", "log", "warn", "error"];
    const indexOf = (s: string) => levels.findIndex(l => l === s);
    return indexOf(logLevel) <= indexOf(loggerName);
  }
}

export const logger = createLogger();
