import "mocha";
import { assert } from "chai";
import { exec as execBase } from "child_process";
import util from "util";
import path from "path";
import { fileURLToPath } from "url";
import { file, FileResult } from "tmp-promise";

const exec = util.promisify(execBase);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_DIR = path.resolve(__dirname);
const MOCK_DATA_DIR = path.resolve(CLI_DIR, "../test/mocks/data");

const callCli = async (...args: Array<string>) => {
  return await exec(["npx tsx", path.resolve(CLI_DIR, "index.ts"), ...args].join(" "));
};

describe("nonsteam CLI", async () => {
  let outputFile: FileResult;

  beforeEach(async () => {
    outputFile = await file();
  });

  afterEach(() => {
    outputFile.cleanup();
  });

  it("reads a VDF file", async () => {
    const result = await callCli("get", "-i", path.resolve(MOCK_DATA_DIR, "shortcuts-single.vdf"));
    assert.include(result.stdout, "1234567890: Non-Steam Game")
  });

  it("adds an entry", async () => {
    await callCli(
      "add",
      "-i", path.resolve(MOCK_DATA_DIR, "shortcuts-single.vdf"),
      "-o", outputFile.path,
      "--app-id", "1658632789",
      "--app-name", "'Brand new test app'",
    );
    const result = await callCli("get", "-i", outputFile.path);
    assert.include(result.stdout, "1234567890: Non-Steam Game")
    assert.include(result.stdout, "1658632789: Brand new test app")
  });

  it("edits an entry", async () => {
    await callCli(
      "edit", "1234567890",
      "-i", path.resolve(MOCK_DATA_DIR, "shortcuts-single.vdf"),
      "-o", outputFile.path,
      "--app-name", "'Modified App Name'",
    );
    const result = await callCli("get", "-i", outputFile.path);
    assert.include(result.stdout, "1234567890: Modified App Name")
    assert.notInclude(result.stdout, "1234567890: Non-Steam Game")
  });
});

