- :warning: Documentation can change at any time so it's important to stay tuned.

## ByteJS
For ByteJS to work, it is necessary to create a bytearray capable of writing and reading primitive types in the array. Supported types are listed below with their respective size in bytes and their representation.

| Type | Size | Representation |
|:-----|:-----|:---------------|
|Byte|1|an integer between 0 to 255|
|Bool|1|a logical value between 0 (false) and 1 (true).|
|Short|2|an integer between 0 to 65535|
|String|unknown|a string of any length|

## Representing AST Tree
AST nodes will be represented using a ``short`` corresponding to the unique identifier (opcode) of the node, followed by its additional information. ``short`` was chosen because there are an indefinite number of nodes in the AST. Below you can see how each node will be represented in the byte chain.

### Program
The program receives the ``body`` parameter which is an array of nodes to be traversed. In ByteArray we will store a program as an entity holding the size of children and then writing each child to the array. We will also write whether the code is ESModule or CommonJS in the program itself using a logical value.
```js
array.writeShort(opcode);
// It serves to identify if a code is ESM or CJS, allowing or not the transformation of import-export and top-level await.
array.writeBool(program.isESModule);
array.writeShort(program.body.length);

for (const node of program.body) {
  traverse(node);
}
```

### Identifier
Identifiers take the ``name`` parameter and will be the only thing we write to the bytearray. However in the command-line documentation we will implement obfuscation so here it will be necessary to introduce a logic to do this process before writing to the bytearray.
```js
array.writeShort(opcode);

if (options.obfuscateIds) {
  // obfuscation code
  // write obfuscated name
  array.writeString(obfuscatedName);
} else {
  array.writeString(identifier.name);
}
```
