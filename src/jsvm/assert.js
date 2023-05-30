/**
 * Get value kind which is a stricter form of type by getting the true type of the value.
    - null -> null
    - object -> object, array or constructor name (example Map, Date, etc.)
    - number -> integer, float, nan or infinity
    - function -> class or function
 * @param {any} value 
 * @returns {string} value kind
 */
export function getKind(value) {
    const typeOf = typeof value;

    if (typeOf === 'object')
        return value === null
                ? 'null'
                : Array.isArray(value)
                ? 'array'
                : value.constructor === Object
                ? 'object'
                : value.constructor.name

    if (typeOf === 'number')
        return Number.isNaN(value)
                ? 'nan'
                : Number.isFinite(value)
                    ? Number.isInteger(value)
                        ? 'integer'
                        : 'float'
                    : 'infinity' 

    if (typeOf === 'function')
        return value?.prototype?.constructor?.toString().startsWith('class')
                ? 'class'
                : 'function';

    return typeOf;
}

/**
 * Returns a proxy that prevents new properties from being created for an object and its properties from being deleted.
 * @param {object} object
 */
export function lock(object) {
    return new Proxy(object, {
        deleteProperty: () => false,
        set(target, key, value) {
            if (Object.hasOwn(target, key))
                target[key] = value;

            return true;
        }
    })
}

/**
 * @param {any} value 
 * @returns {string} the value converted into a string, if it is a class or function it returns a beautified version.
 */
export function toPrettifiedString(value) {
    const kind = getKind(value);
    return kind === 'function'
            ? `function ${value.name}${String(value).match(/\(.*?\)/)??'()'}`
            : kind === 'class'
            ? `class ${value.name.length > 0 ? value.name + ' ' : ''}{ constructor${String(value).match(/\(.*?\)/)??'()'} }`
            : value;
}

/**
 * @returns Returns a new object containing all the properties of the assert rules.
 */
export function assertRules() {
    return {
        /**
         * Validates the value type
         * @type {string?}
         */
        type: undefined,
        /**
         * Validates the kind of the value. Kind is a stricter form of type by getting the true type of the value.
            - null -> null
            - object -> object, array or constructor name (example Map, Date, etc.)
            - number -> integer, float, nan or infinity
            - function -> class or function
         * @type {string?}
         */
        kind: undefined,
        /**
         * Validates the type of the value by checking if it is included in the list.
         * @type {Array<string>?}
         */
        types: undefined,
        /**
         * Validates the kind of the value by checking if it is included in the list.
         * @type {Array<string>?}
         */
        kinds: undefined,
        /**
         * Predicate invoked for external validation, receives the value as the first argument and must return true or a error message.
         * @type {((value, typeOf: string, kind: string) => boolean|string)?}
         */
        validator: undefined
    }
}
/**
 * 
 * @param {any} value 
 * @param {object} rules
 * @param {string?} rules.type Validates the value type
 * @param {string?} rules.kind Validates the kind of the value. Kind is a stricter form of type by getting the true type of the value.
 *                              - null -> null
                                - object -> object, array or constructor name (example Map, Date, etc.)
                                - number -> integer, float, nan or infinity
                                - function -> class or function
 * @param {Array<string>?} rules.types Validates the type of the value by checking if it is included in the list.
 * @param {Array<string>?} rules.kinds Validates the kind of the value by checking if it is included in the list.
 * @param {((value, typeOf: string, kind: string) => boolean|string)?} rules.validator Predicate invoked for external validation, receives the value as the first argument and must return true or a error message.
 */
export function assert(value, rules) {
    // Sanitize rules object
    const rulesObject = Object.assign(lock(assertRules()), rules);

    if(Array.isArray(rulesObject.types))
        rulesObject.types = rulesObject.types.map(type => String(type));

    if(Array.isArray(rulesObject.kinds))
        rulesObject.kinds = rulesObject.kinds.map(kind => String(kind));

    // get value type and kind
    const typeOf = typeof value;
    const kind = getKind(value);

    // do assertation
    if (rulesObject.type && typeOf !== rulesObject.type)
        throw new TypeError(`Expected ${toPrettifiedString(value)} to be of type ${rulesObject.type}, got ${typeOf}.`);

    if (rulesObject.kind && kind !== rulesObject.kind)
        throw new TypeError(`Expected ${toPrettifiedString(value)} to be of kind ${rulesObject.kind}, got ${kind}.`);

    if (Array.isArray(rulesObject.types) && !rulesObject.types.includes(typeOf))
        throw new TypeError(`Expected ${toPrettifiedString(value)} to be one of the types [${rulesObject.types.join(", ")}], got ${typeOf}.`);

    if (Array.isArray(rulesObject.kinds) && !rulesObject.kinds.includes(kind))
        throw new TypeError(`Expected ${toPrettifiedString(value)} to be one of the kinds [${rulesObject.kinds.join(", ")}], got ${kind}.`);

    const validatorKind = getKind(rulesObject.validator);

    if (!["null", "undefined"].includes(validatorKind)) {
        if (validatorKind !== 'function')
            throw new TypeError(`Expected rules.validator to be a function or undefined, got ${validatorKind}`);

        const res = rulesObject.validator(value, typeOf, kind);

        if (res !== true) {
            if (typeof res !== 'string')
                throw new TypeError(`Expected rules.validator to return true or a string error message, got ${typeof res}`);

                throw new Error(`${toPrettifiedString(rulesObject.validator)}: ${res}`);
        }  
    }
}

/**
 * Collection of predefined rules for native types
 */
export const RULES = Object.freeze({
    Number: Object.freeze({
        type: "number",
        kinds: ["infinity", "integer", "float"]
    }),

    PositiveNumber: Object.freeze({
        type: "number",
        kinds: ["infinity", "integer", "float"],
        validator: num => num >= 0 || `Expected a positive number, got ${num}`
    }),

    NegativeNumber: Object.freeze({
        type: "number",
        kinds: ["infinity", "integer", "float"],
        validator: num => num <= 0 || `Expected a negative number, got ${num}`
    }),

    Integer: Object.freeze({
        type: "number",
        kind: "integer"
    }),

    PositiveInteger: Object.freeze({
        type: "number",
        kind: "integer",
        validator: num => num >= 0  || `Expected a positive integer, got ${num}`
    }),

    NegativeInteger: Object.freeze({
        type: "number",
        kind: "integer",
        validator: num => num <= 0  || `Expected a negative integer, got ${num}`
    }),

    Float: Object.freeze({
        type: "number",
        kind: "float"
    }),

    PositiveFloat: Object.freeze({
        type: "number",
        kind: "float",
        validator: num => num >= 0  || `Expected a positive float, got ${num}`
    }),

    NegativeFloat: Object.freeze({
        type: "number",
        kind: "float",
        validator: num => num <= 0  || `Expected a negative float, got ${num}`
    }),

    Object: Object.freeze({
        type: "object",
        kind: "object"
    }),

    Array: Object.freeze({
        type: "object",
        kind: "array"
    }),

    Function: Object.freeze({
        type: "function",
        kind: "function"
    }),

    Class: Object.freeze({
        type: "function",
        kind: "class"
    }),

    String: Object.freeze({
        type: "string"
    }),

    Boolean: Object.freeze({
        type: "boolean"
    })
});