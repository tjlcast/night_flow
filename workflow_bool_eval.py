from typing import Union, Dict, List, Literal, Any
import json
from typing import Dict, Any, Union


def evaluate_ast(ast: Dict[str, Any], context: Dict[str, Any]) -> Union[bool, int, float, str]:
    node_type = ast['type']

    if node_type == 'BinaryExpression':
        left = evaluate_ast(ast['left'], context)
        right = evaluate_ast(ast['right'], context)
        operator = ast['operator']

        if operator == '==':
            return left == right
        elif operator == '!=':
            return left != right
        elif operator == '>':
            return left > right
        elif operator == '<':
            return left < right
        elif operator == '>=':
            return left >= right
        elif operator == '<=':
            return left <= right
        else:
            raise ValueError(f"Unknown binary operator: {operator}")

    elif node_type == 'LogicalExpression':
        left = evaluate_ast(ast['left'], context)
        operator = ast['operator']

        # 短路求值
        if operator == '&&':
            if not left:
                return False
            right = evaluate_ast(ast['right'], context)
            return left and right
        elif operator == '||':
            if left:
                return True
            right = evaluate_ast(ast['right'], context)
            return left or right
        else:
            raise ValueError(f"Unknown logical operator: {operator}")

    elif node_type == 'Identifier':
        name = ast['name']
        if name not in context:
            raise KeyError(f"Variable '{name}' not found in context")
        return context[name]

    elif node_type == 'TemplateLiteral':
        path = ast['path']
        # 按点号分割路径
        parts = path.split('.')
        value = context
        try:
            for part in parts:
                if isinstance(value, dict):
                    value = value[part]
                else:
                    raise KeyError(f"Cannot access '{part}' on non-dict value")
            return value
        except KeyError:
            raise KeyError(f"Path '{path}' not found in context")

    elif node_type == 'Literal':
        return ast['value']

    elif node_type == 'ParenthesizedExpression':
        return evaluate_ast(ast['expression'], context)

    else:
        raise ValueError(f"Unknown AST node type: {node_type}")


def evaluate_expression(ast_json: str, context: Dict[str, Any]) -> Union[bool, int, float, str]:
    """
    执行逻辑表达式语法树

    :param ast_json: 语法树的JSON字符串
    :param context: 变量上下文字典
    :return: 表达式计算结果
    """
    ast = json.loads(ast_json)
    return evaluate_ast(ast, context)


# 定义 AST 节点类型
ASTNode = Union[
    # BinaryExpression, LogicalExpression, UnaryExpression, ParenthesizedExpression
    Dict[str, Union[str, Dict]],
    Dict[Literal["type"], Literal["Identifier"]],  # Identifier
    Dict[Literal["type"], Literal["TemplateLiteral"]],  # TemplateLiteral
    Dict[Literal["type"], Literal["Literal"]]  # Literal
]


