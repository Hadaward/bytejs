import { BaseNode, CallExpressionNode, ExpressionStatementNode, IdentifierNode, LiteralNode, MemberExpressionNode, ProgramNode } from "../ast-types.js";
import { Bytes } from "../bytes.js";
import { OPCODES } from "../opcodes.js";

export default {
  transformNode(bytes: Bytes, node: BaseNode): void {
    if (OPCODES[node.type] === undefined) {
      throw new Error(`Unknown node type: ${node.type}`);
    }
    if (this[node.type] === undefined) {
      throw new Error(`Missing transformer for node type: ${node.type}`);
    }
    this[node.type](bytes, node);
  },
  
  Program: function(bytes: Bytes, node: ProgramNode): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeText(node.sourceType);
    bytes.writeNumber(node.body.length);

    for (const subNode of node.body) {
      this.transformNode(bytes, subNode);
    }
  },

  ExpressionStatement: function(bytes: Bytes, node: ExpressionStatementNode): void {
    bytes.writeByte(OPCODES[node.type]);
    this.transformNode(bytes, node.expression);
  },

  CallExpression: function(bytes: Bytes, node: CallExpressionNode): void {
    bytes.writeByte(OPCODES[node.type]);
    this.transformNode(bytes, node.callee);

    bytes.writeShort(node.arguments.length);

    for (const arg of node.arguments) {
      this.transformNode(bytes, arg);
    }
  },

  MemberExpression: function(bytes: Bytes, node: MemberExpressionNode): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeBoolean(node.computed);

    this.transformNode(bytes, node.object);
    this.transformNode(bytes, node.property);
  },

  Identifier: function(bytes: Bytes, node: IdentifierNode): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeText(node.name);
  },

  Literal: function(bytes: Bytes, node: LiteralNode): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeText(node.value);
  },

  ChainExpression: function(bytes: Bytes, node: ExpressionStatementNode): void {
    bytes.writeByte(OPCODES[node.type]);
    this.transformNode(bytes, node.expression);
  }
}