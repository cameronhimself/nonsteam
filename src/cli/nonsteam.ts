import {
  fieldValueOpts,
  commonOpts,
  writeOpts,
  saveOpts,
  appIdsArgument,
  appIdArgument,
  imageOpts,
} from "./options";
import { Command } from "./classes";
import { Argument, Command as BaseCommand, Option } from "commander";
import { log, msg, prettyValue, generateUniqueAppId, asInt, Verbosity, getEnvConfig } from "./utils";
import { EntryObject, ImageKind } from "../types";
import { Entry, IEntry, NonSteam } from "../classes";
import chalk from "chalk";
import path from "path";
import { BLANK_ENTRY } from "../constants";
import { ENV_OPTION_INPUT_KEY, ENV_OPTION_OVERWRITE_KEY } from "./constants";
import { version } from "../../package.json";

const program = new BaseCommand();

const entryToLog = (entry: EntryObject): string => {
  const lines = [`appid: ${entry.appid}`];
  for (const k in entry) {
    const value = entry[k as keyof EntryObject];
    let formatted = String(value);
    if (Array.isArray(value)) {
      formatted = `[ ${value.map(v => `'${v}'`).join(", ")} ]`;
    }
    if (typeof value === "string") {
      formatted = `'${value}'`;
    }
    if (k === "appid") {
      continue;
    }
    lines.push(`  ${chalk.blue(k)}: ${formatted}`);
  }
  return `\n${lines.join("\n")}`;
};

const dryRun = (outputPath: string, entry: IEntry, opts: IEntry, preamble: string) => {
  console.log(`${preamble} in '${outputPath}':`);
  const lines = Object.keys(BLANK_ENTRY).map(k => {
    const currentValue = entry[k as keyof IEntry];
    const updatedValue = opts[k as keyof IEntry];
    if (updatedValue !== undefined) {
      const line = `${k}: ${prettyValue(entry[k as keyof IEntry])} -> ${prettyValue(opts[k as keyof IEntry])}`;
      return currentValue !== updatedValue ? chalk.yellow(line) : line;
    }
    return chalk.gray(`${k}: ${prettyValue(currentValue)}`);
  });
  console.log(`{\n${lines.map(line => `  ${line}`).join("\n")}\n}`);
};

const getImageValues = (opts: WriteOptions): Partial<Record<ImageKind, string | undefined>> => {
  return Object.fromEntries(Object.entries({
    gridVert: opts.imageGrid,
    gridHoriz: opts.imageGridHoriz,
    icon: opts.imageIcon,
    hero: opts.imageHero,
    logo: opts.imageLogo,
  }).filter(([_, v]) => Boolean(v)));
};

program
  .name('nonsteam')
  .description('CLI for manipulating your non-Steam game entries')
  .version(version)
  .addOption(new Option("--verbose, -v", "Show more informational output."))
  .addOption(new Option("--quiet, -q", "Suppress warnings and show less informational output. Overrides --verbose."))
  .hook("preAction", (prg) => {
    log.verbosity = Verbosity.Normal;
    if (prg.opts().verbose) {
      log.verbosity = Verbosity.Verbose;
    }
    if (prg.opts().quiet) {
      log.verbosity = Verbosity.Quiet;
    }
  });

type GetOptions = {
  input: string;
  details: boolean;
  asJson: boolean;
};

type WriteOptions = IEntry & {
  input?: string;
  output?: string;
  overwrite: boolean;
  dryRun?: boolean;
  json?: string;
  jsonFile?: string;

  imageGrid?: string;
  imageGridHoriz?: string;
  imageIcon?: string;
  imageHero?: string;
  imageLogo?: string;
};

program.addCommand(new Command('get')
  .description("Get information about one or more non-Steam game entries.")
  .addOptions(commonOpts)
  .addArgument(appIdsArgument)
  .option("-d, --details", "Display full details for each entry.")
  .option("-j, --as-json", "Format output as JSON. Implies --details.")
  .action(async (appIds: Array<number | string>, opts: GetOptions) => {
    const { input } = getEnvConfig(opts);
    let entries: Array<EntryObject>;
    let nonsteam: NonSteam;
    try {
      nonsteam = await NonSteam.load(input);
      entries = nonsteam.shortcuts.toObject()
        .filter(entry => appIds.length ? appIds.includes(entry.appid) : true)
    } catch(err) {
      log.error((err as Error).message);
      return;
    }

    if (!entries.length) {
      log.info("No results found.");
      return;
    }

    if (opts.asJson) {
      console.log(JSON.stringify(entries, undefined, 2));
    } else {
      if (opts.details) {
        entries.map(entryToLog).forEach(e => console.log(e));
        console.log("");
      } else {
        console.log("");
        entries.forEach(e => console.log(`${e.appid}: ${e.AppName}`))
        console.log("");
      }
    }
  }
));

