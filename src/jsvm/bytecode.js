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
    Program: 0,
    VariableDeclaration: 1,
    VariableDeclarator: 2,
    Expression: 3,
    Identifier: 4,
    Property: 5,
    Literal: 6,
    FunctionDeclaration: 7,
    BlockStatement: 8,
    ForStatement: 9,
    ClassDeclaration: 10,
    ClassBody: 11,
    MethodDefinition: 12
});

export const SUB_OPCODES = Object.freeze({
    // Variable Declaration Kind
    var: 0,
    let: 1,
    const: 2,

    // Property kind
    init: 0,

    // Method kind
    constructor: 0,
    method: 1,

    // Expression
    ObjectExpression: 0,
    ExpressionStatement: 1,
    CallExpression: 2,
    MemberExpression: 3,
    ArrayExpression: 4,
    FunctionExpression: 5,
    ArrowFunctionExpression: 6,
    BinaryExpression: 7,
    UpdateExpression: 8,
    NewExpression: 9,
    AssignmentExpression: 10
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
        bytecode.writeByte(OPCODES[node.type]);
        bytecode.writeShort(node.body.length);

        for (const childNode of node.body)
            this.visit(childNode, bytecode);
    },

    VariableDeclaration(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);
        bytecode.writeByte(SUB_OPCODES[node.kind]);
        bytecode.writeShort(node.declarations.length);

        for (const declaration of node.declarations)
            this.visit(declaration, bytecode);
    },

    VariableDeclarator(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);
        bytecode.writeBoolean(node.init !== null);

        this.visit(node.id, bytecode);

        if (node.init !== null)
            this.visit(node.init, bytecode);
    },

    Identifier(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);
        bytecode.writeString(node.name);
    },

    Property(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);

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
        bytecode.writeByte(OPCODES[node.type]);
        bytecode.writeString(node.raw);
    },

    ObjectExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeShort(node.properties.length);

        for (const property of node.properties)
            this.visit(property, bytecode);
    },

    ExpressionStatement(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        this.visit(node.expression, bytecode);
    },

    CallExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeShort(node.arguments.length);

        this.visit(node.callee, bytecode);

        for (const argument of node.arguments)
            this.visit(argument, bytecode);
    },

    MemberExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeBoolean(node.computed);
        this.visit(node.object, bytecode);
        this.visit(node.property, bytecode);
    },

    ArrayExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeShort(node.elements.length);

        for (const element of node.elements)
            this.visit(element, bytecode);
    },

    FunctionExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeBoolean(node.generator);
        bytecode.writeBoolean(node.expression);
        bytecode.writeBoolean(node.async);
        bytecode.writeBoolean(node.id !== null);

        if (node.id !== null)
            this.visit(node.id, bytecode);

        bytecode.writeShort(node.params.length);
        for (const param of node.params)
            this.visit(param, bytecode);

        this.visit(node.body, bytecode);
    },

    ArrowFunctionExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeBoolean(node.generator);
        bytecode.writeBoolean(node.expression);
        bytecode.writeBoolean(node.async);
        bytecode.writeBoolean(node.id !== null);

        if (node.id !== null)
            this.visit(node.id, bytecode);

        bytecode.writeShort(node.params.length);
        for (const param of node.params)
            this.visit(param, bytecode);

        this.visit(node.body, bytecode);
    },

    BinaryExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeString(node.operator);
        this.visit(node.left, bytecode);
        this.visit(node.right, bytecode);
    },

    UpdateExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeBoolean(node.prefix);
        bytecode.writeString(node.operator);
        this.visit(node.argument, bytecode);
    },

    NewExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeShort(node.arguments.length);
        this.visit(node.callee, bytecode);

        for (const argument of node.arguments)
            this.visit(argument, bytecode);
    },

    AssignmentExpression(node, bytecode) {
        bytecode.writeByte(OPCODES.Expression);
        bytecode.writeByte(SUB_OPCODES[node.type]);
        bytecode.writeString(node.operator);
        this.visit(node.left, bytecode);
        this.visit(node.right, bytecode);
    },

    FunctionDeclaration(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);
        bytecode.writeBoolean(node.generator);
        bytecode.writeBoolean(node.expression);
        bytecode.writeBoolean(node.async);
        this.visit(node.id, bytecode);

        bytecode.writeShort(node.params.length);
        for (const param of node.params)
            this.visit(param, bytecode);

        this.visit(node.body, bytecode);
    },

    BlockStatement(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);
        bytecode.writeShort(node.body.length);

        for (const childNode of node.body)
            this.visit(childNode, bytecode);
    },

    ForStatement(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);
        this.visit(node.init, bytecode);
        this.visit(node.test, bytecode);
        this.visit(node.update, bytecode);
        this.visit(node.body, bytecode);
    },

    ClassDeclaration(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);
        bytecode.writeBoolean(node.id !== null);
        bytecode.writeBoolean(node.superClass !== null);

        if (node.id !== null)
            this.visit(node.id, bytecode);

        if (node.superClass !== null)
            this.visit(node.superClass, bytecode);

        this.visit(node.body, bytecode);
    },

    ClassBody(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);
        bytecode.writeShort(node.body.length);

        for (const childNode of node.body)
            this.visit(childNode, bytecode);
    },

    MethodDefinition(node, bytecode) {
        bytecode.writeByte(OPCODES[node.type]);
        
        if (!Object.hasOwn(SUB_OPCODES, node.kind))
            throw new Error(`Missing method kind: ${node.kind}`);

        bytecode.writeByte(SUB_OPCODES[node.kind]);
        bytecode.writeBoolean(node.computed);
        bytecode.writeBoolean(node.static);

        this.visit(node.key, bytecode);
        this.visit(node.value, bytecode);
    }
});