import os
import sys
import argparse
from typing import Dict, Optional, List


class MultiEnv:
    def __init__(self):
        self.configs: Dict[str, Dict[str, str]] = {}
        self.current_env: Optional[str] = None
        self.env_var_name = "APP_ENV"  # 环境变量名称

    def load_env(self, env_name: str = None, filepath: str = None) -> str:
        """加载指定环境的.env文件"""
        if filepath is None:
            # 尝试多种常见.env文件命名格式
            possible_files = [
                ".env",
                "config/.env",
            ]
            if env_name != None:
                possible_files = [
                    f".env.{env_name}",
                    f"config/.env.{env_name}"
                ]

            for f in possible_files:
                if os.path.exists(f):
                    filepath = f
                    break
            else:
                filepath = f".env.{env_name}"

        config = {}
        try:
            with open(filepath, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"\'')

                        # 处理变量引用（如 ${OTHER_VAR}）
                        if value.startswith('${') and value.endswith('}'):
                            ref_key = value[2:-1]
                            value = os.getenv(
                                ref_key, '') or config.get(ref_key, '')

                        config[key] = value
        except FileNotFoundError:
            print(f"Warning: Environment file {filepath} not found.")

        self.configs[env_name] = config
        return filepath

    def load_envs(self, env_names: List[str]) -> None:
        """批量加载多个环境"""
        for env in env_names:
            self.load_env(env)

    def set_current_env(self, env_name: str) -> None:
        """设置当前使用的环境"""
        if env_name in self.configs:
            self.current_env = env_name
        else:
            # 如果环境未加载，尝试自动加载
            try:
                self.load_env(env_name)
                self.current_env = env_name
            except Exception as e:
                raise ValueError(
                    f"Environment {env_name} not found and could not be loaded: {str(e)}")

    def get(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """获取配置值（优先使用系统环境变量，其次使用.env文件中的值）"""
        # 首先检查系统环境变量
        value = os.getenv(key)
        if value is not None:
            return value

        # 然后检查当前环境的配置
        if key in self.configs[self.current_env]:
            return self.configs[self.current_env][key]

        return default

    def __getitem__(self, key: str) -> str:
        """通过[]操作符获取配置值"""
        value = self.get(key)
        if value is None:
            raise KeyError(
                f"Key {key} not found in environment variables or {self.current_env} config.")
        return value

    def to_dict(self) -> Dict[str, str]:
        # """获取当前环境的完整配置字典（合并系统环境变量）"""
        # if self.current_env is None:
        #     raise RuntimeError(
        #         "No environment selected. Call set_current_env() first.")

        # 合并系统环境变量和文件配置（系统环境变量优先）
        config = self.configs[self.current_env].copy()
        for key, value in os.environ.items():
            config[key] = value
        return config

    def get_current_env(self) -> Optional[str]:
        """获取当前环境名称"""
        return self.current_env


def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(
        description='Multi-environment configuration loader')
    parser.add_argument('--env', '-e', type=str, default=None,
                        help='Environment to use (e.g. dev, prod, test)')
    parser.add_argument('--env-file', '-f', type=str, default=None,
                        help='Custom env file path (overrides default .env.{env} pattern)')
    return parser.parse_args()


def init_multienv() -> MultiEnv:
    """初始化多环境配置"""
    args = parse_args()
    env = MultiEnv()

    # 确定要使用的环境（优先级：命令行参数 > 环境变量 > 默认值）
    env_name = (
        args.env or                      # 命令行参数
        os.getenv(env.env_var_name) or   # 环境变量
        None                            # 默认值
    )

    # 默认加载.env环境配置
    env_file_path = env.load_env()

    # 加载指定环境配置（如果不是dev或者有自定义文件）
    if env_name != None or args.env_file:
        env.load_env(env_name, args.env_file)

    env.set_current_env(env_name)

    # 打印当前环境信息（调试用）
    print(f"Using environment: {env_file_path}", file=sys.stderr)

    return env


# 全局实例
multienv = init_multienv()

if __name__ == '__main__':
    # from multienv import multienv

    # 获取配置值
    db_host = multienv.get('LLM_IP')
    db_port = multienv['LLM_PORT']  # 使用[]操作符，如果key不存在会抛出KeyError

    # 获取整个配置字典
    config = multienv.to_dict()
    print(db_host)
    print(db_port)
