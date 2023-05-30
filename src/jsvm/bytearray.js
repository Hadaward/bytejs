import { RULES, assert } from "./assert.js";

export class ByteArray {
    constructor(bytes) {
        this.bytes = Array.isArray(bytes) ? bytes : [];
    }

    static fromString(string) {
        assert(string, RULES.String);
        return new ByteArray([...string].map(char => char.codePointAt(0)));
    }

    writeByte(value) {
        assert(value, {
            type: "number",
            kind: "integer",
            validator(value) {
                return value >= 0 && value <= 255 || `Byte is out of range [0~255]: ${value}`
            }
        });

        this.bytes.push(value % 255);
    }

    writeBoolean(value) {
        assert(value, RULES.Boolean);
        this.writeByte(value ? 1 : 0);
    }

    writeShort(value) {
        assert(value, RULES.Integer);
        this.writeByte((value >> 8) & 0xFF);
        this.writeByte(value & 0xFF);
    }

    writeInt(value) {
        assert(value, RULES.Integer);

        this.writeByte((value >> 24) & 0xFF);
        this.writeByte((value >> 16) & 0xFF);
        this.writeByte((value >> 8) & 0xFF);
        this.writeByte(value & 0xFF);
    }

    writeString(value) {
        assert(value, RULES.String);
        this.writeShort(value.length);
        value.split("").map(char => char.codePointAt(0) << 4).forEach(this.writeShort.bind(this));
    }

    readByte() {
        return this.bytes.shift() % 255;
    }

    readBoolean() {
        return this.readByte() === 1;
    }

    readShort() {
        return this.readByte() << 8 | this.readByte();
    }

    readInt() {
        return this.readByte() << 24 | this.readByte() << 16 | this.readByte() << 8 | this.readByte();
    }

    readString() {
        const size = this.readShort();
        let value = "";

        for (let k=0;k<size;k++) 
            value += String.fromCodePoint(this.readShort() >> 4);

        return value;
    }
}