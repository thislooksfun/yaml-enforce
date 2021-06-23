import { execSync } from "child_process";
import chalk from "chalk";
import path from "path";

const cwd = process.cwd();

chalk.level = 1;
const errorPrefix = `[${chalk.red("error")}]`;

describe("cli", () => {
  const configPath = "test/fixtures/config";
  const cpath = (p: string) => path.join(cwd, configPath, p);
  const snakePath = cpath("snake.invalid.yaml");

  function run(args: string[], cd?: string) {
    try {
      const vars = "CI=true FORCE_COLOR=1";
      let cmd = `${vars} node dist/cli/index.js ${args.join(" ")}`;
      if (cd) cmd = `(cd ${cd} && ${cmd})`;
      return execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
    } catch (e) {
      let msg = e.message;
      if (msg.startsWith("Command failed:")) {
        // Trim the error message down to just stdout/stderr.
        let firstNewline = msg.indexOf("\n");
        msg = msg.slice(firstNewline + 1);
      }

      throw new Error(msg);
    }
  }

  it("should run", () => {
    expect(() => run(["-v"])).not.toThrow();
  });

  it("should check specified file(s)", () => {
    const filePath = "test/fixtures/config/snake.invalid.yaml";
    expect(() => run([filePath])).toThrow(
      [
        `${errorPrefix} Found 2 errors in file '${snakePath}':`,
        `${errorPrefix}   missing key 'url' (images.0) [L4:1]`,
        `${errorPrefix}   extra key (images.0.uri) [L3:5]`,
        "",
      ].join("\n")
    );
  });

  it("should not recurse by default", () => {
    expect(() => run([configPath])).toThrow(
      [
        `${errorPrefix} Found 2 errors in file '${snakePath}':`,
        `${errorPrefix}   missing key 'url' (images.0) [L4:1]`,
        `${errorPrefix}   extra key (images.0.uri) [L3:5]`,
        "",
      ].join("\n")
    );
  });

  it("should recurse when specified", () => {
    const spanishPath = cpath("greetings/spanish.invalid.yaml");
    expect(() => run(["-r", configPath])).toThrow(
      [
        `${errorPrefix} Found 1 error in file '${spanishPath}':`,
        `${errorPrefix}   missing key 'title' [L2:1]`,
        `${errorPrefix} Found 2 errors in file '${snakePath}':`,
        `${errorPrefix}   missing key 'url' (images.0) [L4:1]`,
        `${errorPrefix}   extra key (images.0.uri) [L3:5]`,
        "",
      ].join("\n")
    );
  });

  it("should silence output when asked", () => {
    expect(() => run(["-r", "--silent", configPath])).toThrow("");
  });

  it("should use the given structure", () => {
    const filePath = "test/fixtures/config/snake.invalid.yaml";
    expect(() =>
      run(["-r", "-s", '"{\\"name\\": \\"string\\"}"', filePath])
    ).toThrow(
      [
        `${errorPrefix} Found 1 error in file '${snakePath}':`,
        `${errorPrefix}   extra key (images) [L2:1]`,
        "",
      ].join("\n")
    );
  });

  it("should handle yaml aliases", () => {
    const referencePath = cpath("complex/reference.invalid.yaml");
    expect(() => run([referencePath])).toThrow(
      [
        `${errorPrefix} Found 1 error in file '${referencePath}':`,
        `${errorPrefix}   'world' is not an integer (b.hello.there) [L4:4]`,
        "",
      ].join("\n")
    );
  });

  it("should exit cleanly if there were no errors", () => {
    const filePath = "test/fixtures/config/dog.yaml";
    expect(run([filePath])).toBe(
      "All yaml files matched the expected structure(s)!\n"
    );
  });
});
