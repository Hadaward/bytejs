import { ProgramNode } from "./ast-types.js";
import { Bytes } from "./bytes.js";
import detransformer, { DetransformerOptions } from "./parser/detransformer.js";
import transformer, { TransformerOptions } from "./parser/transformer.js";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parse } = require("abstract-syntax-tree");

export function generateBytes(code: string, options: TransformerOptions = { encodeText: false }): Bytes {
  const tree: ProgramNode = parse(code, { next: true });

  const bytes = new Bytes();

  transformer[tree.type]?.(bytes, tree, options);

  return bytes;
}

export function generateCode(bytes: Bytes, options: DetransformerOptions = { decodeText: false }): string {
  return detransformer[bytes.readByte()]?.(bytes, options);
}
