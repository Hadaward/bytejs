import { TextDecoder, TextEncoder } from "util";

export class Bytes {
  private bytes: number[];
  private encoder: TextEncoder = new TextEncoder();
  private decoder: TextDecoder = new TextDecoder("utf-8");

  private BYTE_NUMBER = 0x01;
  private SHORT_NUMBER = 0x02;
  private INT_NUMBER = 0x04;

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

  writeBoolean(bool: boolean): void {
    this.writeByte(bool === true ? 1 : 0);
  }

  writeNumber(number: number): void {
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

  readByte(): number {
    return this.bytes.shift();
  }

  readBytes(length: number): number[] {
    return this.bytes.splice(0, length);
  }

  readBool(): boolean {
    return this.readByte() === 1;
  }

  readShort(): number {
    return this.readByte() << 8 | this.readByte();
  }

  readInteger(): number {
    return (this.readByte() << 24) | (this.readByte() << 16) | (this.readByte() << 8) | this.readByte();
  }

  readText(): string {
    return this.decoder.decode(new Uint8Array(this.readBytes(this.readNumber())));
  }

  readNumber(): number {
    const type = this.readByte();

    switch (type) {
      case this.BYTE_NUMBER:
        return this.readByte();
      case this.SHORT_NUMBER:
        return this.readShort();
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
