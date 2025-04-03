import re
import json
from typing import Any, Dict, Union, Optional
from functools import reduce


class ExpressionEvaluateVariablor:
    """JSON 表达式解析器，支持 ${context.} 和 ${input.} 和 ${global.} 语法"""

    def __init__(self, context_data: Dict[str, Any], input_data: Any, global_data: Optional[Dict[str, Any]] = None):
        """
        初始化解析器
        :param context: 上下文数据字典
        :param input_data: 输入数据(可以是任意JSON可序列化类型)
        """
        self.context_data = context_data
        self.input_data = input_data
        self.global_data = global_data or {}
        self.pattern = re.compile(r'\$\{(.*?)\}')

    def evaluate(self, expression: str) -> Any:
        """
        解析表达式并返回实际值
        :param expression: 包含${}占位符的表达式字符串
        :return: 解析后的值
        """
        if not isinstance(expression, str):
            return expression

        expression = expression.strip()

        # # 如果整个表达式就是一个${}引用，直接返回解析值
        # if expression.startswith('${') and expression.endswith('}'):
        #     ref = expression[2:-1]
        #     return self._resolve_reference(ref)

        # 否则替换所有${}引用
        def replace_match(match):
            ref = match.group(1)
            value = self._resolve_reference(ref)
            # 如果找不到变量，返回原匹配
            return str(value) if value is not None else match.group(0)

        return self.pattern.sub(replace_match, expression)

    def _resolve_reference(self, ref: str) -> Any:
        """
        解析单个引用路径
        :param ref: 去掉${}后的引用路径
        :return: 解析后的值
        """
        if not ref:
            return None
        
        ref = ref.strip()

        # 判断引用类型
        if ref == 'input':
            return self.input_data
        elif ref.startswith('input.'):
            return self._resolve_path(ref[6:], self.input_data)
        elif ref.startswith('context.'):
            return self._resolve_path(ref[8:], self.context_data)
        elif ref.startswith('global.'):
            return self._resolve_path(ref[7:], self.global_data)
        else:
            # 默认尝试从context中解析
            return self._resolve_path(ref, self.context_data)

    def _resolve_path(self, path: str, data: Any) -> Any:
        """
        解析对象路径如 a.b.c[0].d
        :param path: 点分隔的路径字符串
        :param data: 要解析的数据对象
        :return: 解析后的值
        """
        if not path or data is None:
            return data

        try:
            # 分割路径为各个部分
            parts = self._split_path(path)
            return reduce(self._get_item, parts, data)
        except (KeyError, IndexError, AttributeError, TypeError):
            return None

    def _split_path(self, path: str) -> list:
        """
        将路径字符串分割为访问步骤列表
        例如: "a.b[0].c" -> ['a', 'b', 0, 'c']
        """
        parts = []
        for part in path.split('.'):
            if '[' in part and ']' in part:
                # 处理数组索引
                key = part[:part.index('[')]
                if key:
                    parts.append(key)
                # 提取所有索引
                indices = re.findall(r'\[(\d+)\]', part)
                for index in indices:
                    parts.append(int(index))
            else:
                if part:
                    parts.append(part)
        return parts

    def _get_item(self, obj: Any, part: Union[str, int]) -> Any:
        """
        根据部分路径获取对象属性/元素
        """
        if isinstance(part, int):
            if isinstance(obj, (list, tuple)) and part < len(obj):
                return obj[part]
            return None
        elif isinstance(obj, dict):
            return obj.get(part)
        elif hasattr(obj, part):
            return getattr(obj, part)
        return None


if __name__ == '__main__':
    context = {
        "user": {
            "name": "admin",
            "permissions": ["read", "write"]
        },
        "settings": {
            "timeout": 30,
            "1": [
                1, 2, 3
            ]
        },
        "123": {
            "input": 123,
            "output": 456
        }
    }

    input_data = {
        "request": {
            "params": {
                "id": 12345,
                "filters": [{"type": "date", "value": "2023-01-01"}]
            }
        }
    }

    # 创建解析器
    evaluator = ExpressionEvaluateVariablor(context, input_data)

    # 测试各种表达式
    print(evaluator.evaluate("${context.user.name}"))  # "admin"
    print(evaluator.evaluate("${context.settings.timeout}"))  # 30
    print(evaluator.evaluate("${input.request.params.id}"))  # 12345
    print(evaluator.evaluate(
        "${input.request.params.filters[0].type}"))  # "date"
    print(evaluator.evaluate(
        "User: ${context.user.name}, ID: ${input.request.params.id}"))
    # "User: admin, ID: 12345"

    # 测试数组索引
    print(evaluator.evaluate("${context.user.permissions[1]}"))  # "write"

    # 测试数组索引
    print(evaluator.evaluate("${context.settings.1}"))  # "[1, 2, 3]"
    print(evaluator.evaluate("${context.settings.1[0]}"))  # "1"
    print(evaluator.evaluate("${context.settings.1[1]}"))  # "2"
    print(evaluator.evaluate("${context.settings.1[2]}"))  # "3"
    print(evaluator._resolve_reference("context.settings.1[2]"))  # 3

    # 测试整个input引用
    print(evaluator.evaluate("${input}"))  # 返回整个input_data字典
    print(evaluator._resolve_reference("input"))  # 返回整个input_data字典

    # 测试不存在的路径
    print(evaluator.evaluate("${context.not.exist}"))  # ${context.not.exist}
    print(evaluator._resolve_reference("${context.not.exist}"))  # None

    print(evaluator.evaluate(
        "${context.settings.1[1]} > ${context.settings.1[2]} should be ${result}"))
    # 2 > 3 should be ${result}


    print(evaluator.evaluate(
        "${context.123.input} > ${context.settings.1[2]} should be ${result}"))
    # 123 > 3 should be ${result}