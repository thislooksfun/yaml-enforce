import type { ValidationError } from "validate-structure";
import type { Location, Range, RangeMap } from "../src/yaml";
import fc from "fast-check";
import path from "path";

const fixtureDir = path.resolve(__dirname, "./fixtures");

import { filePosForErr, validateYaml, validateFile } from "../src";

describe("filePosForErr()", () => {
  const fcInt = () => fc.integer();
  const fcLoc = () => fc.record<Location>({ line: fcInt(), col: fcInt() });
  const fcRange = () => fc.record<Range>({ start: fcLoc(), end: fcLoc() });

  describe("ranges", () => {
    it("should default to the start of the value range", () => {
      fc.assert(
        fc.property(fcRange(), valueRange => {
          const err: ValidationError = { msg: "", type: "", path: [] };
          const map: RangeMap = { valueRange };
          expect(filePosForErr(err, map)).toStrictEqual(valueRange.start);
        })
      );
    });

    it("should use the end of the range if specified", () => {
      fc.assert(
        fc.property(fcRange(), valueRange => {
          const err: ValidationError = { msg: "", type: "val-end", path: [] };
          const map: RangeMap = { valueRange };
          expect(filePosForErr(err, map)).toStrictEqual(valueRange.end);
        })
      );
    });

    it("should use key range if specified and present", () => {
      fc.assert(
        fc.property(fcRange(), fcRange(), (valueRange, keyRange) => {
          const err: ValidationError = { msg: "", type: "key", path: [] };
          const map: RangeMap = { valueRange, keyRange };
          expect(filePosForErr(err, map)).toStrictEqual(keyRange.start);
        })
      );
    });

    it("should fall back on the start of the value range if the key range is missing", () => {
      fc.assert(
        fc.property(fcRange(), valueRange => {
          const err: ValidationError = { msg: "", type: "key", path: [] };
          const map: RangeMap = { valueRange };
          expect(filePosForErr(err, map)).toStrictEqual(valueRange.start);
        })
      );
    });
  });

  describe("keypaths", () => {
    it("should follow the keypath", () => {
      fc.assert(
        fc.property(fcRange(), fcRange(), (vr1, vr2) => {
          const err: ValidationError = {
            msg: "",
            type: "key",
            path: ["this", "is", "the", "path"],
          };

          let map: RangeMap = { valueRange: vr2 };
          for (let i = err.path.length - 1; i >= 0; --i) {
            map = { valueRange: vr1, contents: { [err.path[i]]: map } };
          }

          expect(filePosForErr(err, map)).toStrictEqual(vr2.start);
        })
      );
    });

    it("should use the closest range to the given keypath", () => {
      fc.assert(
        fc.property(fcRange(), fcRange(), (vr1, vr2) => {
          const err: ValidationError = {
            msg: "",
            type: "key",
            path: ["this", "is", "the", "path"],
          };

          let map: RangeMap = { valueRange: vr2 };
          for (let i = err.path.length - 2; i >= 0; --i) {
            map = { valueRange: vr1, contents: { [err.path[i]]: map } };
          }

          expect(filePosForErr(err, map)).toStrictEqual(vr2.start);
        })
      );

      fc.assert(
        fc.property(fcRange(), fcRange(), (vr1, vr2) => {
          const err: ValidationError = {
            msg: "",
            type: "key",
            path: ["this", "is", "the", "path"],
          };

          let map: RangeMap = { valueRange: vr1 };
          for (let i = err.path.length - 1; i >= 0; --i) {
            if (i === 2) {
              map = { valueRange: vr2, contents: { wrong: map } };
            } else {
              map = { valueRange: vr1, contents: { [err.path[i]]: map } };
            }
          }

          expect(filePosForErr(err, map)).toStrictEqual(vr2.start);
        })
      );
    });
  });
});

describe("validateYaml()", () => {
  it("should correctly parse and validate yaml files", () => {
    fc.assert(
      fc.property(fc.integer(), i => {
        expect(validateYaml(`key: ${i}`, { key: "int" }).errors).toStrictEqual(
          []
        );
        expect(
          validateYaml(`other: ${i}`, { key: "int" }).errors
        ).toStrictEqual([
          { msg: "missing key 'key'", path: [], type: "val-end" },
          { msg: "extra key", path: ["other"], type: "key" },
        ]);
      })
    );
  });
});

describe("validateFile()", () => {
  it("should error if the file does not exist", () => {
    expect(validateFile("/some/fake/path", "").errors).toStrictEqual([
      { msg: "File does not exist", path: [], type: "meta" },
    ]);
  });

  it("should error if the path is not a file", () => {
    expect(validateFile("/").errors).toStrictEqual([
      { msg: "Not a file", path: [], type: "meta" },
    ]);
  });

  it("should use the given structure", () => {
    const fpath = path.join(fixtureDir, "config/cat.yaml");

    const struct = { name: "string", images: "string[]" };
    expect(validateFile(fpath, struct).errors).toStrictEqual([
      {
        msg: "'[object Object]' is not a string",
        path: ["images", 0],
        type: "val-start",
      },
    ]);
  });

  it("should error if it cannot find a structure", () => {
    const fpath = path.join(fixtureDir, "configless/something.invalid.yaml");

    expect(validateFile(fpath).errors).toStrictEqual([
      {
        msg: "Unable to determine expected structure for file",
        path: [],
        type: "meta",
      },
    ]);
  });

  it("should validate based on the found .yamlstructure", () => {
    expect(
      validateFile(path.join(fixtureDir, "config/cat.yaml")).errors
    ).toStrictEqual([]);

    expect(
      validateFile(path.join(fixtureDir, "config/snake.invalid.yaml")).errors
    ).toStrictEqual([
      { msg: "missing key 'url'", path: ["images", 0], type: "val-end" },
      { msg: "extra key", path: ["images", 0, "uri"], type: "key" },
    ]);
  });

  it("should use the nearest .yamlstructure", () => {
    expect(
      validateFile(path.join(fixtureDir, "config/burrowing/meerkat.yaml"))
        .errors
    ).toStrictEqual([]);
  });
});
