# nonsteam

`nonsteam` is a tool and library for viewing and editing your non-Steam game entries from the command line or with code.  
  
Steam stores its non-Steam game entries in an opaque binary file that can't be edited by hand or manipulated by common command-line tools. This has become an acute pain point with the introduction of the Steam Deck, as the Linux environment makes the CLI the most convenient means of performing customization.

## CLI

### Installation

If you already have node/npm installed you can simply install as a global module:

```
npm i -g nonsteam
```

#### Steam Deck, Linux, and Mac


#### Windows

### Basic usage

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

# remomve a non-Steam game
$ nonsteam delete -w 4148342750

... Deleted app with ID: 4148342750
```

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


### Environment variables

If you find you keep reading and writing to the same file, which is very typical, and you're tired of typing `-w -i <path>`, you can use the following environment variables to set defaults:

```sh
NONSTEAM_OPTION_INPUT="$HOME/.steam/steam/userdata/241873089/config/shortcuts.vdf"
NONSTEAM_OPTION_OVERWRITE=true
```

