import { generateBytes, generateCode } from "../src/index.js";

describe('bytecodes', () => {
  it('generate a CallExpression and transform it into code again', () => {
    const source = `console?.["log"]?.("Hello world!", 1, false, true);`;
    const bytes = generateBytes(source, { encodeText: false });
    expect(generateCode(bytes, { decodeText: false })).toBe(source);
  });
});
