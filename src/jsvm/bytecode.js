import { parseModule, parseScript } from "esprima";
import { RULES, assert } from "./assert.js";
import { ByteArray } from "./bytearray.js";

export function toByteCode(code, isModule = false) {
    assert(code, RULES.String);
    assert(isModule, RULES.Boolean);

    const bytecode = new ByteArray();
    bytecode.writeBoolean(isModule);

    generator.visit(
        (isModule ? parseModule : parseScript)(code, { tolerant: true }),
        bytecode
    );

    return bytecode;
}

export const OPCODES = Object.freeze({
    VariableDeclaration: 0,
    VariableDeclarator: 1,
    Expression: 2,
    Identifier: 3,
    Property: 4,
    Literal: 5,
    FunctionDeclaration: 6,
    BlockStatement: 7,
    ForStatement: 8
});

export const SUB_OPCODES = Object.freeze({
    // Variable Declaration Kind
    var: 0,
    let: 1,
    const: 2,

    // Property kind
    init: 0,

    // Expression
    ObjectExpression: 0,
    ExpressionStatement: 1,
    CallExpression: 2,
    MemberExpression: 3,
    ArrayExpression: 4,
    FunctionExpression: 5,
    ArrowFunctionExpression: 6,
    BinaryExpression: 7,
    UpdateExpression: 8
});

export const generator = Object.freeze({
    visit(node, bytecode) {
        assert(node, {
            type: "object"
        });
        assert(bytecode, {
            type: "object",
            kind: "ByteArray"
        });

        if (Object.hasOwn(this, node.type))
            this[node.type](node, bytecode);
        else
            console.warn('A node has not yet been implemented:', node);
    },

    Program(node, bytecode) {
        bytecode.writeShort(node.body.length);

        for (const childNode of node.body)
            this.visit(childNode, bytecode);
    },

    VariableDeclaration(node, bytecode) {
        bytecode.writeByte(OPCODES.VariableDeclaration);
        bytecode.writeByte(SUB_OPCODES[node.kind]);
        bytecode.writeShort(node.declarations.length);

        for (const declaration of node.declarations)
            this.visit(declaration, bytecode);
    },

    VariableDeclarator(node, bytecode) {
        bytecode.writeByte(OPCODES.VariableDeclarator);
        bytecode.writeBoolean(node.init !== null);

        this.visit(node.id, bytecode);

        if (node.init !== null)
            this.visit(node.init, bytecode);
    },

    Identifier(node, bytecode) {
        bytecode.writeByte(OPCODES.Identifier);
        bytecode.writeString(node.name);
    },

    Property(node, bytecode) {
        bytecode.writeByte(OPCODES.Property);

        if (!Object.hasOwn(SUB_OPCODES, node.kind))
            throw new Error(`Missing property kind: ${node.kind}`);

        bytecode.writeByte(SUB_OPCODES[node.kind]);
        bytecode.writeBoolean(node.computed);
        bytecode.writeBoolean(node.shorthand);
        bytecode.writeBoolean(node.method);
        this.visit(node.key, bytecode);
        this.visit(node.value, bytecode);
    },

    Literal(node, bytecode) {
        bytecode.writeByte(5);
        bytecode.writeString(node.raw);
        console.log(node)
    },
});