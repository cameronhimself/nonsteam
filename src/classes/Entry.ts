import {
  BooleanField,
  DateField,
  Field,
  IField,
  NumberField,
  StringArrayField,
  StringField,
} from "./Field";
import { BLANK_ENTRY, STEAM_FIELD_KEYS } from "../constants";
import {
  SteamFieldKey,
  SteamFieldBooleanKey,
  SteamFieldNumberKey,
  SteamFieldDateKey,
  SteamFieldStringKey,
  SteamFieldStringArrayKey,
  EntryObject,
} from "../types";
import { bufferFromMixed, getFieldBuffer, getRandomAppId } from "../utils";

export interface IEntry {
  appId: number;
  appName: string;
  exe: string;
  startDir: string;
  icon: string;
  shortcutPath: string;
  launchOptions: string;
  isHidden: boolean;
  allowDesktopConfig: boolean;
  allowOverlay: boolean;
  openVr: boolean;
  devkit: boolean;
  devkitGameId: string;
  devkitOverrideAppId: string;
  lastPlayTime: Date;
  flatpakAppId: string;
  tags: Array<string>;
}

export class Entry implements IEntry {
  public fields: Array<IField<SteamFieldKey>>;

  constructor(config?: Partial<IEntry>) {
    this.fields = [
      Field.fromKeyValue("appid", config?.appId || getRandomAppId()),
      Field.fromKeyValue("AppName", config?.appName || ""),
      Field.fromKeyValue("Exe", config?.exe || ""),
      Field.fromKeyValue("StartDir", config?.startDir || ""),
      Field.fromKeyValue("icon", config?.icon || ""),
      Field.fromKeyValue("ShortcutPath", config?.shortcutPath || ""),
      Field.fromKeyValue("LaunchOptions", config?.launchOptions || ""),
      Field.fromKeyValue("IsHidden", Number(config?.isHidden || false)),
      Field.fromKeyValue("AllowDesktopConfig", Number(config?.allowDesktopConfig || false)),
      Field.fromKeyValue("AllowOverlay", Number(config?.allowOverlay || false)),
      Field.fromKeyValue("OpenVR", Number(config?.openVr || false)),
      Field.fromKeyValue("Devkit", Number(config?.devkit || false)),
      Field.fromKeyValue("DevkitGameID", config?.devkitGameId || ""),
      Field.fromKeyValue("DevkitOverrideAppID", config?.devkitOverrideAppId || ""),
      Field.fromKeyValue("LastPlayTime", Number(config?.lastPlayTime ? Math.round(Number(config.lastPlayTime) / 1000) : 0)),
      Field.fromKeyValue("FlatpakAppID", config?.flatpakAppId || ""),
      Field.fromKeyValue("tags", config?.tags || []),
    ];
  }

  static fromBuffer(buf: Buffer): Entry {
    const entry = new Entry();
    STEAM_FIELD_KEYS.forEach(k => {
      const fieldBuffer = getFieldBuffer(buf, k);
      if (buf.length) {
        entry.setField(k, Field.fromBuffer(fieldBuffer));
      }
    });
    return entry;
  }

  private setField(key: SteamFieldKey, field: IField<SteamFieldKey>): void {
    const idx = this.fields.findIndex(field => field.key === key);
    if (idx != -1) {
      this.fields[idx] = field
    }
  }

  public setValues(values: Partial<IEntry>) {
    for (const k in values) {
      if (k in BLANK_ENTRY) {
        const value = values[k as keyof IEntry] as any; //eslint-disable-line
        this[k as keyof typeof this] = value;
      }
    }
  }

  public getField(key: SteamFieldStringKey): StringField;
  public getField(key: SteamFieldNumberKey ): NumberField;
  public getField(key: SteamFieldBooleanKey): BooleanField;
  public getField(key: SteamFieldDateKey): DateField;
  public getField(key: SteamFieldStringArrayKey): StringArrayField;
  public getField(key: SteamFieldKey): Field {
    return this.fields.find(field => field.key === key)!;
  }