class Parser:
    def __init__(self, input_str: str):
        self.input = input_str
        self.tokens = self.tokenize(input_str)
        self.current = 0

    def parse(self) -> ASTNode:
        return self.parse_logical_expression()

    def parse_logical_expression(self) -> ASTNode:
        left = self.parse_equality_expression()

        while self.match('LOGICAL_AND') or self.match('LOGICAL_OR'):
            operator = self.previous()['value']
            right = self.parse_equality_expression()
            left = {
                'type': 'LogicalExpression',
                'operator': operator,
                'left': left,
                'right': right
            }

        return left

    def parse_equality_expression(self) -> ASTNode:
        left = self.parse_relational_expression()

        while self.match('EQUAL') or self.match('NOT_EQUAL'):
            operator = self.previous()['value']
            right = self.parse_relational_expression()
            left = {
                'type': 'BinaryExpression',
                'operator': operator,
                'left': left,
                'right': right
            }

        return left

    def parse_relational_expression(self) -> ASTNode:
        left = self.parse_primary_expression()

        while (self.match('GREATER') or self.match('GREATER_EQUAL') or
               self.match('LESS') or self.match('LESS_EQUAL')):
            operator = self.previous()['value']
            right = self.parse_primary_expression()
            left = {
                'type': 'BinaryExpression',
                'operator': operator,
                'left': left,
                'right': right
            }

        return left

    def parse_primary_expression(self) -> ASTNode:
        if self.match('LEFT_PAREN'):
            expr = self.parse_logical_expression()
            self.consume('RIGHT_PAREN', "Expect ')' after expression.")
            return {
                'type': 'ParenthesizedExpression',
                'expression': expr
            }

        if self.match('TRUE'):
            return {'type': 'Literal', 'value': True}

        if self.match('FALSE'):
            return {'type': 'Literal', 'value': False}

        if self.match('TEMPLATE_LITERAL'):
            return {'type': 'TemplateLiteral', 'path': self.previous()['value']}

        if self.match('IDENTIFIER'):
            return {'type': 'Identifier', 'name': self.previous()['value']}

        if self.match('NUMBER'):
            return {'type': 'Literal', 'value': float(self.previous()['value'])}

        if self.match('STRING'):
            return {'type': 'Literal', 'value': self.previous()['value'][1:-1]}

        raise ValueError(f"Unexpected token at position {self.current}")

    def match(self, token_type: str) -> bool:
        if self.check(token_type):
            self.advance()
            return True
        return False

    def check(self, token_type: str) -> bool:
        if self.is_at_end():
            return False
        return self.peek()['type'] == token_type

    def advance(self) -> Dict:
        if not self.is_at_end():
            self.current += 1
        return self.previous()

    def is_at_end(self) -> bool:
        return self.peek()['type'] == 'EOF'

    def peek(self) -> Dict:
        return self.tokens[self.current]

    def previous(self) -> Dict:
        return self.tokens[self.current - 1]

    def consume(self, token_type: str, message: str) -> Dict:
        if self.check(token_type):
            return self.advance()
        raise ValueError(message)

    def tokenize(self, input_str: str) -> List[Dict]:
        tokens = []
        current = 0

        while current < len(input_str):
            char = input_str[current]

            # 跳过空白字符
            if char.isspace():
                current += 1
                continue

            # 处理模板字面量 ${...}
            if char == '$' and current + 1 < len(input_str) and input_str[current + 1] == '{':
                current += 2  # 跳过 ${
                value = ''
                while current < len(input_str) and input_str[current] != '}':
                    value += input_str[current]
                    current += 1
                if current >= len(input_str) or input_str[current] != '}':
                    raise ValueError("Unclosed template literal, missing '}'")
                current += 1  # 跳过 }
                tokens.append({'type': 'TEMPLATE_LITERAL', 'value': value})
                continue

            # 处理括号
            if char == '(':
                tokens.append({'type': 'LEFT_PAREN', 'value': '('})
                current += 1
                continue

            if char == ')':
                tokens.append({'type': 'RIGHT_PAREN', 'value': ')'})
                current += 1
                continue

            # 处理字符串字面量
            if char == '"' or char == "'":
                quote = char
                value = quote
                current += 1
                while current < len(input_str) and input_str[current] != quote:
                    value += input_str[current]
                    current += 1
                if current >= len(input_str):
                    raise ValueError("Unclosed string literal")
                value += quote
                current += 1
                tokens.append({'type': 'STRING', 'value': value})
                continue

            # 处理逻辑运算符
            if char == '&' and current + 1 < len(input_str) and input_str[current + 1] == '&':
                tokens.append({'type': 'LOGICAL_AND', 'value': '&&'})
                current += 2
                continue

            if char == '|' and current + 1 < len(input_str) and input_str[current + 1] == '|':
                tokens.append({'type': 'LOGICAL_OR', 'value': '||'})
                current += 2
                continue

            # 处理比较运算符
            if char == '=' and current + 1 < len(input_str) and input_str[current + 1] == '=':
                tokens.append({'type': 'EQUAL', 'value': '=='})
                current += 2
                continue

            if char == '!' and current + 1 < len(input_str) and input_str[current + 1] == '=':
                tokens.append({'type': 'NOT_EQUAL', 'value': '!='})
                current += 2
                continue

            if char == '>' and current + 1 < len(input_str) and input_str[current + 1] == '=':
                tokens.append({'type': 'GREATER_EQUAL', 'value': '>='})
                current += 2
                continue

            if char == '<' and current + 1 < len(input_str) and input_str[current + 1] == '=':
                tokens.append({'type': 'LESS_EQUAL', 'value': '<='})
                current += 2
                continue

            if char == '>':
                tokens.append({'type': 'GREATER', 'value': '>'})
                current += 1
                continue

            if char == '<':
                tokens.append({'type': 'LESS', 'value': '<'})
                current += 1
                continue

            # 处理布尔字面量
            if input_str[current:current+4] == 'true':
                tokens.append({'type': 'TRUE', 'value': 'true'})
                current += 4
                continue

            if input_str[current:current+5] == 'false':
                tokens.append({'type': 'FALSE', 'value': 'false'})
                current += 5
                continue

            # 处理数字
            if char.isdigit():
                value = ''
                while current < len(input_str) and (input_str[current].isdigit() or input_str[current] == '.'):
                    value += input_str[current]
                    current += 1
                tokens.append({'type': 'NUMBER', 'value': value})
                continue

            # 处理标识符
            if char.isalpha() or char == '_':
                value = ''
                while current < len(input_str) and (input_str[current].isalnum() or input_str[current] == '_'):
                    value += input_str[current]
                    current += 1
                tokens.append({'type': 'IDENTIFIER', 'value': value})
                continue

            raise ValueError(f"Unexpected character: {char}")

        tokens.append({'type': 'EOF', 'value': ''})
        return tokens


