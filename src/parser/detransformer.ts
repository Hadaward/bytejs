import { Bytes } from "../bytes.js";
import { OPCODES } from "../opcodes.js";

export type DetransformerOptions = {
  decodeText: boolean;
}

export default {
    detransformNode: function(bytes: Bytes, options: DetransformerOptions = { decodeText: false }): string {
        const type = bytes.readByte();

        if (!Object.values(OPCODES).includes(type)) {
            throw new Error(`Unknown node type: ${type}`);
        }

        if (this[type] === undefined) {
            throw new Error(`Missing detransformer for node type: ${type} -> ${Object.entries(OPCODES).find(entry => entry[1] === type)?.[0]}`);
        }

        return this[type](bytes, options);
    },

    [OPCODES.Program]: function(bytes: Bytes, options: DetransformerOptions = { decodeText: false }): string {
        bytes[options.decodeText ? "readEncodedText" : "readText"](); // module
        const bodyLength = bytes.readNumber();

        let result = "";

        for (let i = 0; i < bodyLength; i++) {
            result += this.detransformNode(bytes, options);
        }

        return result;
    },

    [OPCODES.ExpressionStatement]: function(bytes: Bytes, options: DetransformerOptions = { decodeText: false }): string {
        return this.detransformNode(bytes, options);
    },

    [OPCODES.ChainExpression]: function(bytes: Bytes, options: DetransformerOptions = { decodeText: false }): string {
        return this.detransformNode(bytes, options);
    },

    [OPCODES.CallExpression]: function(bytes: Bytes, options: DetransformerOptions = { decodeText: false }): string {
        const optional = bytes.readBoolean();
        const callee = this.detransformNode(bytes, options);
        const argsCount = bytes.readShort();

        let result = callee;

        if (optional) {
          result += "?.";
        }

        result += "(";

        for (let i=0; i<argsCount;i++) {
          result += this.detransformNode(bytes, options) + (i < argsCount - 1 ? ", " : "");
        }

        result += ");"

        return result;
    },

    [OPCODES.MemberExpression]: function(bytes: Bytes, options: DetransformerOptions = { decodeText: false }): string {
        const computed = bytes.readBoolean();
        const optional = bytes.readBoolean();


        const object = this.detransformNode(bytes, options);
        const property = this.detransformNode(bytes, options);

        let result = object;

        if (optional) {
          result += "?.";
        }

        if (computed) {
          result += `[${property}]`;
        } else {
          result += property;
        }

        return result;
    },

    [OPCODES.Identifier]: function(bytes: Bytes, options: DetransformerOptions = { decodeText: false }): string {
      return bytes[options.decodeText ? "readEncodedText" : "readText"]();
    },

    [OPCODES.Literal]: function(bytes: Bytes, options: DetransformerOptions = { decodeText: false }): string {
      const type = bytes.readByte();

      if (type === 1) {
        return `"${bytes[options.decodeText ? "readEncodedText" : "readText"]()}"`;
      } else if (type === 2) {
        return String(bytes.readNumber());
      } else {
        return String(bytes.readBoolean());
      }
    }
}
