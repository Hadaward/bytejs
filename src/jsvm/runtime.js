import { assert, RULES } from "./assert.js";
import { ByteArray } from "./bytearray.js";
import { OPCODES, SUB_OPCODES } from "./bytecode.js";

export function runByteCode(bytes) {
    assert(bytes, RULES.Array);
    const bytecode = new ByteArray(bytes);

    const data = {
        programType: bytecode.readBoolean() ? 'module' : 'classic'
    }

    loader.load(bytecode, data);
}

export const loader = Object.freeze({
    loadOp(opCode, bytecode, data) {
        if (Object.hasOwn(this, opCode))
            this[opCode](bytecode, data);
        else
            console.warn('A opcode has not yet been implemented:', opCode);
    },

    load(bytecode, data) {
        assert(bytecode, {
            type: "object",
            kind: "ByteArray"
        });

        this.loadOp(bytecode.readByte(), bytecode, data);
    },

    [OPCODES.Program](bytecode, data) {
        const length = bytecode.readShort();

        for (let k=0;k<length;k++)
            this.load(bytecode, data);
    },

    [OPCODES.Expression](bytecode, data) {
        this.loadOp(bytecode.readByte(), bytecode, data);
    },

    [SUB_OPCODES.ExpressionStatement](bytecode, data) {
        this.load(bytecode, data);
    }
})