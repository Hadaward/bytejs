import { generateBytes } from "../src/index.js";

describe('testing bytecode generator', () => {
  it('test CallExpression', () => {
    const source = `console.log("Hello world!");`;
    const buffer = generateBytes(source);
    console.log(buffer.buffer);
    console.log(buffer.toString());
  });
});
