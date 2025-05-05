import "mocha";
import { assert } from "chai";
import { NUL, SOH, STX } from "./constants";
import {
  bufferFromMixed,
  findIndexOfBufferInBuffer,
  getFieldBuffer,
  parseNumberBuffer,
  parseStringArrayBuffer,
  parseStringBuffer,
} from "./utils";

describe("parseNumberBuffer", () => {
  it("parses a number from a buffer", () => {
    const num = 2515600387;
    const numBuffer = Buffer.alloc(4);
    numBuffer.writeUInt32LE(num);
    const buf = bufferFromMixed(STX, "numericKey", NUL, numBuffer);
    const [key, value] = parseNumberBuffer(buf);
    assert.strictEqual(key, "numericKey");
    assert.strictEqual(value, num);
  });
});

describe("parseStringBuffer", () => {
  it("parses a string from a buffer", () => {
    const buf = bufferFromMixed(SOH, "someKey", NUL, "some value", NUL);
    const [key, value] = parseStringBuffer(buf);
    assert.strictEqual(key, "someKey");
    assert.strictEqual(value, "some value");
  });
});

describe("parseStringArrayBuffer", () => {
  it("parses an empty array", () => {
    const buf = bufferFromMixed(NUL, "emptyTags", NUL);
    const [k, value] = parseStringArrayBuffer(buf);
    assert.strictEqual(k, "emptyTags");
    assert.deepEqual(value, []);
  });

  it("parses an array of strings", () => {
    const buf = bufferFromMixed(
      NUL, "tags", NUL,
        SOH, "0", NUL, "some tag value", NUL,
        SOH, "1", NUL, "Another tag", NUL,
    );
    const [k, value] = parseStringArrayBuffer(buf);
    assert.strictEqual(k, "tags");
    assert.lengthOf(value, 2);
    assert.strictEqual(value[0], "some tag value");
    assert.strictEqual(value[1], "Another tag");
  });
});

describe("bufferFromMixed", () => {
  it("converts single string into matching Buffer", () => {
    const buf = bufferFromMixed("foobar");
    assert.instanceOf(buf, Buffer);
    assert.strictEqual(buf.toString(), "foobar");
  });
  it("converts numbers into matching Buffer", () => {
    const buf = bufferFromMixed(0, 0x09, 0x07);
    assert.strictEqual(buf[0], 0);
    assert.strictEqual(buf[1], 0x09);
    assert.strictEqual(buf[2], 0x07);
  });
  it("converts mixed numbers and strings into matching Buffer", () => {
    const buf = bufferFromMixed(0x43, "oo", 0x6C);
    assert.strictEqual(buf.toString(), "Cool");
  });
  it("converts mixed numbers, strings, and buffers into matching Buffer", () => {
    const buf = bufferFromMixed(0x43, "oo", 0x6C, Buffer.from("!!!"));
    assert.strictEqual(buf.toString(), "Cool!!!");
  });
});

describe("findIndexOfBufferInBuffer", () => {
  it("returns correct index of buffer", () => {
    const haystack = Buffer.from([0x0, 0x5, 0x18, 0xFF, 0xC9]);
    const needle = Buffer.from([0x18, 0xFF]);
    assert.strictEqual(findIndexOfBufferInBuffer(haystack, needle), 2);
  });
  it("returns -1 on failed search", () => {
    const haystack = Buffer.from([0x0, 0x5, 0x18, 0xFF, 0xC9]);
    const needle = Buffer.from([0x18, 0xFA]);
    assert.strictEqual(findIndexOfBufferInBuffer(haystack, needle), -1);
  });
  it("returns index of first match with multiple matches", () => {
    const haystack = Buffer.from([0x0, 0x5, 0x18, 0xFF, 0xC9, 0x18, 0xFF]);
    const needle = Buffer.from([0x18, 0xFF]);
    assert.strictEqual(findIndexOfBufferInBuffer(haystack, needle), 2);
  });
});

describe("getFieldBuffer", () => {
  it("extracts the expected field buffers", () => {
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
    assert.strictEqual(appid.length, 11);
    assert.strictEqual(appid[0], STX);
    assert.strictEqual(appid[appid.length - 4], 0x43);
    assert.strictEqual(appid[appid.length - 1], 0x19);

    const lastPlayTime = getFieldBuffer(mock, "LastPlayTime");
    assert.strictEqual(lastPlayTime.length, 18);
    assert.strictEqual(lastPlayTime[0], STX);
    assert.strictEqual(lastPlayTime[lastPlayTime.length - 4], 0x68);
    assert.strictEqual(lastPlayTime[lastPlayTime.length - 1], 0xAA);

    const tags = getFieldBuffer(mock, "tags");
    assert.strictEqual(tags.length, 34);
    assert.strictEqual(tags[0], NUL);
    assert.strictEqual(tags.subarray(1, 5).toString(), "tags");
    assert.strictEqual(tags.subarray(tags.length - 1)[0], NUL);
  });
});
