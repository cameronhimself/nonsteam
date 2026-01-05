import { Argument, Option } from "commander";
import { ConfigOption, FieldValueOption, ImageOption, OtherOption } from "./classes";
import { asAppId, asAppIds, asBoolean, asDate, asInt, msg } from "./utils";

export const appIdArgument = new Argument("<appid>",
  "The ID of the non-Steam game entry."
).argParser(asAppId);

export const appIdsArgument = new Argument("[appid...]",
  "The IDs of the non-Steam game entries."
).argParser(asAppIds)

export const commonOpts: Array<Option> = [
  new ConfigOption("--verbose, -v", "Show more informational output.").group("Global Options"),
  new ConfigOption("--quiet, -q", "Suppress warnings and show less informational output. Overrides --verbose.").group("Global Options"),

  new ConfigOption("-i, --input <path>", msg([
    "Path to a shortcuts file, which is where non-Steam game configurations are",
    "stored. If a dir is provided, will look for a file called 'shortcuts.vdf'",
    "in that dir.",
  ], "", [
    "This option is not required. If you don't provide it we'll try to find it for you",
    "by looking in the registry on Windows or in expected paths in Linux.",
  ])),
];

export const saveOpts: Array<Option> = [
  new ConfigOption("-o, --output <path>", msg([
    "The path to save the modified shortcuts file. If a dir is",
    "provided, will output to a file called 'shortcuts.vdf' in that dir.",
    "Either this option or --overwrite must be provided."
  ])).conflicts(["overwrite"]),
  new ConfigOption("-w, --overwrite", msg([
    "If this flag is present, overwrite the --input file rather than writing",
    "to the --output file. Use with caution.",
    "Either this option or --output must be provided."
  ])).conflicts(["output"]),
  // new ConfigOption("--no-backup", msg([
  //   `By default a backup is created at '${'//TODO'}' whenever a shortcuts file`,
  //   "is saved with the --overwrite flag. This flag disables that behavior."
  // ])),
  new ConfigOption("-d, --dry-run", msg([
    "Show the modifications to be made and the file that they'll be made to,",
    "but don't actually do anything."
  ])),
];

export const otherOptions: Array<Option> = [
  new OtherOption("--compatibility-tool-version [version]", msg(
    "The compatibility tool version to use. At time of writing the known versions are:",
    "  steamlinuxruntime",
    "  Proton-stl",
    "  proton_hotfix",
    "  proton_experimental",
    "  proton_10",
    "  proton_9",
    "  proton_8",
    "  proton_7",
    "  proton_63",
    "  proton_5",
    "  proton_513",
    "  proton_5",
    "  proton_42",
    "  proton_411",
    "  proton_37",
    "  proton_316",
    "See https://github.com/[TODO] for more info."
  ))
];

export const imageOpts: Array<Option> = [
  new ImageOption("--image-grid <image>",
    "The vertical grid image. Can be either a local file path or a URL."),
  new ImageOption("--image-grid-horiz <image>",
    "The horizontal grid image. Can be either a local file path or a URL."),
  new ImageOption("--image-icon <image>",
    "The small game icon. Can be either a local file path or a URL. Note that this will also set --icon."),
  new ImageOption("--image-hero <image>",
    "The banner image at the top of the game detail page. Can be either a local file path or a URL."),
  new ImageOption("--image-logo <image>",
    "The logo that's overlaid on top of the hero. Can be either a local file path or a URL."),
  new ImageOption("--sgdb-id <id>", msg(
    ["The steamgriddb.com ID number. Rather than passing each image URL/path manually,",
    "you can use this option to try to pull all five images automatically from SGDB."],
    "",
    ["Note that any image passed explicitly with one of the `--image-*` options will take precedence over",
    "this option. This allows you to make overrides if any of the images aren't to your taste."],
  )).argParser(asInt),
];

export const fieldValueOpts: Array<Option> = [
  new FieldValueOption("--app-id <id>", msg([
    "The 10-digit app ID of the non-Steam game/program. If this isn't provided",
    "when adding a new entry then one will be generated for you with a",
    "guarantee of no collision.",
  ])).argParser(asAppId),
  new FieldValueOption("--app-name <name>","The app name."),
  new FieldValueOption("--exe <path>", "The path to the executable file."),
  new FieldValueOption("--start-dir <path>", msg([
    "The working directory of the app.",
    "This will typically be the parent path of the --exe option.",
  ])),
  new FieldValueOption("--icon <path>", msg([
    "The path to the app's icon. Overridden by --image-icon, which is the",
    "option you should probably be using instead unless you know what you're doing.",
  ])),
  new FieldValueOption("--shortcut-path <path>", "unknown"),
  new FieldValueOption("--launch-options <options>", `e.g., 'ENV_VAR="value" %command%' or '--verbose'`),
  new FieldValueOption("--is-hidden [flag]", "Whether this game is visible in steam.").argParser(asBoolean),
  new FieldValueOption("--allow-overlay [flag]",
    "Whether to permit opening the Steam overlay while in-game."
  ).argParser(asBoolean),
  new FieldValueOption("--allow-desktop-config [flag]", "boolean flag, purpose unknown").argParser(asBoolean),
  new FieldValueOption("--open-vr [flag]",
    "Whether this game should be included in your VR library."
  ).argParser(asBoolean),
  new FieldValueOption("--devkit [flag]", "boolean flag, purpose unknown").argParser(asBoolean),
  new FieldValueOption("--devkit-game-id <id>", "numeric ID, purpose unknown"),
  new FieldValueOption("--devkit-override-app-id <id>", "string ID, purpose unknown").argParser(asInt),
  new FieldValueOption("--last-play-time <timestamp>", msg([
    "The last time this game was played.",
    "Can be provided as a timestamp (in seconds) or a valid date string.",
  ])).argParser(asDate),
  new FieldValueOption("--flatpak-app-id <id>",
    "If this program was installed via Flatpak, the Flatpak app ID."
  ),
  new FieldValueOption("--tags <tags>", msg([
    "Comma-separated list of tags. Commas in tags can be escaped with a",
    "backslash, e.g. 'weird\\,tag,tag2,tag3'",
  ])).argParser((input: string) => {
    const result: Array<string> = [];
    let current = "";
    let escaping = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (escaping) {
        current += char;
        escaping = false;
      } else if (char === '\\') {
        escaping = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  })
];

export const writeOpts: Array<Option> = [
  ...saveOpts,
];
