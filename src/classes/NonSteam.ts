import { Entry, IEntry } from "./Entry";
import { Shortcuts } from "./Shortcuts";

export class NonSteam {
  public readonly shortcuts: Shortcuts;
  public readonly savePath: string;

  constructor(shortcuts: Shortcuts & { loadedPath: string });
  constructor(shortcuts: Shortcuts, savePath: string);
  constructor(shortcuts: Shortcuts, savePath?: string) {
    this.shortcuts = shortcuts;
    this.savePath = (savePath ? savePath : shortcuts.loadedPath)!;
  }

  static async load(path?: string) {
    const shortcuts = await Shortcuts.load(path);
    const nonsteam = new NonSteam(shortcuts);
    return nonsteam;
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

  public save(): this {
    this.shortcuts.save();
    return this;
  }
}
