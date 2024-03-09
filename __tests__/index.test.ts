import { generateBytes, generateCode } from "../src/index.js";

describe('bytecodes', () => {
  it('access member and call method with arguments', () => {
    const source = `console?.["log"]?.("Hello world!", 1, false, true);`;
    const bytes = generateBytes(source, { encodeText: true });
    expect(generateCode(bytes, { decodeText: true })).toBe(source);
  });

  it('variable declaration', () => {
    const source = `
    const foo = 1 + 2.5 + false + 'aaa'
    console.log(foo);
    `;
    const bytes = generateBytes(source);
    const code = generateCode(bytes);

    console.log(bytes.toString(), bytes.buffer);
    console.log(code);
  })
});
