import { BaseNode, CallExpressionNode, ExpressionStatementNode, IdentifierNode, LiteralNode, MemberExpressionNode, ProgramNode } from "../ast-types.js";
import { Bytes } from "../bytes.js";
import { OPCODES } from "../opcodes.js";

export type TransformerOptions = {
  encodeText?: boolean;
}

export default {
  transformNode(bytes: Bytes, node: BaseNode, options: TransformerOptions = { encodeText: false }): void {
    if (OPCODES[node.type] === undefined) {
      throw new Error(`Unknown node type: ${node.type}`);
    }
    if (this[node.type] === undefined) {
      throw new Error(`Missing transformer for node type: ${node.type}`);
    }
    this[node.type](bytes, node, options);
  },

  Program: function(bytes: Bytes, node: ProgramNode, options: TransformerOptions = { encodeText: false }): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes[options.encodeText ? "writeEncodedText" : "writeText"](node.sourceType);
    bytes.writeNumber(node.body.length);

    for (const subNode of node.body) {
      this.transformNode(bytes, subNode, options);
    }
  },

  ExpressionStatement: function(bytes: Bytes, node: ExpressionStatementNode, options: TransformerOptions = { encodeText: false }): void {
    bytes.writeByte(OPCODES[node.type]);
    this.transformNode(bytes, node.expression, options);
  },

  CallExpression: function(bytes: Bytes, node: CallExpressionNode, options: TransformerOptions = { encodeText: false }): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeBoolean(node.optional ?? false);
    this.transformNode(bytes, node.callee, options);

    bytes.writeShort(node.arguments.length);

    for (const arg of node.arguments) {
      this.transformNode(bytes, arg, options);
    }
  },

  MemberExpression: function(bytes: Bytes, node: MemberExpressionNode, options: TransformerOptions = { encodeText: false }): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeBoolean(node.computed);
    bytes.writeBoolean(node.optional ?? false);

    this.transformNode(bytes, node.object, options);
    this.transformNode(bytes, node.property, options);
  },

  Identifier: function(bytes: Bytes, node: IdentifierNode, options: TransformerOptions = { encodeText: false }): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes[options.encodeText ? "writeEncodedText" : "writeText"](node.name);
  },

  Literal: function(bytes: Bytes, node: LiteralNode, options: TransformerOptions = { encodeText: false }): void {
    bytes.writeByte(OPCODES[node.type]);
    const type = typeof node.value;
    const types = {
      "string": 1,
      "number": 2,
      "boolean": 3
    }

    if (types[type] === undefined)
      throw new Error(`Literal got a unregistered type: ${type}`);

    bytes.writeByte(types[type])

    if (type === "string") {
      bytes[options.encodeText ? "writeEncodedText" : "writeText"](node.value as string);
    } else if (type === "number") {
      bytes.writeNumber(node.value as number);
    } else {
      bytes.writeBoolean(node.value as boolean);
    }
  },

  ChainExpression: function(bytes: Bytes, node: ExpressionStatementNode, options: TransformerOptions = { encodeText: false }): void {
    bytes.writeByte(OPCODES[node.type]);
    this.transformNode(bytes, node.expression, options);
  }
}