  public toBuffer(): Buffer {
    return bufferFromMixed(
      ...this.fields.map(field => field.toBuffer()),
    );
  }

  public toObject(): EntryObject {
    return {
      appid: this.appId,
      AppName: this.appName,
      Exe: this.exe,
      StartDir: this.startDir,
      icon: this.icon,
      ShortcutPath: this.shortcutPath,
      LaunchOptions: this.launchOptions,
      IsHidden: this.isHidden,
      AllowDesktopConfig: this.allowDesktopConfig,
      AllowOverlay: this.allowOverlay,
      OpenVR: this.openVr,
      Devkit: this.devkit,
      DevkitGameID: this.devkitGameId,
      DevkitOverrideAppID: this.devkitOverrideAppId,
      LastPlayTime: this.lastPlayTime,
      FlatpakAppID: this.flatpakAppId,
      tags: this.tags,
    };
  }

  get appId() {
    return this.getField("appid").value;
  }
  set appId(appId) {
    this.getField("appid").value = appId;
  }
  
  get appName() {
    return this.getField("AppName").value;
  }
  set appName(appName) {
    this.getField("AppName").value = appName;
  }
  
  get exe() {
    return this.getField("Exe").value;
  }
  set exe(exe) {
    this.getField("Exe").value = exe;
  }
  
  get startDir() {
    return this.getField("StartDir").value;
  }
  set startDir(startDir) {
    this.getField("StartDir").value = startDir;
  }
  
  get icon() {
    return this.getField("icon").value;
  }
  set icon(icon) {
    this.getField("icon").value = icon;
  }
  
  get shortcutPath() {
    return this.getField("ShortcutPath").value;
  }
  set shortcutPath(shortcutPath) {
    this.getField("ShortcutPath").value = shortcutPath;
  }
  
  get launchOptions() {
    return this.getField("LaunchOptions").value;
  }
  set launchOptions(launchOptions) {
    this.getField("LaunchOptions").value = launchOptions;
  }
  
  get isHidden() {
    return this.getField("IsHidden").value;
  }
  set isHidden(isHidden) {
    this.getField("IsHidden").value = isHidden;
  }
  
  get allowDesktopConfig() {
    return this.getField("AllowDesktopConfig").value;
  }
  set allowDesktopConfig(allowDesktopConfig) {
    this.getField("AllowDesktopConfig").value = allowDesktopConfig;
  }
  
  get allowOverlay() {
    return this.getField("AllowOverlay").value;
  }
  set allowOverlay(allowOverlay) {
    this.getField("AllowOverlay").value = allowOverlay;
  }
  
  get openVr() {
    return this.getField("OpenVR").value;
  }
  set openVr(openVr) {
    this.getField("OpenVR").value = openVr;
  }
  
  get devkit() {
    return this.getField("Devkit").value;
  }
  set devkit(devkit) {
    this.getField("Devkit").value = devkit;
  }

  get devkitGameId() {
    return this.getField("DevkitGameID").value;
  }
  set devkitGameId(devkitGameId) {
    this.getField("DevkitGameID").value = devkitGameId;
  }

  get devkitOverrideAppId() {
    return this.getField("DevkitOverrideAppID").value;
  }
  set devkitOverrideAppId(devkitOverrideAppId) {
    this.getField("DevkitOverrideAppID").value = devkitOverrideAppId;
  }
  
  get lastPlayTime() {
    return this.getField("LastPlayTime").value;
  }
  set lastPlayTime(lastPlayTime) {
    this.getField("LastPlayTime").value = lastPlayTime;
  }
  
  get flatpakAppId() {
    return this.getField("FlatpakAppID").value;
  }
  set flatpakAppId(flatpakAppId) {
    this.getField("FlatpakAppID").value = flatpakAppId;
  }

  get tags() {
    return this.getField("tags").value;
  }
  set tags(tags) {
    this.getField("tags").value = tags;
  }
}
