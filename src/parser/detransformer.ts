import { Bytes } from "../bytes.js";
import { OPCODES } from "../opcodes.js";

export default {
    detransformNode: function(bytes: Bytes): string {
        const type = bytes.readByte();

        if (!Object.values(OPCODES).includes(type)) {
            throw new Error(`Unknown node type: ${type} -> ${Object.entries(OPCODES).find(entry => entry[1] === type)?.[0]}`);
        }

        if (this[type] === undefined) {
            throw new Error(`Missing detransformer for node type: ${type} -> ${Object.entries(OPCODES).find(entry => entry[1] === type)?.[0]}`);
        }

        return this[type](bytes);
    },

    [OPCODES.Program]: function(bytes: Bytes): string {
        bytes.readText(); // module
        const bodyLength = bytes.readNumber();

        let result = "";

        for (let i = 0; i < bodyLength; i++) {
            result += this.detransformNode(bytes);
        }

        return result;
    },

    [OPCODES.ExpressionStatement]: function(bytes: Bytes): string {
        return this.detransformNode(bytes);
    },

    [OPCODES.ChainExpression]: function(bytes: Bytes): string {
        return this.detransformNode(bytes);
    },

    [OPCODES.CallExpression]: function(bytes: Bytes): string {
        const callee = this.detransformNode(bytes);
        //const argsCount = bytes.readShort();

        return callee;
    },

    [OPCODES.MemberExpression]: function(bytes: Bytes): string {
        bytes;
        //const object = this[bytes.readByte()]?.(bytes);

        return "member expression";
    }
}