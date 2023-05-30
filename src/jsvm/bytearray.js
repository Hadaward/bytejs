export class ByteArray {
    constructor(bytes) {
        this.bytes = Array.isArray(bytes) ? bytes : [];
    }

    static fromString(string) {
        if (typeof string !== 'string')
            throw new TypeError(`expected string, not ${typeof string}: ${string}`);

        return new ByteArray([...string].map(char => char.codePointAt(0)));
    }

    writeByte(value) {
        this.bytes.push(value % 255);
    }

    writeShort(value) {
        this.writeByte((value >> 8) & 0xFF);
        this.writeByte(value & 0xFF);
    }

    writeInt(value) {
        this.writeByte((value >> 24) & 0xFF);
        this.writeByte((value >> 16) & 0xFF);
        this.writeByte((value >> 8) & 0xFF);
        this.writeByte(value & 0xFF);
    }

    writeString(value) {
        
    }

    /**
     * 0 - string
     * 1 - integer
     * 2 - float
     * 3 - bool
     * @param {any} value 
     */
    writePrimitive(value) {
        if (typeof value === 'string') {
            this.writeByte(0);
            this.writeShort(value.length);
            for (const code of [...value].map(char => char.codePointAt(0) << 4))
                this.writeShort(code);
        } else if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                this.writeByte(1);
                this.writeInt(value);
            } else {
                this.writeByte(2);
                const [integer, float] = value.toString().split(".");
                this.writeInt(Number(integer));
                this.writeInt(Number(`1${float}`));
            }
        } else if (typeof value === 'boolean') {
            this.writeByte(3);
            this.writeByte(value ? 1 : 0);
        }
    }

    readPrimitive() {
        const type = this.readByte();

        if (type === 0) {
            const length = this.readShort();
            let result = "";

            for (let k=0;k<length;k++)
                result += String.fromCodePoint(this.readShort() >> 4);

            return result;
        } else if (type === 1) {
            return this.readInt();
        } else if (type === 2) {
            const integer = this.readInt().toString();
            const float = this.readInt().toString().substring(1);
            return Number(`${integer}.${float}`);
        } else if (type === 3) {
            return this.readByte() === 1;
        }
    }

    readByte() {
        return this.bytes.shift() % 255;
    }

    readShort() {
        return this.readByte() << 8 | this.readByte();
    }

    readInt() {
        return this.readByte() << 24 | this.readByte() << 16 | this.readByte() << 8 | this.readByte();
    }
}