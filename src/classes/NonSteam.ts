import { Entry, IEntry } from "./Entry";
import { Shortcuts } from "./Shortcuts";
import { getSteamInstallInfo } from "../utils";
import path from "path";
import fs from "fs/promises";
import { file as tmpFile, dir as tmpDir } from "tmp-promise";
import { ImageKind } from "../types";

const imageSuffixMap: Record<ImageKind, string> = {
  hero: "_hero",
  logo: "_logo",
  gridHoriz: "",
  icon: "_icon",
  gridVert: "p",
};

const getImageFilename = (id: number, imageKind: ImageKind, extArg?: string) => {
  const ext = extArg?.replace(/^\./, '');
  return `${id}${imageSuffixMap[imageKind]}${ext ? `.${ext}` : ""}`;
}

export class NonSteam {
  public readonly shortcuts: Shortcuts;
  public readonly savePath: string;
  public userId?: string;
  private _installInfo: Awaited<ReturnType<typeof getSteamInstallInfo>> | undefined;
  private _newImages: Record<string, { sourcePath: string, destPath: string }> = {};

  constructor(shortcuts: Shortcuts & { loadedPath: string });
  constructor(shortcuts: Shortcuts, savePath: string);
  constructor(shortcuts: Shortcuts, savePath?: string) {
    this.shortcuts = shortcuts;
    this.savePath = (savePath ? savePath : shortcuts.loadedPath)!;
  }

  async getInstallInfo() {
    if (this._installInfo === null) {
      this._installInfo = await getSteamInstallInfo();
    }
    return this._installInfo;
  }

  get installInfo() {
    return this._installInfo;
  }

  get userInfo() {
    if (this.userId) {
      return this.installInfo?.users.find(user => user.id === this.userId);
    }
    return this.installInfo?.users[0];
  }

  static async load(path?: string) {
    const shortcuts = await Shortcuts.load(path);
    const nonsteam = new NonSteam(shortcuts);
    nonsteam._installInfo = await getSteamInstallInfo();
    return nonsteam;
  }

  public getEntry(id: number): Entry | undefined {
    return this.shortcuts.getEntry(id);
  }

  public addEntry(entry: Entry | Partial<IEntry>): this {
    this.shortcuts.addEntry(entry);
    return this;
  }

  public addEntries(entries: Array<Entry | Partial<IEntry>>): this {
    entries.forEach(this.addEntry);
    return this;
  }

  public deleteEntry(id: number): this {
    this.shortcuts.deleteEntry(id);
    return this;
  }

  public editEntry(id: number, entry: Entry | Partial<IEntry>): this {
    this.shortcuts.editEntry(id, entry);
    return this;
  }

  public async setImage(id: number, imageKind: ImageKind, image: string): Promise<NonSteam> {
    if (image.match(/^https?:\/\//)) {
      return await this.setImageFromUrl(id, imageKind, image);
    }
    return this.setImageFromFile(id, imageKind, image);
  }

  public async setImageFromUrl(id: number, imageKind: ImageKind, imageUrl: string): Promise<NonSteam> {
    const res = await fetch(imageUrl);
    const buf = await res.arrayBuffer();
    const ext = path.parse(new URL(imageUrl).pathname).ext;
    const out = `${(await tmpFile()).path}${ext ? `${ext}` : ""}`;
    await fs.writeFile(out, new Uint8Array(buf));
    return this.setImageFromFile(id, imageKind, out);
  }

  public setImageFromFile(id: number, imageKind: ImageKind, image: string): NonSteam {
    if (!this.userInfo) {
      return this;
    }
    const ext = path.parse(image).ext;
    const filename = getImageFilename(id, imageKind, ext);
    const destPath = path.resolve(this.userInfo.paths.grid, filename);

    this._newImages[`${id}_${imageKind}`] = {
      sourcePath: image,
      destPath,
    };

    if (imageKind === "icon") {
      this.editEntry(id, { icon: destPath })
    }
    return this;
  }

  public async save(outputPath?: string): Promise<this> {
    const userInfo = this.userInfo;
    if (!userInfo) {
      return this;
    }
    const newImageNames = Object.values(this._newImages)
      .map(({ destPath }) => destPath)
      .map(p => path.parse(p).name)
    const imagesToDelete = newImageNames.length <= 0 ? [] : (await fs.readdir(userInfo.paths.grid))
      .filter(filename => filename.match(new RegExp(`^(?:${newImageNames.join("|")})\.`)))
      .map(filename => path.resolve(userInfo.paths.grid, filename));

    await Promise.all(imagesToDelete.map(image => fs.rm(image)));
    await Promise.all(Object.values(this._newImages).map(({ sourcePath, destPath }) => fs.cp(sourcePath, destPath)));
    await this.shortcuts.save(outputPath);
    return this;
  }
}
