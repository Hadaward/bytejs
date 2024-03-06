import { Bytes } from "../src/bytes.js";

describe('bytes testing', () => {
  const bytes = new Bytes();

  it('read/write byte', () => {
    const value = 10;
    bytes.writeByte(value);
    expect(bytes.buffer).toContain(value);
    expect(bytes.readByte()).toBe(value);
    expect(bytes.buffer).toHaveLength(0);
  });

  it('read/write bool', () => {
    bytes.writeBoolean(true);
    bytes.writeBoolean(false);

    expect(bytes.buffer[0]).toBe(1);
    expect(bytes.buffer[1]).toBe(0);

    expect(bytes.readBool()).toBe(true);
    expect(bytes.readBool()).toBe(false);
    expect(bytes.buffer).toHaveLength(0);
  });

  it('read/write short', () => {
    const value = 64535;
    bytes.writeShort(value);
    expect(bytes.buffer[0]).toBe((value >> 8) & 255);
    expect(bytes.buffer[1]).toBe(value & 255);
    expect(bytes.readShort()).toBe(value);
    expect(bytes.buffer).toHaveLength(0);
  });

  it('read/write integer', () => {
    const value = 33554433;
    bytes.writeInteger(value);
    expect(bytes.buffer[0]).toBe((value >> 24) & 255);
    expect(bytes.buffer[1]).toBe((value >> 16) & 255);
    expect(bytes.buffer[2]).toBe((value >> 8) & 255);
    expect(bytes.buffer[3]).toBe(value & 255);
    expect(bytes.readInteger()).toBe(value);
    expect(bytes.buffer).toHaveLength(0);
  });

  it('read/write string', () => {
    const value = "Olá mundo... Hello world! <3";
    bytes.writeText(value);
    expect(bytes.readText()).toBe(value);
    expect(bytes.buffer).toHaveLength(0);
  });
});
