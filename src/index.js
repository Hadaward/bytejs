import { toByteCode } from "./jsvm/bytecode.js";

const bytecode = toByteCode(`
const world = {
    x: 0
}

console.log(world.x);

for (let k=0; k<10;k++) {
    console.log(k);
}
`);

console.log(bytecode);