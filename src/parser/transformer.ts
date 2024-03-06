import { CallExpressionNode, ExpressionStatementNode, IdentifierNode, LiteralNode, MemberExpressionNode, ProgramNode } from "../ast-types.js";
import { Bytes } from "../bytes.js";
import { OPCODES } from "../opcodes.js";

export default {
  Program: function(bytes: Bytes, node: ProgramNode): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeText(node.sourceType);
    bytes.writeNumber(node.body.length);

    for (const subNode of node.body) {
      console.log(subNode);
      this[subNode.type]?.(bytes, subNode);
    }
  },

  ExpressionStatement: function(bytes: Bytes, node: ExpressionStatementNode): void {
    bytes.writeByte(OPCODES[node.type]);

    if (!OPCODES[node.expression.type])
      return;

    this[node.expression.type]?.(bytes, node.expression);
  },

  CallExpression: function(bytes: Bytes, node: CallExpressionNode): void {
    bytes.writeByte(OPCODES[node.type]);

    if (!OPCODES[node.callee.type])
      return;

    this[node.callee.type]?.(bytes, node.callee);

    bytes.writeShort(node.arguments.length);

    for (const arg of node.arguments) {
      this[arg.type]?.(bytes, arg);
    }
  },

  MemberExpression: function(bytes: Bytes, node: MemberExpressionNode): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeBoolean(node.computed);

    this[node.object.type]?.(bytes, node.object);
    this[node.property.type]?.(bytes, node.property);
  },

  Identifier: function(bytes: Bytes, node: IdentifierNode): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeText(node.name);
  },

  Literal: function(bytes: Bytes, node: LiteralNode): void {
    bytes.writeByte(OPCODES[node.type]);
    bytes.writeText(node.value);
  },
}