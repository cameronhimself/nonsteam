import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { exec } from "@yao-pkg/pkg";
import { mkdirp } from "mkdirp";
import { tgz } from "compressing";
import { version as nonsteamVersion } from "../package.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.resolve(BASE_DIR, "dist");
const BINARIES_DIR = path.resolve(DIST_DIR, "binaries");
const NODE_VERSION = "node22";

const targets: string = [
  "linux-x64",
  "linux-arm64",
  "alpine-x64",
  "linux-arm64",
  "win-x64",
  "macos-x64",
  "macos-arm64",
].map(t => `${NODE_VERSION}-${t}`).join(",");

const compress = async (name: string, source: string, dest: string) => {
  const outdir = path.resolve(BINARIES_DIR, name);
  await mkdirp(outdir);
  await fs.rename(source, path.resolve(outdir, path.basename(source)));
  await fs.rename(path.resolve(outdir, path.basename(source)), path.resolve(outdir, `nonsteam${source.includes(".exe") ? ".exe" : ""}`))
  await tgz.compressDir(outdir, dest);
};

const main = async () => {
  await mkdirp(BINARIES_DIR);
  await exec([
    path.resolve(DIST_DIR, "executable/packaged.js"),
    "-c", path.resolve(__dirname, "..", "pkg.config.json"),
    "--out-dir", BINARIES_DIR,
    "--no-bytecode",
    "--public",
    "--public-packages", "'*'",
    "--target", targets,
  ]);

  const compressPromises = (await fs.readdir(BINARIES_DIR)).map(file => {
    const fullPath = path.resolve(BINARIES_DIR, file);
    const name = `${path.basename(file).replace(".exe", "")}-${nonsteamVersion}`;
    const tgzFilename = path.resolve(BINARIES_DIR, `${name}.tgz`);
    return compress(name, fullPath, tgzFilename);
  });

  await Promise.all(compressPromises);
};

main();
