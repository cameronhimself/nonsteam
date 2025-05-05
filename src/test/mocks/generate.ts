import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { IEntry, Shortcuts } from "../../classes";
import { mkdirp } from "mkdirp";

const now = new Date("Mon May 05 2025 12:25:56 GMT-0500 (Central Daylight Time)")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "data");

const create = (entries: Array<IEntry> | IEntry): Shortcuts => {
  const shortcuts = new Shortcuts();
  (Array.isArray(entries) ? entries : [entries]).forEach(entry => shortcuts.addEntry(entry));
  return shortcuts;
};

const mocks: Record<string, Shortcuts> = {
  single: create({
    appId: 1234567890,
    appName: "Non-Steam Game",
    exe: "/bin/non-steam-game",
    startDir: "/bin",
    icon: "/path/to/icon.png",
    shortcutPath: "",
    launchOptions: 'SOME_ENV_VAR="foo" %command%',
    isHidden: false,
    allowDesktopConfig: true,
    allowOverlay: true,
    openVr: false,
    devkit: false,
    devkitGameId: "",
    devkitOverrideAppId: "",
    lastPlayTime: now,
    flatpakAppId: "",
    tags: ["myTag", "some other tag"],
  }),
  multiple: create([
    {
      appId: 1234567890,
      appName: "Non-Steam Game",
      exe: "/bin/non-steam-game",
      startDir: "/bin",
      icon: "/path/to/icon.png",
      shortcutPath: "",
      launchOptions: 'SOME_ENV_VAR="foo" %command%',
      isHidden: false,
      allowDesktopConfig: true,
      allowOverlay: true,
      openVr: false,
      devkit: false,
      devkitGameId: "",
      devkitOverrideAppId: "",
      lastPlayTime: now,
      flatpakAppId: "",
      tags: ["myTag", "some other tag"],
    },
    {
      appId: 1987654321,
      appName: "Another Game",
      exe: "/bin/another-game",
      startDir: "/home/user",
      icon: "/path/to/another-icon.png",
      shortcutPath: "",
      launchOptions: 'SOME_OTHER_ENV_VAR="bar" %command%',
      isHidden: false,
      allowDesktopConfig: true,
      allowOverlay: false,
      openVr: false,
      devkit: false,
      devkitGameId: "",
      devkitOverrideAppId: "",
      lastPlayTime: now,
      flatpakAppId: "",
      tags: ["shooter", "buggy"],
    },
  ]),
};

const saveMocks = async () => {
  await mkdirp(DATA_DIR);
  const savePromises: Array<Promise<void>> = Object.entries(mocks).map(([name, entry]) => {
    return fs.writeFile(path.resolve(DATA_DIR, `shortcuts-${name}.vdf`), entry.toBuffer());
  });
  await Promise.all(savePromises);
};

saveMocks();
