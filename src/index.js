import { toByteCode } from "./jsvm/bytecode.js";
import { runByteCode } from "./jsvm/runtime.js";

const bytecode = toByteCode(`
console.log("Hello world");
`);

runByteCode(bytecode.bytes);