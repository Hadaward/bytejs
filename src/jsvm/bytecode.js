import { RULES, assert } from "./assert.js";
import { ByteArray } from "./bytearray.js";
import { parseModule, parseScript } from "esprima";

/**
 * - \<X> = read/write type
 * - \(X) = description
 * - \[X] = list of X
 * 
 * bytecode id
 *  - 0 -> VariableDeclaration
 *      - 0 -> var
 *      - 1 -> let
 *      - 2 -> const
 *  - 1 -> VariableDeclarator
 *  - 2 -> Expression
 *      - 0 -> Object
 *      - 1 -> Statement
 *      - 2 -> Call
 *      - 3 -> Member
 *      - 4 -> Array
 *      - 5 -> Function
 *      - 6 -> ArrowFunction
 *      - 7 -> Binary
 *      - 8 -> Update
 *  - 3 -> Identifier
 *  - 4 -> Property
 *  - 5 -> Literal
 *  - 6 -> FunctionDeclaration
 *  - 7 -> BlockStatement
 *  - 8 -> ForStatement
 */
const generateBytes = {
    invoke(node, bytecode) {
        if (Object.hasOwn(this, node.type))
            this[node.type](node, bytecode);
        else
            console.log('Not implemented:', node);
    },

    Program(node, bytecode) {
        bytecode.bytes.writeShort(node.body.length);

        for (const childNode of node.body)
            this.invoke(childNode, bytecode);
    },

    /**
     * - Loadout:
     *   - <byte (code)><byte (kind)><short (amount of declarations)>
     *   - [<string (id)><bool (has init)>\<any>]
     */
    VariableDeclaration(node, bytecode) {
        bytecode.bytes.writeByte(0);
        bytecode.bytes.writeByte(
            {
                'var': 0,
                'let': 1,
                'const': 2
            }[node.kind]
        );

        bytecode.bytes.writeShort(node.declarations.length);

        for (const declaration of node.declarations)
            this.invoke(declaration, bytecode);
    },

    /**
     * - Loadout:
     *  - <byte (code)><bool (has init)><loadout (identifier)><loadout (init)?>
     */
    VariableDeclarator(node, bytecode) {
        bytecode.bytes.writeByte(1);
        bytecode.bytes.writePrimitive(node.init !== null);

        this.invoke(node.id, bytecode);

        if (node.init !== null)
            this.invoke(node.init, bytecode);
    },

    /**
     * - Loadout:
     *     - <byte (code)><byte (kind)><short (amount of properties)>
     */
    ObjectExpression(node, bytecode) {
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeByte(0);
        bytecode.bytes.writeShort(node.properties.length);

        for (const property of node.properties)
            this.invoke(property, bytecode);
    },

    ExpressionStatement(node, bytecode) {
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeByte(1);
        this.invoke(node.expression, bytecode);
    },

    CallExpression(node, bytecode) {
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeShort(node.arguments.length);

        this.invoke(node.callee, bytecode);

        for (const argument of node.arguments)
            this.invoke(argument, bytecode);
    },

    MemberExpression(node, bytecode) {
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeByte(3);
        bytecode.bytes.writePrimitive(node.computed);
        this.invoke(node.object, bytecode);
        this.invoke(node.property, bytecode);
    },

    ArrayExpression(node, bytecode) {
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeByte(4);
        bytecode.bytes.writeShort(node.elements.length);

        for (const element of node.elements)
            this.invoke(element, bytecode);
    },

    FunctionExpression(node, bytecode) {
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeByte(5);
        bytecode.bytes.writePrimitive(node.generator);
        bytecode.bytes.writePrimitive(node.expression);
        bytecode.bytes.writePrimitive(node.async);
        bytecode.bytes.writePrimitive(node.id !== null);

        if (node.id !== null)
            this.invoke(node.id, bytecode);

        bytecode.bytes.writeShort(node.params.length);
        for (const param of node.params)
            this.invoke(param, bytecode);

        this.invoke(node.body, bytecode);
    },

    ArrowFunctionExpression(node, bytecode) {
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeByte(6);
        bytecode.bytes.writePrimitive(node.generator);
        bytecode.bytes.writePrimitive(node.expression);
        bytecode.bytes.writePrimitive(node.async);
        bytecode.bytes.writePrimitive(node.id !== null);

        if (node.id !== null)
            this.invoke(node.id, bytecode);

        bytecode.bytes.writeShort(node.params.length);
        for (const param of node.params)
            this.invoke(param, bytecode);

        this.invoke(node.body, bytecode);
    },

    BinaryExpression(node, bytecode) {
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeByte(7);
        bytecode.bytes.writePrimitive(node.operator);
        this.invoke(node.left, bytecode);
        this.invoke(node.right, bytecode);
    },

    UpdateExpression(node, bytecode) {
        bytecode.bytes.writeByte(2);
        bytecode.bytes.writeByte(8);
        bytecode.bytes.writePrimitive(node.prefix);
        bytecode.bytes.writePrimitive(node.operator);
        this.invoke(node.argument, bytecode);
    },

    /**
     * - Loadout:
     *   - <byte (code)>\<string>
     */
    Identifier(node, bytecode) {
        bytecode.bytes.writeByte(3);
        bytecode.bytes.writePrimitive(node.name);
    },

    Property(node, bytecode) {
        bytecode.bytes.writeByte(4);

        if (node.kind !== 'init')
            throw new Error(`Implement this property kind you dumb: ${node.kind}`);

        bytecode.bytes.writeByte(0); // 0 -> init
        bytecode.bytes.writePrimitive(node.computed);
        bytecode.bytes.writePrimitive(node.shorthand);
        bytecode.bytes.writePrimitive(node.method);
        this.invoke(node.key, bytecode);
        this.invoke(node.value, bytecode);
    },

    Literal(node, bytecode) {
        bytecode.bytes.writeByte(5);
        bytecode.bytes.writePrimitive(node.value);
    },

    FunctionDeclaration(node, bytecode) {
        bytecode.bytes.writeByte(6);
        bytecode.bytes.writePrimitive(node.generator);
        bytecode.bytes.writePrimitive(node.expression);
        bytecode.bytes.writePrimitive(node.async);
        this.invoke(node.id, bytecode);

        bytecode.bytes.writeShort(node.params.length);
        for (const param of node.params)
            this.invoke(param, bytecode);

        this.invoke(node.body, bytecode);
    },

    BlockStatement(node, bytecode) {
        bytecode.bytes.writeByte(7);
        bytecode.bytes.writeShort(node.body.length);

        for (const childNode of node.body)
            this.invoke(childNode, bytecode);
    },

    ForStatement(node, bytecode) {
        bytecode.bytes.writeByte(8);
        this.invoke(node.init, bytecode);
        this.invoke(node.test, bytecode);
        this.invoke(node.update, bytecode);
        this.invoke(node.body, bytecode);
    }
}

export class ByteCode {
    constructor() {
        this.bytes = new ByteArray();

    }
    
    parseCode(code, asModule = false) {
        assert(code, RULES.String);
        assert(asModule, RULES.Boolean);

        const ast = (asModule ? parseModule : parseScript)(code, { tolerant: true });
        generateBytes.invoke(ast, this);
    }
}