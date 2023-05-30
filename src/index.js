import { ByteCode } from "./jsvm/bytecode.js";

const bytes = new ByteCode();

bytes.parseCode(`
for (let k=0; k<10;k++) {
    console.log(k);
}
`);

console.log(bytes);