# ByteCode
```cs
// Legend:
<Y> // Y is the type of something.
[X <Y>] // X is the name given to the value being entered, and Y is the type.
([X]) or ([X <Y>]) // The parentheses indicate a list of [X] things.

// Types:
byte // number of range 0 to 255
short // number of range -65535 to 65535
int // number of range -4.294.967.295 to 4.294.967.295
bool // boolean (true or false)
string // encoded text
```
## OpCodes
- 0 -> VariableDeclaration
    - 0 -> var
    - 1 -> let
    - 2 -> const
- 1 -> VariableDeclarator
- 2 -> Expression
    - 0 -> Object
    - 1 -> Statement
    - 2 -> Call
    - 3 -> Member
    - 4 -> Array
    - 5 -> Function
    - 6 -> ArrowFunction
    - 7 -> Binary
    - 8 -> Update
- 3 -> Identifier
- 4 -> Property
- 5 -> Literal
- 6 -> FunctionDeclaration
- 7 -> BlockStatement
- 8 -> ForStatement

## How instructions are structured?
The instructions are organized in a string of bytes [range: 0~255]

### VariableDeclaration
- Sub OpCode for declaration kinds:
    - 0 -> var
    - 1 -> let
    - 2 -> const
```cs
[OpCode <byte>][Sub OpCode <byte>][Num of declarations <short>](VariableDeclarator)
```
### VarialeDeclarator
```cs
[OpCode <byte>][HasInit <bool>][Identifier <Literal>][value <Literal|SomeExpression>?]
```
### Expression
- Sub OpCode for different expressions
    - 0 -> Object
    - 1 -> Statement
    - 2 -> Call
    - 3 -> Member
    - 4 -> Array
    - 5 -> Function
    - 6 -> ArrowFunction
    - 7 -> Binary
    - 8 -> Update
```cs
[OpCode <byte>][Sub OpCode <byte>][Expression Variation]
```
- Object
```cs
[Num of properties <short>][Property]
```

⚠ There's so much more to document, I'll be updating soon.