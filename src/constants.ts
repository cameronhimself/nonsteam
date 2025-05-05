import { IEntry } from "./classes";

export const NUL = 0 as const;
export const SOH = 1 as const;
export const STX = 2 as const;
export const BS  = 8 as const;

type SteamFieldBase = {
  primitiveType: "string" | "number" | "stringArray";
  type: "string" | "number" | "quotedString" | "date" | "boolean" | "stringArray";
};

const fieldDefinitions = {
  appid: { type: "number", primitiveType: "number" },
  AppName: { type: "string", primitiveType: "string" },
  Exe: { type: "string", primitiveType: "string" },
  StartDir: { type: "string", primitiveType: "string" },
  icon: { type: "string", primitiveType: "string" },
  ShortcutPath: { type: "string", primitiveType: "string" },
  LaunchOptions: { type: "string", primitiveType: "string" },
  IsHidden: { type: "boolean", primitiveType: "number" },
  AllowDesktopConfig: { type: "boolean", primitiveType: "number" },
  AllowOverlay: { type: "boolean", primitiveType: "number" },
  OpenVR: { type: "boolean", primitiveType: "number" },
  Devkit: { type: "boolean", primitiveType: "number" },
  DevkitGameID: { type: "string", primitiveType: "string" },
  DevkitOverrideAppID: { type: "string", primitiveType: "string" },
  LastPlayTime: { type: "date", primitiveType: "number" },
  FlatpakAppID: { type: "string", primitiveType: "string" },
  tags: { primitiveType: "stringArray", type: "stringArray" },
} satisfies Record<string, SteamFieldBase>;

// Derive types from the object
type FieldDefinitionKey = keyof typeof fieldDefinitions;
type FieldDefinition = { key: FieldDefinitionKey } & SteamFieldBase;

// Build final THINGS map with `id` injected
export const STEAM_FIELDS: Record<FieldDefinitionKey, FieldDefinition> = Object.fromEntries(
  Object.entries(fieldDefinitions).map(([key, value]) => [
    key,
    { key, ...value },
  ])
) as Record<FieldDefinitionKey, FieldDefinition>;

export const STEAM_FIELD_KEYS = Object.keys(STEAM_FIELDS) as Array<keyof typeof STEAM_FIELDS>;

export const BLANK_ENTRY: IEntry = {
  appId: 0,
  appName: "",
  exe: "",
  startDir: "",
  icon: "",
  shortcutPath: "",
  launchOptions: "",
  isHidden: false,
  allowDesktopConfig: false,
  allowOverlay: false,
  openVr: false,
  devkit: false,
  devkitGameId: "",
  devkitOverrideAppId: "",
  lastPlayTime: new Date(0),
  flatpakAppId: "",
  tags: [],
}
