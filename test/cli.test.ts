import { execSync } from "child_process";
import path from "path";

const cwd = process.cwd();

describe("cli", () => {
  const configPath = "test/fixtures/config";
  const snakePath = path.join(cwd, configPath, "snake.invalid.yaml");

  function run(args: string[], cd?: string) {
    try {
      let cmd = `CI=true node dist/cli/index.js ${args.join(" ")}`;
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
        `[error] Found 2 errors in file '${snakePath}':`,
        "[error]   missing key (images[0].url)",
        "[error]   extra key (images[0].uri)",
        "",
      ].join("\n")
    );
  });

  it("should not recurse by default", () => {
    expect(() => run([configPath])).toThrow(
      [
        `[error] Found 2 errors in file '${snakePath}':`,
        "[error]   missing key (images[0].url)",
        "[error]   extra key (images[0].uri)",
        "",
      ].join("\n")
    );
  });

  it("should recurse when specified", () => {
    const spanishPath = path.join(
      cwd,
      configPath,
      "greetings/spanish.invalid.yaml"
    );
    expect(() => run(["-r", configPath])).toThrow(
      [
        `[error] Found 1 error in file '${spanishPath}':`,
        "[error]   missing key (title)",
        `[error] Found 2 errors in file '${snakePath}':`,
        "[error]   missing key (images[0].url)",
        "[error]   extra key (images[0].uri)",
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
        `[error] Found 1 error in file '${snakePath}':`,
        "[error]   extra key (images)",
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
