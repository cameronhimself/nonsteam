#!/usr/bin/env node
import fs from "fs/promises";
import os from "os";
import path from "path";
import { dir } from "tmp-promise";
import { mkdirp } from "mkdirp";
import { setExternalVBSLocation } from "regedit";
import { program } from "./nonsteam";

/*
The `regedit` module spawns a new process that takes a wsf file (included in
the module) as an argument. This works fine when running with node, but
apparently not when the code is packaged as an executable, since you can't make
the spawned process look inside the snapshot filesystem for the wsf file.

The solution is copy the wsf files to a tmp dir and then tell regedit to look
for them there using setExternalVBSLocation. We do this on every invocation of
the executable, making sure to clean up the tmp files after.

//TODO: the tmp files won't be cleaned up on uncaught error.
*/

const main = async () => {
  if (os.platform() === "win32") {
    const tmpDir = await dir({ unsafeCleanup: true });
    const vbsRelativeDir = "resources/regedit/vbs";
    const outputVbsDir = path.resolve(tmpDir.path, vbsRelativeDir);
    await mkdirp(outputVbsDir);
    for (const filename of await fs.readdir(path.resolve(__dirname, vbsRelativeDir))) {
      await fs.copyFile(path.resolve(__dirname, vbsRelativeDir, filename), path.resolve(outputVbsDir, filename));
    }
    setExternalVBSLocation(outputVbsDir);
    await program.parseAsync();
    await tmpDir.cleanup();
    return;
  }
  await program.parseAsync();
};

main();
