import fc from "fast-check";
import path from "path";

const fixtureDir = path.resolve(__dirname, "./fixtures");

import { validateYaml, validateFile } from "../src";

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
