import { BS, NUL, SOH, STEAM_FIELDS, STX } from "./constants";
import { SteamFieldKey } from "./types";
import { promisified as regedit } from "regedit";
import fs from "fs";
import os from "os";
import path from "path";

function isPrintable(str: string) {
  return /^[\x20-\x7F]*$/.test(str);
};

export const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const bufferFromMixed = (...args: Array<number | string | Buffer>): Buffer => {
  const buffers: Array<Buffer> = args.map(v => {
    if (typeof v === "string") {
      return Buffer.from(v);
    }
    if (typeof v === "number") {
      return Buffer.of(v);
    }
    return v;
  });
  return Buffer.concat(buffers);
};

export const findIndexOfBufferInBuffer = (haystack: Buffer, needle: Buffer): number => {
  let isMatch = false;
  return haystack.findIndex((b, i) => {
    if (b === needle[0]) {
      for (const j of needle.keys()) {
        isMatch = true;
        if (needle[j] !== haystack[i + j]) {
          isMatch = false;
          break;
        }
      }
    }
    return isMatch;
  });
};

export const findShortcutsFile = async (): Promise<[boolean, string, Array<string>] | [false, undefined, Array<string>]> => {
  if (os.platform() === "win32") {
    const steamUsersKey = String.raw`HKCU\SOFTWARE\Valve\Steam\Users`;
    const steamPathKey = String.raw`HKCU\SOFTWARE\Valve\Steam`;

    const records = await regedit.list([steamUsersKey, steamPathKey]);
    const userId = records[steamUsersKey].keys[0] as string;
    const steamPath = records[steamPathKey].values.SteamPath?.value as string;

    if (!userId || !steamPath) {
      return [false, undefined, []];
    }

    const fullPathDir = path.resolve(steamPath, "userdata", userId, "config");
    const fullPath = path.resolve(fullPathDir, "shortcuts.vdf")
    if (fs.existsSync(fullPathDir)) {
      return [fs.existsSync(fullPath), fullPath, [fullPath]];
    }
    return [false, undefined, [fullPath]];
  }

  const searchPaths = [
    path.resolve(os.homedir(), ".steam/steam"),
    path.resolve(os.homedir(), ".local/share/Steam"),
    path.resolve(os.homedir(), "snap/steam"),
    path.resolve(os.homedir(), ".var/app/com.valvesoftware.Steam/.steam/steam"),
  ];
  const usersPath = searchPaths.find(p => fs.existsSync(path.resolve(p, "userdata")));
  if (!usersPath) {
    return [false, undefined, searchPaths];
  }

  const userDirs: Array<string> = [];
  try {
    fs.readdirSync(usersPath).forEach(dir => userDirs.push(dir));
  } catch {
    // continue regardless of error
  }
  if (!userDirs.length) {
    return [false, undefined, searchPaths];
  }

  const fullPathDir = path.resolve(usersPath, userDirs[0], "config");
  const fullPath = path.resolve(fullPathDir, "shortcuts.vdf");
  if (fs.existsSync(fullPathDir)) {
    return [fs.existsSync(fullPath), fullPath, searchPaths];
  }
  return [false, undefined, searchPaths];
};

export const getGenericFieldBuffer = (buf: Buffer, key: string, type: "string" | "number" | "stringArray") => {
  const rangeFinder: () => [number, number] = {
    number: (): [number, number] => {
      const startSearch = bufferFromMixed(Buffer.of(STX), key, NUL);
      const startIndex = findIndexOfBufferInBuffer(buf, startSearch);
      const endIndex = startIndex + startSearch.length + 4;
      return [startIndex, endIndex];
    },
    string: (): [number, number] => {
      const startSearch = bufferFromMixed(Buffer.of(SOH), key, NUL);
      const startIndex = findIndexOfBufferInBuffer(buf, startSearch);

      let nuls = 0;
      const endIndex = 1 + buf.findIndex((b, i) => {
        if (i <= startIndex) {
          return false;
        }
        if (b === NUL) {
          nuls++;
        }
        return nuls >= 2;
      });

      return [startIndex, endIndex];
    },
    stringArray: (): [number, number] => {
      const startSearch = bufferFromMixed(Buffer.of(NUL, NUL), key, NUL);
      const startIndex = 1 + findIndexOfBufferInBuffer(buf, startSearch);
      const endIndex = buf.length;
      return [startIndex, endIndex];
    }
  }[type];

  return buf.subarray(...rangeFinder());
}

export const parseFieldBuffer = (buf: Buffer): [string, number | string | Array<string>] | [undefined, undefined] => {
  switch (buf[0]) {
    case STX:
      return parseNumberBuffer(buf);
    case SOH:
      return parseStringBuffer(buf);
    case NUL:
      return parseStringArrayBuffer(buf);
  }
  return [undefined, undefined];
}

export const parseNumberBuffer = (buf: Buffer): [string, number] => {
  const keyEndIndex = buf.findIndex(b => b === NUL);
  const key = buf.subarray(1, keyEndIndex).toString();
  const valueBuffer = buf.subarray(keyEndIndex + 1);
  return [key, valueBuffer.readUint32LE()];
};

export const parseStringBuffer = (buf: Buffer): [string, string] => {
  const keyEndIndex = buf.findIndex(b => b === NUL);
  const key = buf.subarray(1, keyEndIndex).toString();
  const valueBuffer = buf.subarray(keyEndIndex + 1, buf.length - 1);
  return [key, valueBuffer.toString()];
};

export const parseStringArrayBuffer = (buf: Buffer): [string, Array<string>] => {
  const keyEndIndex = 1 + buf.subarray(1).findIndex(b => b === NUL);
  const key = buf.subarray(1, keyEndIndex).toString();
  const values: Array<string> = [];
  let valueBuffer = buf.subarray(keyEndIndex + 1, buf.length);
  let i = 0;
  while (valueBuffer.length) {
    const elBuffer = getGenericFieldBuffer(valueBuffer, `${i}`, "string");
    if (!elBuffer.length) {
      break;
    }
    const [, elValue] = parseStringBuffer(elBuffer);
    values.push(elValue);
    valueBuffer = valueBuffer.subarray(elBuffer.length);
    i++;
  }
  return [key, values];
};

export const getFieldBuffer = (buf: Buffer, key: SteamFieldKey): Buffer => {
  const fieldDef = STEAM_FIELDS[key];
  return getGenericFieldBuffer(buf, key, fieldDef.primitiveType);
};

export const getRandomAppId = () => {
  return getRandomInt(1000000000, 9999999999);
};

export const dump = (buf: Buffer) => {
  const stringArray: Array<string> = [];
  buf.forEach(b => {
    let char = `${String.fromCharCode(b)}`;
    if (!isPrintable(char)) {
      switch (b) {
        case NUL:
          char = "NUL";
          break;
        case SOH:
          char = "SOH";
          break;
        case STX:
          char = "STX";
          break;
        case BS:
          char = "BS";
          break;
        default:
          char = `${b}`
      }
      char = `{${char}}`;
    }
    stringArray.push(char);
  });
  console.log(stringArray.join(""));
};

