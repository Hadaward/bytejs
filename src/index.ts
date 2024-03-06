import { ProgramNode } from "./ast-types.js";
import { Bytes } from "./bytes.js";
import detransformer from "./parser/detransformer.js";
import transformer from "./parser/transformer.js";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parse } = require("abstract-syntax-tree");

export function generateBytes(code: string): Bytes {
  const tree: ProgramNode = parse(code, { next: true });

  const bytes = new Bytes();

  transformer[tree.type]?.(bytes, tree);

  return bytes;
}

export function generateCode(bytes: Bytes): string {
  return detransformer[bytes.readByte()]?.(bytes);
}