import json
from typing import Union, Dict, List, Any

def parse_string_2_multi(input_str: str) -> Union[Dict, List, int, float, str]:
    """
    解析输入字符串，可能返回 JSON 结构、整数、浮点数或字符串
    
    参数:
        input_str: 输入字符串
        
    返回:
        Union[Dict, List, int, float, str]: 解析后的结果
        
    示例:
        >>> parse_string('{"name": "John", "age": 30}')
        {'name': 'John', 'age': 30}
        
        >>> parse_string('123')
        123
        
        >>> parse_string('3.14')
        3.14
        
        >>> parse_string('hello')
        'hello'
    """
    # 尝试解析为 JSON
    try:
        return json.loads(input_str)
    except json.JSONDecodeError:
        pass
    
    # 尝试解析为整数
    try:
        return int(input_str)
    except ValueError:
        pass
    
    # 尝试解析为浮点数
    try:
        return float(input_str)
    except ValueError:
        pass
    
    # 如果以上都不成功，返回原始字符串
    return input_str

if __name__ == "__main__":
    # 测试 JSON 对象
    json_obj = parse_string_2_multi('{"name": "Alice", "age": 25, "scores": [90, 85, 95]}')
    print(type(json_obj), json_obj)  # <class 'dict'> {'name': 'Alice', 'age': 25, 'scores': [90, 85, 95]}

    # 测试 JSON 数组
    json_array = parse_string_2_multi('[1, 2, 3, "four"]')
    print(type(json_array), json_array)  # <class 'list'> [1, 2, 3, 'four']

    # 测试整数
    integer = parse_string_2_multi('42')
    print(type(integer), integer)  # <class 'int'> 42

    # 测试浮点数
    float_num = parse_string_2_multi('3.14159')
    print(type(float_num), float_num)  # <class 'float'> 3.14159

    # 测试字符串
    string = parse_string_2_multi('hello world')
    print(type(string), string)  # <class 'str'> hello world

    # 测试无效 JSON 但可以转换为数字
    mixed = parse_string_2_multi('123abc')
    print(type(mixed), mixed)  # <class 'str'> 123abc