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
  property: BaseNode
}

export type CallExpressionNode = BaseNode & {
  type: "CallExpression"
  callee: MemberExpressionNode;
  arguments: BaseNode[];
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
  value: string;
}
