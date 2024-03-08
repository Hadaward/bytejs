export type BaseNode = {
  type: string;
}

export type ProgramNode = BaseNode & {
  sourceType: string;
  body: BaseNode[];
}

export type MemberExpressionNode = BaseNode & {
  object: BaseNode,
  computed: boolean,
  property: BaseNode,
  optional?: boolean
}

export type CallExpressionNode = BaseNode & {
  type: "CallExpression"
  callee: MemberExpressionNode;
  arguments: BaseNode[];
  optional?: boolean;
}

export type ExpressionStatementNode = BaseNode & {
  expression: CallExpressionNode;
}

export type IdentifierNode = BaseNode & {
  type: "Identifier";
  name: string;
}

export type LiteralNode = BaseNode & {
  type: "Literal";
  value: unknown;
}

export type VariableDeclarator = BaseNode & {
  id: IdentifierNode;
  init: BaseNode;
}

export type VariableDeclaration = BaseNode & {
  type: "VariableDeclaration";
  kind: "var" | "let" | "const";
  declarations: VariableDeclarator[];
}

export type BinaryExpression = BaseNode & {
  type: "BinaryExpression";
  left: BaseNode;
  right: BaseNode;
  operator: string;
}
