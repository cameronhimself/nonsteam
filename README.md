![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/cameronhimself/nonsteam/latest/total)
![NPM Downloads](https://img.shields.io/npm/dw/nonsteam)

### ⚠️ NOTICE: `nonsteam` is beta software! ⚠️

While I've successfully used it for my own purposes, it's still in its infancy. Please [create an issue](https://github.com/cameronhimself/nonsteam/issues/new) if you encounter any problems, and be sure to make backups of your `shortcuts.vdf` file!

# nonsteam

`nonsteam` is a tool and library for viewing and editing your non-Steam game entries from the command line or with code.  
  
Steam stores its non-Steam game entries in an opaque binary file that can't be edited by hand or manipulated by common command-line tools. This has become an acute pain point with the introduction of the Steam Deck, as the Linux environment makes the CLI the most convenient means of performing customization.

## CLI

### Installation

If you already have node/npm installed you can simply install as a global module:

```
npm i -g nonsteam
```

Otherwise, you can download a precompiled binary from the [latest release](https://github.com/cameronhimself/nonsteam/releases/latest) and put in your `PATH`.

### Basic usage

⚠️ **IMPORTANT** ⚠️  Steam will not pick up changes to non-Steam games while running. Be sure to restart Steam after making any changes. 

You can run `nonsteam help` to see a list of available commands, and `nonsteam help <command>` to get more details.

```sh
# list all non-Steam games
$ nonsteam get

2502275492: GOG Galaxy
3733884208: Dolphin

# get detailed information about one (or more) games
$ nonsteam get 2502275492 --details

appid: 2502275492
  AppName: 'GOG Galaxy'
  Exe: '"c:/path/to/executable.exe"'
  StartDir: '"c:/path/to/"'
  icon: ''
  ShortcutPath: ''
  LaunchOptions: 'SOME_ENV_VAR="foo" %command%'
  ...

# modify an existing game
$ nonsteam edit 2502275492 -w \
  --icon "c:\path\to\my\icon.png" \
  --allow-overlay \
  --is-hidden false

... Updated app with ID: 2502275492

# add a new non-Steam game
$ nonsteam add -w \
  --app-name "My App" \
  --exe '"c:\program files\my app\my app.exe"' \
  --start-dir '"c:\program files\my app\"' \
  --allow-overlay

... Added app with ID: 4148342750

# remove a non-Steam game
$ nonsteam delete -w 4148342750

... Deleted app with ID: 4148342750
```

### Fields for non-Steam games

The field names for non-Steam game entries are inconsistent inside of Steam's binary format. For reference, here are all of Steam's native field names, with their equivalents as CLI options and in the `nonsteam` API.

Note that, in Steam's format, all of the fields are either strings, 32-bit unsigned integers, or string arrays. Other types are coerced back and forth as needed within `nonsteam`.

| Steam | `nonsteam` CLI | `nonsteam` API | Type |
| - | - | - | - |
| `appid` | `--app-id` | `appId` | `number` (10-digit) |
| `AppName` | `--app-name` | `appName` | `string` |
| `Exe` | `--exe` | `exe` | `string` |
| `StartDir` | `--start-dir` | `startDir` | `string` |
| `icon` | `--icon` | `icon` | `string` |
| `ShortcutPath` | `--shortcut-path` | `shortcutPath` | `string` |
| `LaunchOptions` | `--launch-options` | `launchOptions` | `string` |
| `IsHidden` | `--is-hidden` | `isHidden` | `boolean` |
| `AllowDesktopConfig` | `--allow-desktop-config` | `allowDesktopConfig` | `boolean` |
| `OpenVR` | `--open-vr` | `openVr` | `boolean` |
| `Devkit` | `--devkit` | `devkit` | `boolean` |
| `DevkitGameID` | `--devkit-game-id` | `devkitGameId` | `string` |
| `DevkitOverrideAppID` | `--devkit-override-app-id` | `devkitOverrideAppId` | `number`* |
| `LastPlayTime` | `--last-play-time` | `lastPlayTime` | `Date` |
| `FlatpakAppID` | `--flatpak-app-id` | `flatpakAppId` | `string` |
| `tags` | `--tags` | `tags` | `string[]` |

*You might find Valve documentation indicating that this field is a string. This is simply wrong based on real-world experimentation.

### Using a specific non-Steam games file

By default, `nonsteam` will attempt to locate the file containing your non-Steam game entries (`shortcuts.vdf`) by querying the registry on Windows or by looking in common install dirs on Linux. However, if your Steam installation is atypical, or if you'd just prefer to be explicit, you can use a specific file by passing the `-i, --input` option:

```cmd
nonsteam get -i "C:\Program Files (x86)\Steam\userdata\241873089\config\shortcuts.vdf" 4148342750
```

```sh
nonsteam get -i ~/.steam/steam/userdata/241873089/config/shortcuts.vdf 4148342750
```

### Saving changes

You are required to be explicit about how to save your changes. There are two options that control the output file, and at least one must be set for `edit`, `add`, or `delete` commands:

- `-w, --overwrite` will cause your changes to be destructively written back to the input file.
- `-o, --output <path>` will non-destructively write the updated file to the specified path.

The former is more convenient, but the latter is safer. You're strongly encouraged to make backups before using `--overwrite`.

### Creating a new non-Steam games file

A blank file can be used as input, so you can simply do:

```bash
touch new-shortcuts.vdf
nonsteam add -i new-shortcuts.vdf -w --app-name "My App"
```

```cmd
echo $null > new-shortcuts.vdf
nonsteam.exe add -i new-shortcuts.vdf -w --app-name "My App"
```

### Environment variables

If you find you keep reading and writing to the same file, which is very typical, and you're tired of typing `-w -i <path>`, you can use the following environment variables to set defaults:

```sh
NONSTEAM_OPTION_INPUT="$HOME/.steam/steam/userdata/241873089/config/shortcuts.vdf"
NONSTEAM_OPTION_OVERWRITE=true
```

## API

In addition to the CLI interface, `nonsteam` also provides a TypeScript API. Documentation is coming, but, for now, here's a simple example:

```typescript
import { load } from "nonsteam";

load().then(nonsteam => nonsteam
  .addEntry({
    appName: "My Non-Steam App",
    exe: "/path/to/executable",
  })
  .deleteEntry(1987654311)
  .editEntry(1234567890, {
    icon: "path/to/new/icon.png",
  })
  .save().then(() => console.log("success!"));
);
```

Or, with `async/await`:

```typescript
const nonsteam = (await load())
  .addEntry({
    appName: "My Non-Steam App",
    exe: "/path/to/executable",
  })
  .deleteEntry(1987654311)
  .editEntry(1234567890, {
    icon: "path/to/new/icon.png",
  });
await nonsteam.save();
```
