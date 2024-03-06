import { generateBytes } from "../src/index.js";

describe('bytecodes', () => {
  it('generate a CallExpression and transform it into code again', () => {
    const source = `console?.log("Hello world!");`;
    const bytes = generateBytes(source);

    console.log(bytes.toString())
    
    //console.log(generateCode(bytes));
  });
});
