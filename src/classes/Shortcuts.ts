import fs from "fs/promises";
import { Entry, IEntry } from "./Entry";
import { BS, NUL } from "../constants";
import { bufferFromMixed, dump, findShortcutsFile } from "../utils";
import { EntryObject, FieldType, SteamFieldKey } from "../types";

export class Shortcuts {
  public loadedPath: string | undefined;
  public entries: Array<Entry> = [];

  static fromBuffer(vdfBuf: Buffer) {
    const shortcuts = new Shortcuts();

    let buf = vdfBuf.subarray(11); // skip intro
    let entries: Array<Buffer> = [];
    let done = false;
    while (buf) {
      for (const i of buf.keys()) {
        const b = buf[i];
        if (b === NUL) {
          const entryNumberEndIndex = 1 + buf.subarray(i + 1).findIndex(c => c === NUL);;
          const entryStartIndex = entryNumberEndIndex + 1;
          const entryEndIndex = buf.findIndex((c, j) => c === BS && buf[j + 1] === BS);
          const entryNumber = parseInt(buf.subarray(i + 1, entryNumberEndIndex + 1).toString());
          const entry = buf.subarray(entryStartIndex, entryEndIndex);
          entries[entryNumber] = entry;
          buf = buf.subarray(entryEndIndex + 2);
          break;
        }
        done = true;
      }
      if (done) {
        break;
      }
    }
    shortcuts.entries = entries.map(e => Entry.fromBuffer(e));
    return shortcuts;
  }

  static async load(pathArg?: string): Promise<Shortcuts & { loadedPath: string }> {
    let loadPath: string;
    if (pathArg) {
      loadPath = pathArg;
    } else {
      const [,filePath] = await findShortcutsFile();
      if (!filePath) {
        throw new Error("Could not find shortcuts file to load. If Steam is \
installed somewhere non-standard you'll likely need to explicitly provide the path.");
      }
      loadPath = filePath;
    }
    const shortcuts = await this.fromFile(loadPath);
    return shortcuts as Shortcuts & { loadedPath: string };
  }

  public async save(pathArg?: string): Promise<void> {
    const savePath = pathArg || this.loadedPath;
    if (savePath) {
      await fs.writeFile(savePath, this.toBuffer());
    } else {
      throw new Error("Shortcuts file could not be saved: no save path provided.");
    }
  }

  static async fromFile(file: string): Promise<Shortcuts & { loadedPath: string }> {
    const data = await fs.readFile(file);
    const shortcuts = Shortcuts.fromBuffer(data);
    shortcuts.loadedPath = file;
    return shortcuts as Shortcuts & { loadedPath: string };
  }

  public toBuffer(): Buffer {
    return bufferFromMixed(
      NUL, "shortcuts", NUL,
      ...this.entries.map((entry, i) => bufferFromMixed(
        NUL, String(i), NUL,
        entry.toBuffer(),
        BS, BS,  
      )),
      BS, BS,
    );
  }

  public toObject(): Array<EntryObject> {
    return this.entries.map(e => e.toObject());
  }

  public getEntry(appId: number): Entry | undefined {
    return this.entries.find(e => e.appId === appId);
  }

  public addEntry(entryArg: Entry | Partial<IEntry>): void {
    const entry = entryArg instanceof Entry ? entryArg : new Entry(entryArg);
    this.entries.push(entry);
  }

  public deleteEntry(appId: number): boolean {
    const idx = this.entries.findIndex(e => e.appId === appId);
    if (idx !== -1) {
      this.entries.splice(idx, 1);
      return true;
    }
    return false;
  }

  public setEntry(appId: number, entryArg: Entry | Partial<IEntry>): boolean {
    const idx = this.entries.findIndex(e => e.appId === appId);
    if (idx !== -1) {
      const entry = entryArg instanceof Entry ? entryArg : new Entry(entryArg);
      this.entries[idx] = entry;
      return true;
    }
    return false;
  }

  public editEntry(appId: number, values: Partial<IEntry>): boolean {
    const entry = this.getEntry(appId);
    if (entry) {
      entry.setValues(values);
      return true;
    }
    return false;
  }
}
