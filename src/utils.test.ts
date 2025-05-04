import { NUL, SOH, STX } from "./constants";
import {
  bufferFromMixed,
  dump,
  findIndexOfBufferInBuffer,
  getFieldBuffer,
  getGenericFieldBuffer,
  parseNumberBuffer,
  parseStringArrayBuffer,
  parseStringBuffer,
} from "./utils";
import { Shortcuts } from "./classes";

describe("parseNumberBuffer", () => {
  const num = 2515600387;
  const numBuffer = Buffer.alloc(4);
  numBuffer.writeUInt32LE(num);
  const buf = bufferFromMixed(STX, "numericKey", NUL, numBuffer);
  const [key, value] = parseNumberBuffer(buf);
  expect(key).toEqual("numericKey");
  expect(value).toEqual(num);
});

describe("parseStringBuffer", () => {
  const buf = bufferFromMixed(SOH, "someKey", NUL, "some value", NUL);
  const [key, value] = parseStringBuffer(buf);
  expect(key).toEqual("someKey");
  expect(value).toEqual("some value");
});

describe("parseStringArrayBuffer", () => {
  it("parses an empty array", () => {
    const buf = bufferFromMixed(NUL, "emptyTags", NUL);
    const [k, value] = parseStringArrayBuffer(buf);
    expect(k).toEqual("emptyTags");
    expect(value).toEqual([]);
  });

  const buf = bufferFromMixed(
    NUL, "tags", NUL,
      SOH, "0", NUL, "some tag value", NUL,
      SOH, "1", NUL, "Another tag", NUL,
  );
  const [k, value] = parseStringArrayBuffer(buf);
  expect(k).toEqual("tags");
  expect(value.length).toEqual(2);
  expect(value[0]).toEqual("some tag value");
  expect(value[1]).toEqual("Another tag");
});

// describe("getGenericFieldBuffer", () => {
//   const mock = bufferFromMixed(
//     NUL, "shortcuts", NUL,
//     NUL, "0", NUL,
//     STX, "appid",        NUL, 0x43, 0xA4, 0xF3, 0x19,
//     SOH, "AppName",      NUL, "App name goes here", NUL,
//     SOH, "StartDir",     NUL, '"Directory to start in"', NUL,
//     SOH, "icon",         NUL, '"Path to icon"', NUL,
//     SOH, "ShortcutPath", NUL, "Shortcut path here", NUL,
//     STX, "LastPlayTime", NUL, 0x68, 0x10, 0x36, 0xAA,
//     NUL, "tags",         NUL,
//       SOH, "0", NUL, "some tag", NUL,
//       SOH, "1", NUL, "a second tag", NUL,
//   );
//   const appid = getGenericFieldBuffer(mock, "appid");
//   expect(appid.length).toEqual(11);
//   expect(appid[0]).toEqual(STX);
//   expect(appid[appid.length - 4]).toEqual(0x43);
//   expect(appid[appid.length - 1]).toEqual(0x19);

//   const lastPlayTime = getFieldBuffer(mock, "LastPlayTime");
//   expect(lastPlayTime.length).toEqual(18);
//   expect(lastPlayTime[0]).toEqual(STX);
//   expect(lastPlayTime[lastPlayTime.length - 4]).toEqual(0x68);
//   expect(lastPlayTime[lastPlayTime.length - 1]).toEqual(0xAA);

// });

describe("bufferFromMixed", () => {
  it("converts single string into matching Buffer", () => {
    const buf = bufferFromMixed("foobar");
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.toString()).toEqual("foobar");
  });
  it("converts numbers into matching Buffer", () => {
    const buf = bufferFromMixed(0, 0x09, 0x07);
    expect(buf[0]).toEqual(0);
    expect(buf[1]).toEqual(0x09);
    expect(buf[2]).toEqual(0x07);
  });
  it("converts mixed numbers and strings into matching Buffer", () => {
    const buf = bufferFromMixed(0x43, "oo", 0x6C);
    expect(buf.toString()).toEqual("Cool");
  });
  it("converts mixed numbers, strings, and buffers into matching Buffer", () => {
    const buf = bufferFromMixed(0x43, "oo", 0x6C, Buffer.from("!!!"));
    expect(buf.toString()).toEqual("Cool!!!");
  });
});

describe("findIndexOfBufferInBuffer", () => {
  it("returns correct index of buffer", () => {
    const haystack = Buffer.from([0x0, 0x5, 0x18, 0xFF, 0xC9]);
    const needle = Buffer.from([0x18, 0xFF]);
    expect(findIndexOfBufferInBuffer(haystack, needle)).toEqual(2);
  });
  it("returns -1 on failed search", () => {
    const haystack = Buffer.from([0x0, 0x5, 0x18, 0xFF, 0xC9]);
    const needle = Buffer.from([0x18, 0xFA]);
    expect(findIndexOfBufferInBuffer(haystack, needle)).toEqual(-1);
  });
  it("returns index of first match with multiple matches", () => {
    const haystack = Buffer.from([0x0, 0x5, 0x18, 0xFF, 0xC9, 0x18, 0xFF]);
    const needle = Buffer.from([0x18, 0xFF]);
    expect(findIndexOfBufferInBuffer(haystack, needle)).toEqual(2);
  });
});

describe("getFieldBuffer", () => {
  it("works", () => {
    const mock = bufferFromMixed(
      NUL, "shortcuts", NUL,
      NUL, "0", NUL,
      STX, "appid",        NUL, 0x43, 0xA4, 0xF3, 0x19,
      SOH, "AppName",      NUL, "App name goes here", NUL,
      SOH, "StartDir",     NUL, '"Directory to start in"', NUL,
      SOH, "icon",         NUL, '"Path to icon"', NUL,
      SOH, "ShortcutPath", NUL, "Shortcut path here", NUL,
      STX, "LastPlayTime", NUL, 0x68, 0x10, 0x36, 0xAA,
      SOH, "FlatpakAppID", NUL, "12345", NUL,
      NUL, "tags",         NUL,
        SOH, "0", NUL, "some tag", NUL,
        SOH, "1", NUL, "a second tag", NUL,
    );
    const appid = getFieldBuffer(mock, "appid");
    expect(appid.length).toEqual(11);
    expect(appid[0]).toEqual(STX);
    expect(appid[appid.length - 4]).toEqual(0x43);
    expect(appid[appid.length - 1]).toEqual(0x19);

    const lastPlayTime = getFieldBuffer(mock, "LastPlayTime");
    expect(lastPlayTime.length).toEqual(18);
    expect(lastPlayTime[0]).toEqual(STX);
    expect(lastPlayTime[lastPlayTime.length - 4]).toEqual(0x68);
    expect(lastPlayTime[lastPlayTime.length - 1]).toEqual(0xAA);

    const tags = getFieldBuffer(mock, "tags");
    expect(tags.length).toEqual(34);
    expect(tags[0]).toEqual(NUL);
    expect(tags.subarray(1, 5).toString()).toEqual("tags");
    expect(tags.subarray(tags.length - 1)[0]).toEqual(NUL);
  });
});