program.addCommand(new Command('add')
  .description('Add a non-Steam game entry.')
  .addOptions(commonOpts)
  .addOptions(writeOpts)
  .addOptions(fieldValueOpts)
  .addOptions(imageOpts)
  .action(async (opts: WriteOptions) => {
    const { overwrite, input } = getEnvConfig(opts);
    if (!overwrite && !opts.output) {
      log.error(msg([
        `Either --overwrite must be set or --output must be specified${opts.dryRun ? ", even with --dry-run." : "."}`,
        `These can also be set with the ${ENV_OPTION_OVERWRITE_KEY} and ${ENV_OPTION_INPUT_KEY} environment variables.`,
      ]));
      return;
    }

    let nonsteam: NonSteam;
    try {
      nonsteam = await NonSteam.load(input);
    } catch(err) {
      log.error((err as Error).message);
      return;
    }

    const outputPath: string = overwrite
      ? nonsteam.shortcuts.loadedPath!
      : path.resolve(process.cwd(), opts.output!);

    opts.appId = opts.appId || generateUniqueAppId(nonsteam.shortcuts);
    if (nonsteam.getEntry(opts.appId)) {
      log.error([
        `Entry already exists for ID ${opts.appId}.`,
        `Use 'nonsteam edit ${opts.appId} [options]' to edit it instead.`,
      ]);
      return;
    }
    const entry = new Entry();
    entry.appId = 0;

    if (opts.dryRun) {
      dryRun(outputPath, entry, opts, "Would write the following new entry")
      return;
    }
    log.info(`Saving to ${outputPath}...`);
    entry.setValues(opts);
    await Promise.all(Object.entries(getImageValues(opts)).map(async ([imageKind, image]) =>
      nonsteam.setImage(entry.appId, imageKind as ImageKind, image)
    ));
    nonsteam.addEntry(entry);
    nonsteam.save(outputPath);
  }
));

program.addCommand(new Command('edit')
  .description('Edit a non-Steam game entry.')
  .addArgument(appIdArgument)
  .addOptions(commonOpts)
  .addOptions(writeOpts)
  .addOptions(fieldValueOpts)
  .addOptions(imageOpts)
  .action(async (appId: number, opts: WriteOptions) => {
    const { overwrite, input } = getEnvConfig(opts);
    if (!overwrite && !opts.output) {
      log.error(msg([
        `Either --overwrite must be set or --output must be specified${opts.dryRun ? ", even with --dry-run." : "."}`,
        `These can also be set with the ${ENV_OPTION_OVERWRITE_KEY} and ${ENV_OPTION_INPUT_KEY} environment variables.`,
      ]));
      return;
    }

    let nonsteam: NonSteam;
    try {
      nonsteam = await NonSteam.load(input)
    } catch(err) {
      log.error((err as Error).message);
      return;
    }
    const entry = nonsteam.getEntry(appId);
    if (!entry) {
      log.error(`Entry '${appId}' not found.`);
      return;
    }

    const outputPath: string = overwrite
      ? nonsteam.shortcuts.loadedPath!
      : path.resolve(process.cwd(), opts.output!);

    if (opts.dryRun) {
      dryRun(outputPath, entry, opts, "Would modify the following entry")
      return;
    } else {
      entry.setValues(opts);
      await Promise.all(Object.entries(getImageValues(opts)).map(([imageKind, image]) =>
        nonsteam.setImage(entry.appId, imageKind as ImageKind, image)
      ));
      log.info(`Saving to ${outputPath}...`);
      await nonsteam.save(outputPath);
    }
  }
));

program.addCommand(new Command("delete")
  .description("Delete a non-Steam game entry")
  .addArgument(new Argument("<appid>", "The ID of the non-Steam game entry.").argParser(asInt))
  .addOptions(commonOpts)
  .addOptions(saveOpts)
  .action(async (appId, opts) => {
    const { overwrite, input } = getEnvConfig(opts);
    if (!overwrite && !opts.output) {
      log.error(msg([
        `Either --overwrite must be set or --output must be specified${opts.dryRun ? ", even with --dry-run." : "."}`,
        `These can also be set with the ${ENV_OPTION_OVERWRITE_KEY} and ${ENV_OPTION_INPUT_KEY} environment variables.`,
      ]));
      return;
    }

    let nonsteam: NonSteam;
    try {
      nonsteam = await NonSteam.load(input);
    } catch(err) {
      log.error((err as Error).message);
      return;
    }

    const entry = nonsteam.getEntry(appId);
    if (!entry) {
      log.error(`Entry '${appId}' not found.`);
      return;
    }

    const outputPath: string = overwrite
      ? nonsteam.shortcuts.loadedPath!
      : path.resolve(process.cwd(), opts.output!);

    if (opts.dryRun) {
      console.log(msg(
        `Would delete the following entry from '${outputPath}:`,
        entryToLog(entry.toObject())
      ))
      return;
    } else {
      nonsteam.deleteEntry(appId);
      log.info(`Saving to ${outputPath}...`);
      await nonsteam.save(outputPath);
    }
  }
));

export { program };
