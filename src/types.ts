import { STEAM_FIELDS } from "./constants";

type ExtendsUnion<T, U extends T> = U;

export type FieldPrimitiveType = number | string

export type EntryObject = {
  appid: number;
  AppName: string;
  Exe: string;
  StartDir: string;
  icon: string;
  ShortcutPath: string;
  LaunchOptions: string;
  IsHidden: boolean;
  AllowDesktopConfig: boolean;
  AllowOverlay: boolean;
  OpenVR: boolean;
  Devkit: boolean;
  DevkitGameID: string;
  DevkitOverrideAppID: string;
  LastPlayTime: Date;
  FlatpakAppID: string;
  tags: Array<string>;
};

export type SteamFieldKey = keyof typeof STEAM_FIELDS;

export type SteamFieldBooleanKey = ExtendsUnion<
  SteamFieldKey,
  "IsHidden" | "AllowDesktopConfig" | "AllowOverlay" | "Devkit" | "OpenVR"
>;
export type SteamFieldNumberKey = ExtendsUnion<SteamFieldKey, "appid">;
export type SteamFieldDateKey = ExtendsUnion<SteamFieldKey, "LastPlayTime">;
export type SteamFieldStringKey = ExtendsUnion<
  SteamFieldKey,
  "AppName"
  | "Exe"
  | "StartDir"
  | "icon"
  | "ShortcutPath"
  | "LaunchOptions"
  | "DevkitGameID"
  | "DevkitOverrideAppID"
  | "FlatpakAppID"
>;
export type SteamFieldStringArrayKey = ExtendsUnion<SteamFieldKey, "tags">;

export type SteamFieldNumberPrimitiveKey = SteamFieldNumberKey | SteamFieldBooleanKey | SteamFieldDateKey;
export type SteamFieldStringPrimitiveKey = SteamFieldStringKey;
export type SteamFieldStringArrayPrimitiveKey = SteamFieldStringArrayKey

export type SteamField = typeof STEAM_FIELDS[SteamFieldKey];

export type QuotedString = string;

export type FieldType = number | string | QuotedString | boolean | Date | Array<string>;

export type PrimitiveTypeFromType<TType extends FieldType> =
  TType extends number ? number :
  TType extends boolean ? number :
  TType extends Date ? number :
  TType extends string ? string :
  TType extends QuotedString ? string :
  TType extends Array<string> ? Array<string> :
  never;

export type TypeFromKey<TKey extends SteamFieldKey> =
  TKey extends "appid" ? number :
  TKey extends "AppName" ? string :
  TKey extends "Exe" ? string :
  TKey extends "StartDir" ? string :
  TKey extends "icon" ? string :
  TKey extends "ShortcutPath" ? string :
  TKey extends "LaunchOptions" ? string :
  TKey extends "IsHidden" ? boolean :
  TKey extends "AllowDesktopConfig" ? boolean :
  TKey extends "AllowOverlay" ? boolean :
  TKey extends "OpenVR" ? boolean :
  TKey extends "Devkit" ? boolean :
  TKey extends "DevkitGameID" ? string :
  TKey extends "DevkitOverrideAppID" ? string :
  TKey extends "LastPlayTime" ? Date :
  TKey extends "FlatpakAppID" ? string :
  TKey extends "tags" ? Array<string> :
  never;