def parse_expression(input_str: str) -> ASTNode:
    parser = Parser(input_str)
    return parser.parse()


def ast_to_string(ast: dict) -> str:
    """将 AST 语法树转换回表达式字符串"""
    node_type = ast['type']

    if node_type == 'BinaryExpression':
        left = ast_to_string(ast['left'])
        right = ast_to_string(ast['right'])
        return f"{left} {ast['operator']} {right}"

    elif node_type == 'LogicalExpression':
        left = ast_to_string(ast['left'])
        right = ast_to_string(ast['right'])
        return f"{left} {ast['operator']} {right}"

    elif node_type == 'Identifier':
        return ast['name']

    elif node_type == 'TemplateLiteral':
        return f"${{{ast['path']}}}"

    elif node_type == 'Literal':
        # 处理布尔值、数字、字符串等
        value = ast['value']
        if isinstance(value, bool):
            return 'true' if value else 'false'
        elif isinstance(value, (int, float)):
            # 如果是整数且没有小数部分，则输出为整数形式
            if isinstance(value, float) and value.is_integer():
                return str(int(value))
            return str(value)
        elif isinstance(value, str):
            return f'"{value}"'  # 用双引号包裹字符串
        else:
            return str(value)

    elif node_type == 'ParenthesizedExpression':
        return f"({ast_to_string(ast['expression'])})"

    else:
        raise ValueError(f"Unknown AST node type: {node_type}")


