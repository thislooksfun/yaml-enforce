export type {
  MatcherFn,
  Structure,
  TypeDefs,
  TypeValidators,
  ValidatorFn,
} from "validate-structure";

import type { Structure, TypeDefs, ValidationError } from "validate-structure";
import { load as loadYaml } from "js-yaml";
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
      const struct = loadYaml(contents);
      // TODO: Validate struct's structure
      return struct as Structure;
    }
  }

  return null;
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
): ValidationError[] {
  const data = loadYaml(yaml);
  return validateStructure(data, structure, strict, customTypes);
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
): ValidationError[] {
  if (!fs.existsSync(filepath)) {
    return [{ msg: "File does not exist", path: "" }];
  }
  if (!fs.statSync(filepath).isFile()) {
    return [{ msg: "Not a file", path: "" }];
  }

  if (!structure) {
    const struct = structureFor(filepath);
    if (!struct) {
      const msg = "Unable to determine expected structure for file";
      return [{ msg, path: "" }];
    }
    structure = struct;
  }

  const contents = fs.readFileSync(filepath, { encoding: "utf-8" });
  return validateYaml(contents, structure, strict, customTypes);
}

/**
 * Validate that an object meets the requirements of a structure.
 *
 * @param filepaths An array of file paths to validate.
 * @param structure The expected structure of `val`. If this is not given it
 * will search for a `.yamlstructure.yaml` file in any of the parent folders.
 * @param strict Whether or not extra keys should be treated as a failure.
 * @param customTypes Any custom types you want to refer to in `structure`.
 *
 * @returns An array where each item is the array of errors for the associated
 * file. This array is in the same order as the input filepaths.
 *
 * @throws If something went wrong preparing for the validation. For example, if
 * the file does not exist.
 */
export function validateFiles(
  filepaths: string[],
  structure?: Structure | null,
  strict?: boolean,
  customTypes?: TypeDefs
): ValidationError[][] {
  return filepaths.map(fp => validateFile(fp, structure, strict, customTypes));
}
