import { buffer } from "stream/consumers";
import { NUL, SOH, STEAM_FIELDS, STX } from "../constants";
import {
  SteamFieldKey,
  SteamFieldNumberKey,
  SteamFieldStringKey,
  SteamFieldBooleanKey,
  SteamFieldDateKey,
  SteamFieldNumberPrimitiveKey,
  SteamFieldStringPrimitiveKey,
  PrimitiveTypeFromType,
  TypeFromKey,
  SteamFieldStringArrayKey,
  SteamFieldStringArrayPrimitiveKey,
} from "../types";
import { bufferFromMixed, dump, parseFieldBuffer, parseNumberBuffer, parseStringArrayBuffer, parseStringBuffer } from "../utils";

export abstract class Field {
  static fromKeyValue(key: SteamFieldBooleanKey, value: number): BooleanField;
  static fromKeyValue(key: SteamFieldNumberKey, value: number): NumberField;
  static fromKeyValue(key: SteamFieldDateKey, value: number): DateField;
  static fromKeyValue(key: SteamFieldStringKey, value: string): StringField;
  static fromKeyValue(key: SteamFieldStringArrayKey, value: Array<string>): StringArrayField;
  static fromKeyValue(key: SteamFieldKey, value: string | number | Array<string>) {
    const fieldDef = STEAM_FIELDS[key as SteamFieldKey];
    if (!fieldDef) {
      throw new Error(`Field '${key}' not expected`);
    }
    switch (fieldDef.type) {
      case "string":
        return new StringField(key as SteamFieldStringKey, value as string);
      case "number":
        return new NumberField(key as SteamFieldNumberKey, value as number);
      case "date":
        return new DateField(key as SteamFieldDateKey, value as number);
      case "boolean":
        return new BooleanField(key as SteamFieldBooleanKey, value as number);
      case "stringArray":
        return new StringArrayField(key as SteamFieldStringArrayKey, value as Array<string>);
    }
  }

  static fromBuffer<TKey extends SteamFieldBooleanKey>(raw: Buffer): BooleanField;
  static fromBuffer<TKey extends SteamFieldNumberKey>(raw: Buffer): NumberField;
  static fromBuffer<TKey extends SteamFieldDateKey>(raw: Buffer): DateField;
  static fromBuffer<TKey extends SteamFieldStringKey>(raw: Buffer): StringField;
  static fromBuffer<TKey extends SteamFieldStringArrayKey>(raw: Buffer): StringArrayField;
  static fromBuffer(raw: Buffer): PrimitiveField | undefined {
    const [key,] = parseFieldBuffer(raw);
    if (!key) {
      throw new Error("Field key can't be determined");
    }
    const fieldDef = STEAM_FIELDS[key as SteamFieldKey];
    if (!fieldDef) {
      throw new Error(`Field '${key}' not expected`);
    }
    switch (fieldDef.type) {
      case "string":
        return StringField.fromBuffer(raw);
      case "number":
        return NumberField.fromBuffer(raw);
      case "date":
        return DateField.fromBuffer(raw);
      case "boolean":
        return BooleanField.fromBuffer(raw);
      case "stringArray":
        return StringArrayField.fromBuffer(raw);
    }
  }

  toBuffer(): Buffer {
    return Buffer.alloc(0);
  }
}

interface IPrimitiveField<TKey extends SteamFieldKey> {
  key: TKey;
  primitiveValue: PrimitiveTypeFromType<TypeFromKey<TKey>>;
}

export interface IField<
  TKey extends SteamFieldKey,
> extends IPrimitiveField<TKey> {
  value: TypeFromKey<TKey>;
  toBuffer(): Buffer;
}

export abstract class PrimitiveField {};

export class NumberPrimitiveField<TKey extends SteamFieldNumberPrimitiveKey> extends PrimitiveField {
  public key: TKey;
  public primitiveValue: number;
  constructor(key: TKey, value: number) {
    super();
    this.key = key;
    this.primitiveValue = value;
  }

  static fromBuffer(buf: Buffer) {
    const [key, value] = parseNumberBuffer(buf);
    return new this(key as SteamFieldNumberPrimitiveKey, value);
  }

  public toBuffer() {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(this.primitiveValue);
    return bufferFromMixed(STX, this.key, NUL, buf);
  }
}

export class StringPrimitiveField<TKey extends SteamFieldStringPrimitiveKey> extends PrimitiveField {
  public key: TKey;
  public primitiveValue: string;
  constructor(key: TKey, value: string) {
    super();
    this.key = key;
    this.primitiveValue = value;
  }

  static fromBuffer(buf: Buffer) {
    const [key, value] = parseStringBuffer(buf);
    return new this(key as SteamFieldStringPrimitiveKey, value);
  }

  public toBuffer() {
    return bufferFromMixed(SOH, this.key, NUL, this.primitiveValue, NUL);
  }
}

export class StringArrayPrimitiveField<TKey extends SteamFieldStringArrayPrimitiveKey> extends PrimitiveField {
  public key: TKey;
  public primitiveValue: Array<string>;
  constructor(key: TKey, value: Array<string>) {
    super();
    this.key = key;
    this.primitiveValue = value;
  }

  static fromBuffer(buf: Buffer) {
    const [key, value] = parseStringArrayBuffer(buf);
    return new this(key as SteamFieldStringArrayPrimitiveKey, value);
  }

  public toBuffer() {
    return bufferFromMixed(
      NUL, this.key, NUL,
      ...this.primitiveValue.map((s, i) => bufferFromMixed(SOH, i, NUL, s, NUL))
    );
  }
}

export class NumberField extends NumberPrimitiveField<SteamFieldNumberKey> implements IField<SteamFieldNumberKey> {
  get value(): number {
    return this.primitiveValue;
  }
  set value(v: number) {
    this.primitiveValue = v;
  }
}

export class BooleanField extends NumberPrimitiveField<SteamFieldBooleanKey> implements IField<SteamFieldBooleanKey> {
  get value() {
    return Boolean(this.primitiveValue);
  }
  set value(v) {
    this.primitiveValue = Number(v);
  }
}

export class DateField extends NumberPrimitiveField<SteamFieldDateKey> implements IField<SteamFieldDateKey> {
  get value() {
    return new Date(this.primitiveValue * 1000);
  }
  set value(v) {
    this.primitiveValue = Math.round(v.getTime() / 1000);
  }
}

export class StringField extends StringPrimitiveField<SteamFieldStringKey> implements IField<SteamFieldStringKey> {
  get value() {
    return this.primitiveValue;
  }
  set value(value: string) {
    this.primitiveValue = value;
  }
}

export class StringArrayField extends StringArrayPrimitiveField<SteamFieldStringArrayKey> implements IField<SteamFieldStringArrayKey> {
  get value() {
    return this.primitiveValue;
  }
  set value(value: Array<string>) {
    this.primitiveValue = value;
  }
}
