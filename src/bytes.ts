import { TextDecoder, TextEncoder } from "util";

/**
 * This is a simple text encoder using a algorithm that will sum up the last sum with the current byte
 */
export function basicTextEncoder(bytes: Bytes, textBytes: Uint8Array): void {
  bytes.writeNumber(textBytes.length);

  let lastByte;
  for (let k=0; k<textBytes.length;k++) {
    let result = textBytes[k];

    if (lastByte) {
      result = (result + lastByte) % 65535;
    }

    bytes.writeShort(result);
    lastByte = result;
  }
}

/**
 * This is a simple text decoder using a algorithm that will subtract down the current byte with the last result
 */
export function basicTextDecoder(bytes: Bytes): Uint8Array {
  const size = bytes
  .readNumber();

    const resultBytes = [];

    let lastByte;
    for (let i=0; i<size; i++) {
      const byte = bytes.readShort();

      if (!lastByte) {
        resultBytes.push(byte);
      } else {
        let result = byte - lastByte;

        if (result < 0) {
          result = 255 - result;
        }

        resultBytes.push(result);
      }

      lastByte = byte;
    }

    return new Uint8Array(resultBytes);
}

export class Bytes {
  private bytes: number[];
  private encoder: TextEncoder = new TextEncoder();
  private decoder: TextDecoder = new TextDecoder("utf-8");

  private BYTE_NUMBER = 0x01;
  private SHORT_NUMBER = 0x02;
  private INT_NUMBER = 0x04;
  private FLOAT_NUMBER = 0x08;

  static fromString(stringifiedBytes: string): Bytes {
    const bytes = new TextEncoder().encode(stringifiedBytes);
    return new Bytes(Array.from(bytes));
  }

  constructor(bytes: number[] = []) {
    this.bytes = bytes;
  }

  writeByte(byte: number): void {
    if (byte < 0 || byte > 255) {
      throw new RangeError(`Expected byte to range from 0 to 255, got ${byte}`);
    }
    this.bytes.push(byte & 255);
  }

  writeBytes(bytes: number[]): void {
    bytes.forEach((byte) => this.writeByte(byte));
  }

  writeBoolean(bool: boolean): void {
    this.writeByte(bool === true ? 1 : 0);
  }

  writeNumber(number: number): void {
    if (!Number.isInteger(number)) {
      this.writeByte(this.FLOAT_NUMBER);
      this.writeFloat(number);
      return;
    }

    if (number < 256) {
      this.writeByte(this.BYTE_NUMBER);
      this.writeByte(number);
    } else if (number < 65536) {
      this.writeByte(this.SHORT_NUMBER);
      this.writeShort(number);
    } else {
      this.writeByte(this.INT_NUMBER);
      this.writeInteger(number);
    }
  }

  writeShort(short: number): void {
    this.writeByte((short >> 8) & 255);
    this.writeByte(short & 255);
  }

  writeFloat(float: number): void {
    const splited = float.toString().split(".");
    const part1 = splited[0];
    const zeroes = splited[1]?.match(/^[0]+/)?.[0].length ?? 0;
    const part2 = splited[1]?.substring(zeroes, splited[1].length) ?? 0;

    this.writeNumber(Number(part1));
    this.writeNumber(zeroes);
    this.writeNumber(Number(part2));
  }

  writeInteger(int: number): void {
    this.writeByte((int >> 24) & 255);
    this.writeByte((int >> 16) & 255);
    this.writeByte((int >> 8) & 255);
    this.writeByte(int & 255);
  }

  writeText(text: string): void {
    const bytes = this.encoder.encode(text);
    this.writeNumber(bytes.length);

    for (const byte of bytes) {
      this.writeByte(byte);
    }
  }

  writeEncodedText(text: string, encoder: typeof basicTextEncoder = basicTextEncoder): void {
    encoder?.(this, this.encoder.encode(text));
  }

  readByte(): number {
    if (this.bytes.length < 1) {
      throw new RangeError(`Expected at least 1 byte, got ${this.bytes.length}`);
    }
    return this.bytes.shift();
  }

  readBytes(length: number): number[] {
    return this.bytes.splice(0, length);
  }

  readBoolean(): boolean {
    return this.readByte() === 1;
  }

  readShort(): number {
    return this.readByte() << 8 | this.readByte();
  }

  readInteger(): number {
    return (this.readByte() << 24) | (this.readByte() << 16) | (this.readByte() << 8) | this.readByte();
  }

  readFloat(): number {
    const part1 = this.readNumber();
    const zeroes = this.readNumber();
    const part2 = this.readNumber();

    return Number(`${part1}.${'0'.repeat(zeroes)}${part2}`);
  }

  readText(): string {
    return this.decoder.decode(new Uint8Array(this.readBytes(this.readNumber())));
  }

  readEncodedText(decoder: typeof basicTextDecoder = basicTextDecoder): string {
    return this.decoder.decode(decoder(this));
  }

  readNumber(): number {
    const type = this.readByte();

    switch (type) {
      case this.BYTE_NUMBER:
        return this.readByte();
      case this.SHORT_NUMBER:
        return this.readShort();
      case this.FLOAT_NUMBER:
        return this.readFloat();
      default:
        return this.readInteger();
    }
  }

  get buffer(): Uint8Array {
    return new Uint8Array(this.bytes);
  }

  toString(): string {
    return this.decoder.decode(new Uint8Array(this.bytes));
  }
}
