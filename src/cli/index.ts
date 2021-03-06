#!/usr/bin/env node

import type { Clearable } from "./log.js";
import type { Structure } from "validate-structure";
import { createLogger } from "./log.js";
import { isCI } from "ci-info";
import { mapErrLocs, validateFile } from "../index.js";
import fs from "fs";
import path from "path";
import yargs from "yargs";

const isTTY = process.stdout.isTTY && !isCI;

const args = yargs(process.argv.slice(2))
  .scriptName("yaml-enforce")
  .option("r", {
    alias: "recursive",
    desc: "Recursively process directories.",
    type: "boolean",
  })
  .option("s", {
    alias: "structure",
    desc: "A json string containing the structure to check against.",
    type: "string",
  })
  .option("j", {
    alias: "json",
    desc: "Check files ending in .json. If you want to check both .json and .yaml files you must also specify --yaml.",
    type: "string",
  })
  .option("y", {
    alias: "yaml",
    desc: "Check files ending in .yaml/.yml. This is on by default.",
    type: "string",
  })
  .option("verbose", {
    desc: "Show debug logs.",
    type: "boolean",
  })
  .option("silent", {
    desc: "Silence logging. This overrides --verbose.",
    type: "boolean",
  })
  // .positional("files", {
  //   desc: "A list of files to process",
  // })
  .alias("v", "version")
  .alias("h", "help")
  .help().argv;

const logLevel = args.silent ? "silent" : args.verbose ? "debug" : "log";
const logger = createLogger(logLevel);

const globalStruct = args.s ? (JSON.parse(args.s) as Structure) : null;

const checkJson = args.json;
const checkYaml = !checkJson || args.yaml;
const extensions = [
  ...(checkJson ? [".json"] : []),
  ...(checkYaml ? [".yaml", ".yml"] : []),
];

let lastClearable: Clearable = { clear: () => {} };
const clearLast = () => {
  lastClearable.clear();
  lastClearable = { clear: () => {} };
};
let totalErrors = 0;

function processPath(p: string, forceRecursion: boolean = false): boolean {
  if (!fs.existsSync(p)) {
    logger.error(`Unable to find file '${p}'`);
    return false;
  }

  if (fs.statSync(p).isDirectory()) {
    const recurse = forceRecursion || args.recursive;
    if (!recurse) return true;

    logger.debug(`Recursing into directory '${p}'`);

    const files = fs.readdirSync(p);
    let allValid = true;
    for (const fname of files) {
      if (!processPath(path.join(p, fname))) {
        allValid = false;
      }
    }
    return allValid;
  }

  const { name, ext } = path.parse(p);
  if (!extensions.includes(ext)) {
    logger.debug(`Skipping file '${p}', invalid extension`);
    return true;
  }
  if (name === ".yamlstructure") {
    logger.debug(`Skipping structure definition file '${p}'`);
    return true;
  }

  if (isTTY) {
    clearLast();
    lastClearable = logger.log(`Validating file '${p}'`, { newline: false });
  }

  const { errors, map } = validateFile(p, globalStruct);

  const errCount = errors.length;
  if (errCount === 0) return true;

  clearLast();
  logger.error(
    `Found ${errCount} error${errCount === 1 ? "" : "s"} in file '${p}':`
  );
  for (const err of errors) {
    let msg = err.msg;
    if (err.path.length > 0) {
      msg += ` (${err.path.join(".")})`;
    }
    if (map) {
      const [pos, ...via] = mapErrLocs(err, map);
      msg += ` [L${pos.line}:${pos.col}`;
      for (const loc of via) {
        msg += ` via L${loc.line}:${loc.col}`;
      }
      msg += "]";
    }
    logger.error(msg, { prefix: "  " });
  }

  // console.error(errors);
  return errors.length === 0;
}

const cwd = process.cwd();

if (args._.length > 0) {
  let valid = true;
  for (let pth of args._) {
    pth = "" + pth;
    if (!path.isAbsolute(pth)) {
      pth = path.resolve(cwd, pth);
    }

    if (!processPath(pth, true)) {
      valid = false;
    }
  }
  if (!valid) process.exit(1);
} else {
  processPath(cwd, true);
}

if (totalErrors === 0) {
  clearLast();
  logger.log("All yaml files matched the expected structure(s)!");
}
