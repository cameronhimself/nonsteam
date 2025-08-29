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
import SGDB, { SGDBImageOptions } from "steamgriddb";
import { log, msg, prettyValue, generateUniqueAppId, asInt, Verbosity, getEnvConfig } from "./utils";
import { EntryObject, ImageKind } from "../types";
import { Entry, IEntry, NonSteam } from "../classes";
import chalk from "chalk";
import path from "path";
import { BLANK_ENTRY } from "../constants";
import { ENV_OPTION_INPUT_KEY, ENV_OPTION_OVERWRITE_KEY } from "./constants";
import { version } from "../../package.json";

const program = new BaseCommand();

// intentionally committed
const sgdb = new SGDB(atob("NjFhNWI0Yjc1NWRjZDEwMDM4ZTQwNDIxOGQ5MDU2YWE="));

type ImageSourceMap = Partial<Record<ImageKind, string>>;

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
  sgdbId?: number;
};

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

const getSgdbImageUrls = async (sgdbId: number): Promise<ImageSourceMap> => {
  const sgdbQuery: SGDBImageOptions = { type: "game", id: sgdbId };

  const [grids, heroes, logos, icons] = await Promise.all([
    sgdb.getGrids(sgdbQuery),
    sgdb.getHeroes(sgdbQuery),
    sgdb.getLogos(sgdbQuery),
    sgdb.getIcons(sgdbQuery),
  ]);

  [grids, heroes, logos, icons].forEach(items => items.sort((a, b) => {
    if (a.style.includes("alternate") || a.style.includes("official")) {
      return -1;
    }
    return 0;
  }));
  const vertGrids = grids.filter((grid) => grid.width < grid.height);
  const horizGrids = grids.filter((grid) => grid.width > grid.height);

  return Object.fromEntries(Object.entries({
    gridHoriz: horizGrids[0] && horizGrids[0].url.toString(),
    gridVert: vertGrids[0] && vertGrids[0].url.toString(),
    hero: heroes[0] && heroes[0].url.toString(),
    logo: logos[0] && logos[0].url.toString(),
    icon: icons[0] && icons[0].url.toString(),
  }).filter(([_, v]) => Boolean(v)));
}

const getImageValues = async (opts: WriteOptions): Promise<ImageSourceMap> => {
  let sgdbImages: ImageSourceMap = opts.sgdbId ? await getSgdbImageUrls(opts.sgdbId) : {};
  const optImages: ImageSourceMap = Object.fromEntries(Object.entries({
    gridVert: opts.imageGrid,
    gridHoriz: opts.imageGridHoriz,
    icon: opts.imageIcon,
    hero: opts.imageHero,
    logo: opts.imageLogo,
  }).filter(([_, v]) => Boolean(v)));

  return { ...sgdbImages, ...optImages };
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
  })
);

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
    await Promise.all(Object.entries(await getImageValues(opts)).map(async ([imageKind, image]) =>
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
      await Promise.all(Object.entries(await getImageValues(opts)).map(([imageKind, image]) =>
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
