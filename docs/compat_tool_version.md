# Compatibility tool version

## Config location

Compatibility tool version overrides are defined in `$STEAM_DIR/config/config.vdf` (`~/.steam/steam/config/config.vdf` on SteamOS) under `CompatToolMapping`. The config file is a custom Steam string data format.

## Valid values

The values are like `proton_9`, `proton_513`, etc. There doesn't seem to be a canonical list of these anywhere that I can find in the Steam files, so I'm assuming they're compiled into the binary. At time of writing (Jan. 5 2026) the values that I'm aware of are:

| Value | Name |
-|-
| `steamlinuxruntime` | Steam Linux Runtime |
| `Proton-stl` | Steam Tinker Launch |
| `proton_hotfix` | Proton Hotfix |
| `proton_experimental` | Proton Experimental |
| `proton_10` | Proton 10.0 |
| `proton_9` | Proton 9.0 |
| `proton_8` | Proton 8.0 |
| `proton_7` | Proton 7.0 |
| `proton_63` | Proton 6.3 |
| `proton_5` | Proton 5.0 |
| `proton_513` | Proton 5.13 |
| `proton_5` | Proton 5.0 |
| `proton_42` | Proton 4.2 |
| `proton_411` | Proton 4.11 |
| `proton_37` | Proton 3.7 |
| `proton_316` | Proton 3.16 |

## Setting with `nonsteam`

Pass the `--compatibility-tool-version [version]` option with `edit` or `add`. It will accept any string value for future-proofing, so make sure to type it correctly. To remove the override, pass no value. Example:

```sh
# Set override to proton_9
nonsteam edit -w 123456789 --compatibility-tool-version proton_9

# Remove override
nonsteam edit -w 123456789 --compatibility-tool-version
```

If you're trying to set a version that isn't in the above list you'll either need to guess the correct version string, or set it manually once so you can pull the exact string from the config file. If you set an invalid value the game will immediately crash when you try to launch it.

## Gritty details

In the `config.vdf` file, runtime overrides are defined like this:

```
"239070"
{
        "name"          "proton_9"
        "config"                ""
        "priority"              "250"
}
```

The `priority` field implies there are multiple ways to set the value, with different methods having different orders of precedence, but I couldn't find any method other than setting it in the compatibility section of the game's properties.

With this in mind, to generally simplify things by not having to worry about reconciling/merging priorities, setting a version with `nonsteam` will completely overwrite any entries that already exist in `config.vdf` for the passed game ID. It will write the same priority that gets written when you set it through the Steam interface, 250. If you need more fine-grained control, I'd suggest not using `nonsteam` for this purpose.