def main():
    # 测试用例集合
    test_cases = [
        # 基本逻辑表达式
        ("true && false", {}, False,
         {'type': 'LogicalExpression', 'operator': '&&',
          'left': {'type': 'Literal', 'value': True},
          'right': {'type': 'Literal', 'value': False}}),

        ("true || false", {}, True,
         {'type': 'LogicalExpression', 'operator': '||',
          'left': {'type': 'Literal', 'value': True},
          'right': {'type': 'Literal', 'value': False}}),

        # 比较表达式
        ("5 > 3", {}, True,
         {'type': 'BinaryExpression', 'operator': '>',
          'left': {'type': 'Literal', 'value': 5},
          'right': {'type': 'Literal', 'value': 3}}),

        ("5 == 5", {}, True,
         {'type': 'BinaryExpression', 'operator': '==',
          'left': {'type': 'Literal', 'value': 5},
          'right': {'type': 'Literal', 'value': 5}}),

        # 变量和模板字面量
        ("x > 5", {"x": 10}, True,
         {'type': 'BinaryExpression', 'operator': '>',
          'left': {'type': 'Identifier', 'name': 'x'},
          'right': {'type': 'Literal', 'value': 5}}),

        ("${user.age} > 18", {"user": {"age": 20}}, True,
         {'type': 'BinaryExpression', 'operator': '>',
          'left': {'type': 'TemplateLiteral', 'path': 'user.age'},
          'right': {'type': 'Literal', 'value': 18}}),

        # 字符串比较
        ("\"hello\" == \"hello\"", {}, True,
         {'type': 'BinaryExpression', 'operator': '==',
          'left': {'type': 'Literal', 'value': 'hello'},
          'right': {'type': 'Literal', 'value': 'hello'}}),

        # 括号表达式
        ("(true && false) || true", {}, True,
         {'type': 'LogicalExpression', 'operator': '||',
          'left': {'type': 'ParenthesizedExpression',
                   'expression': {'type': 'LogicalExpression', 'operator': '&&',
                                  'left': {'type': 'Literal', 'value': True},
                                  'right': {'type': 'Literal', 'value': False}}},
          'right': {'type': 'Literal', 'value': True}}),

        # 混合表达式
        ("x > 5 && y < 10", {"x": 7, "y": 8}, True,
         {'type': 'LogicalExpression', 'operator': '&&',
          'left': {'type': 'BinaryExpression', 'operator': '>',
                   'left': {'type': 'Identifier', 'name': 'x'},
                   'right': {'type': 'Literal', 'value': 5}},
          'right': {'type': 'BinaryExpression', 'operator': '<',
                    'left': {'type': 'Identifier', 'name': 'y'},
                    'right': {'type': 'Literal', 'value': 10}}}),
    ]

    # 运行测试
    for i, (expr, context, expected, expected_ast) in enumerate(test_cases, 1):
        try:
            print(f"=== 测试 {i} ===")
            print(f"表达式: {expr}")

            # 1. 解析表达式
            ast = parse_expression(expr)
            ast_json = json.dumps(ast, indent=2)
            print("\n生成的 AST:")
            print(ast_json)

            # 2. 检查 AST 结构
            def compare_ast(actual, expected):
                if isinstance(expected, dict):
                    for key in expected:
                        if key not in actual:
                            return False
                        if not compare_ast(actual[key], expected[key]):
                            return False
                    return True
                else:
                    return actual == expected

            if not compare_ast(ast, expected_ast):
                print("\n❌ AST 结构不匹配!")
                print("预期 AST 结构:")
                print(json.dumps(expected_ast, indent=2))
                continue
            else:
                print("\n✅ AST 结构验证通过")

            # 3. 评估表达式
            result = evaluate_expression(json.dumps(ast), context)

            # 4. 验证结果
            if result == expected:
                print(f"✅ 结果验证通过: {expr} = {result}")
            else:
                print(f"❌ 结果验证失败: 预期 {expected}, 得到 {result}")

            # 5. 测试 AST 转字符串
            reconstructed_expr = ast_to_string(ast)
            print(f"\n重构表达式: {reconstructed_expr}")
            if reconstructed_expr.replace(' ', '') == expr.replace(' ', ''):
                print("✅ 表达式重构验证通过")
            else:
                print(f"❌ 表达式重构不匹配: 原始 '{expr}', 重构 '{reconstructed_expr}'")

            print("\n" + "="*50 + "\n")

        except Exception as e:
            print(f"\n❌ 测试 {i} 出错: {expr}")
            print(f"错误: {str(e)}")
            print("\n" + "="*50 + "\n")

    # 测试错误处理
    error_cases = [
        ("x > 5", {}, "Variable 'x' not found in context"),
        ("${user.age} > 18", {"user": {}}, "Path 'user.age' not found in context"),
        ("true &&", {}, "Unexpected token"),
        ("5 > 'hello'", {}, "'>' not supported between instances of 'float' and 'str'"),
    ]

    print("\n=== 错误处理测试 ===")
    for i, (expr, context, expected_error) in enumerate(error_cases, 1):
        try:
            print(f"\n测试 {i}: {expr}")
            ast = parse_expression(expr)
            ast_json = json.dumps(ast, indent=2)
            print("\n生成的 AST:")
            print(ast_json)

            result = evaluate_expression(ast_json, context)
            print(f"\n❌ 错误测试 {i} 未捕获异常: {expr} (得到 {result})")
        except Exception as e:
            print(f"\n捕获到错误: {str(e)}")
            if expected_error in str(e):
                print(f"✅ 错误测试 {i} 通过: 捕获到预期错误 - {expected_error}")
            else:
                print(
                    f"❌ 错误测试 {i} 捕获到错误但不匹配: 预期 '{expected_error}', 得到 '{str(e)}'")
        print("\n" + "="*50)


if __name__ == "__main__":
    main()
