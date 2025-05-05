import chalk from "chalk";
import { ENV_OPTION_INPUT_KEY, ENV_OPTION_OVERWRITE_KEY, FALSE_RE, FALSE_STRINGS, TRUE_RE, TRUE_STRINGS} from "./constants";
import { findShortcutsFile, getRandomAppId } from "../utils";
import fs from "fs/promises";
import path from "path";
import { Shortcuts } from "../classes";
import { EntryObject, FieldType, SteamFieldKey } from "../types";
import * as commander from "commander";

type Message = Array<string | Array<string>>;

export const msg = (...message: Message): string => {
  return message.reduce((acc, part, i) =>
    `${acc}${i !== 0 ? "\n" : ""}${typeof part === "string" ? part : part.join(" ")}`,
    "",
  ) as string;
};

export enum Verbosity {
  Quiet,
  Normal,
  Verbose,
}

const errorMsg: typeof msg = (...message) => `\n${chalk.red("ERR")}: ${msg(...message)}\n`;
const warnMsg: typeof msg = (...message) => `\n${chalk.yellow("WARN")}: ${msg(...message)}\n`;
const infoMsg: typeof msg = (...message) => `\n${chalk.blue("INFO")}: ${msg(...message)}\n`;

type Logger = (...message: Message) => void;

interface Log extends Logger {
  always: Logger;
  error: Logger;
  warn: Logger;
  info: Logger;
  verbosity: Verbosity;
}

export const log: Log = (...message) => {
  if (log.verbosity > Verbosity.Quiet) {
    console.log(msg(...message));
  }
};
log.verbosity = Verbosity.Normal;
log.always = function (...message) {
  console.log(msg(...message));
}
log.error = function (...message) {
  console.error(errorMsg(...message));
};
log.warn = function (...message) {
  if (this.verbosity > Verbosity.Quiet) {
    console.warn(warnMsg(...message));
  }
};
log.info = function (...message) {
  if (this.verbosity >= Verbosity.Verbose) {
    console.info(infoMsg(...message))
  };
};

export const asInt = (value: string | undefined): number => {
  const parsedValue = parseInt(value as any, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError("It must be an integer.");
  }
  return parsedValue;
};

export const prettyValue = (v: string | number | boolean | Array<string> | Date | undefined): string => {
  if (typeof v === "string") {
    return `'${v}'`;
  }
  if (typeof v === "number" || typeof v === "boolean" || v instanceof Date) {
    return `${v}`;
  }
  if (Array.isArray(v)) {
    return `[ ${v.join(", ")}] `
  }
  return '';
};

export const asBoolean = (value?: string, defaultValue = true): boolean => {
  if (!value) {
    return defaultValue;
  }

  if (value.match(TRUE_RE)) {
    return true;
  }
  if (value.match(FALSE_RE)) {
    return false;
  }
  throw new commander.InvalidOptionArgumentError(
    `It must be one of: ${[...TRUE_STRINGS, ...FALSE_STRINGS].join(", ")}`
  );
};

export const asAppId = (value: string): number => {
  const error = new commander.InvalidOptionArgumentError("It must be a 9-digit number.");
  let intValue: number;
  try {
    intValue = asInt(value);
  } catch (err) {
    throw error;
  }
  if (intValue > 9999999999 || intValue < 1000000000) {
    throw error;
  }
  return intValue;
};

export const asAppIds = (value: string, previous?: Array<number | string>): Array<number | string> => {
  let intValue: number | undefined = undefined;
  try {
    intValue = asInt(value);
  } catch {}
  return previous ? [...previous, intValue || value] : [intValue || value];
};

export const asDate = (value: string) => {
  const asInt = parseInt(value);
  let date: Date;
  if (Number.isNaN(asInt)) {
    date = new Date(asInt);
  } else {
    date = new Date(value);
  }
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) {
    throw new commander.InvalidOptionArgumentError("It must be a timestamp (in seconds) or a valid date string.");
  }
  return date;
};

export const asStringArray = (value: string) => {
  const nul = String.fromCharCode(0);
  const values = value.split(/,(?<!\\,)/).map(value => value.replace(/\\,/g, ","))
  return values;
};

export const getEnvConfig = (opts: { overwrite?: boolean, input?: string }): { overwrite: boolean, input: string | undefined } => {
  const overwrite = opts.overwrite !== undefined ? opts.overwrite : asBoolean(process.env[ENV_OPTION_OVERWRITE_KEY], false);
  const input = opts.input !== undefined ? opts.input : process.env[ENV_OPTION_INPUT_KEY];
  return { overwrite, input };
};

export const generateUniqueAppId = (shortcuts: Shortcuts) => {
  const existingAppIds = shortcuts.entries.map(e => e.appId);
  let appId = getRandomAppId();
  let sanity = 0;
  while (existingAppIds.includes(appId)) {
    if (sanity >= 100) {
      throw new Error("Failed to generate unused app ID.");
    }
    appId = getRandomAppId();
    sanity++;
  }
  return appId;
};

export const getEntry = async (appId: number, pathArg?: string): Promise<EntryObject | undefined> => {
  const entries = await getEntries(pathArg);
  return entries.find(e => e.appid === appId);
};

export const getEntries = async (pathArg?: string): Promise<Array<EntryObject>> => {
  return (await getShortcuts(pathArg)).toObject();
};

export const getShortcuts = async (pathArg?: string): Promise<Shortcuts> => {
  const path = await getShortcutsPath(pathArg);
  log.info(`Loading from '${path}'...`);
  let shortcuts: Shortcuts;
  try {
    shortcuts = await Shortcuts.fromFile(path);
  } catch (err) {
    throw new Error();
  }
  return shortcuts;
};

export const getShortcutsPath = async (pathArg?: string): Promise<string> => {
  let pathToUse: string | undefined;
  const envPath = process.env[ENV_OPTION_INPUT_KEY];

  if (envPath && pathArg) {
    log.info(
      `The input file is set by both an argument ('${pathArg}') and an env var`,
      `(${ENV_OPTION_INPUT_KEY}='${envPath}'). The argument takes precedence.`
    );
  }

  if (pathArg) {
    pathToUse = pathArg;
    log.info(`Using input file from: '${pathToUse}'`);
  } else if (envPath) {
    pathToUse = envPath;
    log.info(`Using input file from '${ENV_OPTION_INPUT_KEY}' env var: '${pathToUse}'`);
  }

  if (pathToUse) {
    let normalizedPath = path.resolve(process.cwd(), pathToUse);

    try {
      const stats = await fs.lstat(normalizedPath);
      if (stats.isDirectory()) {
        normalizedPath = path.resolve(normalizedPath, "shortcuts.vdf");
      }  
      await fs.readFile(normalizedPath);
      return normalizedPath;
    } catch(err) {
      throw new Error(msg(
        `Attempted to load file from ${pathArg}', but encountered an error:`,
        "",
        `  ${(err as Error).message}`,
      ));
    }
  }

  const [exists, file, searchPaths] = await findShortcutsFile();
  if (!file) {
    throw new Error(msg(
      `A Steam user config dir could not be found in any of the following paths:`,
      "",
      ...searchPaths.map(s => `  ${s}`),
      "",
      [`If your Steam installation is somewhere non-standard, you'll need to provide the path to shortcuts.vdf`,
       `explicitly using the --input arg, or you can set the ${ENV_OPTION_INPUT_KEY} environment variable.`]
    ));
  }
  if (!exists) {
    console.warn(`Found a valid path at '${path.dirname(file)}', but no shortcuts.vdf exists there.`)
  }
  return file;
}
