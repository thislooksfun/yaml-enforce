export type {
  MatcherFn,
  Structure,
  TypeDefs,
  TypeValidators,
  ValidatorFn,
} from "validate-structure";

import type { Structure, TypeDefs, ValidationError } from "validate-structure";
import type { Location, RangeMap } from "./yaml.js";
import { parseYaml, loadYaml } from "./yaml.js";
import { validateStructure } from "validate-structure";
import fs from "fs";
import path from "path";

function structureFor(file: string): Structure | null {
  let dir = file;
  while (dir !== "/") {
    dir = path.dirname(dir);
    const structPath = path.join(dir, ".yamlstructure.yaml");
    if (fs.existsSync(structPath) && fs.statSync(structPath).isFile()) {
      const contents = fs.readFileSync(structPath, { encoding: "utf-8" });
      const struct = parseYaml(contents);

      // TODO: Validate struct's structure
      return struct as Structure;
    }
  }

  return null;
}

/**
 * Get the location of an error message in the source file.
 *
 * @param err The error to find the position of.
 * @param map The RangeMap for the source file.
 *
 * @returns The Location of the error.
 */
export function filePosForErr(err: ValidationError, map: RangeMap): Location {
  let range = map;

  for (const key of err.path) {
    if (!range.contents) break;
    if (!(key in range.contents)) break;
    range = range.contents[key];
  }

  if (err.type === "key" && range.keyRange) {
    return range.keyRange?.start;
  } else if (err.type === "val-end") {
    return range.valueRange.end;
  } else {
    return range.valueRange.start;
  }
}

/**
 * Validate that a yaml string meets the requirements of a structure.
 *
 * @param yaml A string containing the yaml data to validate.
 * @param structure The expected structure of `val`.
 * @param strict Whether or not extra keys should be treated as a failure.
 * @param customTypes Any custom types you want to refer to in `structure`.
 *
 * @returns An array of all the validation errors found.
 */
export function validateYaml(
  yaml: string,
  structure: Structure,
  strict?: boolean,
  customTypes?: TypeDefs
): { errors: ValidationError[]; map: RangeMap } {
  const { data, map: map } = loadYaml(yaml);
  const errors = validateStructure(data, structure, strict, customTypes);
  return { errors, map };
}

/**
 * Validate that an object meets the requirements of a structure.
 *
 * @param filepath The path of the file to validate.
 * @param structure The expected structure of `val`. If this is not given it
 * will search for a `.yamlstructure.yaml` file in any of the parent folders.
 * @param strict Whether or not extra keys should be treated as a failure.
 * @param customTypes Any custom types you want to refer to in `structure`.
 *
 * @returns An array of all the validation errors found.
 */
export function validateFile(
  filepath: string,
  structure?: Structure | null,
  strict?: boolean,
  customTypes?: TypeDefs
): { errors: ValidationError[]; map?: RangeMap } {
  if (!fs.existsSync(filepath)) {
    return { errors: [{ msg: "File does not exist", path: [], type: "meta" }] };
  }
  if (!fs.statSync(filepath).isFile()) {
    return { errors: [{ msg: "Not a file", path: [], type: "meta" }] };
  }

  if (!structure) {
    const struct = structureFor(filepath);
    if (!struct) {
      const msg = "Unable to determine expected structure for file";
      return { errors: [{ msg, path: [], type: "meta" }] };
    }
    structure = struct;
  }

  const contents = fs.readFileSync(filepath, { encoding: "utf-8" });
  return validateYaml(contents, structure, strict, customTypes);
}
