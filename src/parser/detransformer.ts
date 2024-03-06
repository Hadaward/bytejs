import { Bytes } from "../bytes.js";
import { OPCODES } from "../opcodes.js";

export default {
    [OPCODES.Program]: function(bytes: Bytes): string {
        bytes.readText(); // module
        const bodyLength = bytes.readNumber();

        let result = "";

        for (let i = 0; i < bodyLength; i++) {
            const type = bytes.readByte();
            result += this[type]?.(bytes);
        }

        return result;
    },

    [OPCODES.ExpressionStatement]: function(bytes: Bytes): string {
        const type = bytes.readByte();
        return this[type]?.(bytes);
    },

    [OPCODES.CallExpression]: function(bytes: Bytes): void {
        bytes;
        //const callee = this[bytes.readByte()]?.(bytes);
        //const argsCount = bytes.readShort();

        
    },

    [OPCODES.MemberExpression]: function(bytes: Bytes): void {
        bytes;
        //const object = this[bytes.readByte()]?.(bytes);
    }
} as {[K: number]: (bytes: Bytes) => string}