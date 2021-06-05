import fc from "fast-check";
import path from "path";

const fixtureDir = path.resolve(__dirname, "./fixtures");

import { validateYaml, validateFile } from "../src";

describe("validateYaml()", () => {
  it("should correctly parse and validate yaml files", () => {
    fc.assert(
      fc.property(fc.integer(), i => {
        expect(validateYaml(`key: ${i}`, { key: "int" })).toStrictEqual([]);
        expect(validateYaml(`other: ${i}`, { key: "int" })).toStrictEqual([
          { msg: "missing key", path: "key" },
          { msg: "extra key", path: "other" },
        ]);
      })
    );
  });
});

describe("validateFile()", () => {
  it("should error if the file does not exist", () => {
    expect(validateFile("/some/fake/path", "")).toStrictEqual([
      { msg: "File does not exist", path: "" },
    ]);
  });

  it("should error if the path is not a file", () => {
    expect(validateFile("/")).toStrictEqual([{ msg: "Not a file", path: "" }]);
  });

  it("should use the given structure", () => {
    const fpath = path.join(fixtureDir, "config/cat.yaml");

    const struct = { name: "string", images: "string[]" };
    expect(validateFile(fpath, struct)).toStrictEqual([
      { msg: "'[object Object]' is not a string", path: "images[0]" },
    ]);
  });

  it("should error if it cannot find a structure", () => {
    const fpath = path.join(fixtureDir, "configless/something.invalid.yaml");

    expect(validateFile(fpath)).toStrictEqual([
      { msg: "Unable to determine expected structure for file", path: "" },
    ]);
  });

  it("should validate based on the found .yamlstructure", () => {
    expect(
      validateFile(path.join(fixtureDir, "config/cat.yaml"))
    ).toStrictEqual([]);

    expect(
      validateFile(path.join(fixtureDir, "config/snake.invalid.yaml"))
    ).toStrictEqual([
      { msg: "missing key", path: "images[0].url" },
      { msg: "extra key", path: "images[0].uri" },
    ]);
  });

  it("should use the nearest .yamlstructure", () => {
    expect(
      validateFile(path.join(fixtureDir, "config/burrowing/meerkat.yaml"))
    ).toStrictEqual([]);
  });
});
