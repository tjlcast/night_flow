import psutil
import socket
import datetime
import random

class SystemMonitor:
    def get_cpu_usage(self):
        """获取CPU使用率"""
        return psutil.cpu_percent(interval=1)
    
    def get_cpu_cores(self):
        """获取CPU核心数"""
        return psutil.cpu_count()
    
    def get_memory_usage(self):
        """获取内存使用情况(GB)"""
        mem = psutil.virtual_memory()
        return {
            "used": round(mem.used / (1024 ** 3), 2),
            "total": round(mem.total / (1024 ** 3), 2)
        }
    
    def get_disk_usage(self):
        """获取磁盘使用情况(GB)"""
        usage = psutil.disk_usage('/')
        return {
            "used": round(usage.used / (1024 ** 3), 2),
            "total": round(usage.total / (1024 ** 3), 2)
        }
    
    def get_ip_address(self):
        """获取IP地址"""
        try:
            return socket.gethostbyname(socket.gethostname())
        except:
            return "127.0.0.1"
    
    def get_hostname(self):
        """获取主机名"""
        return socket.gethostname()
    
    def generate_sample_tasks(self):
        """生成示例任务列表"""
        return [
            {"id": 101, "name": "主服务进程", "status": "running"},
            {"id": 102, "name": "日志处理", "status": "running"},
            {"id": 103, "name": "数据备份", "status": "completed"}
        ]
    
    def get_system_info(self):
        """获取完整的系统信息"""
        return {
            "cpu": {
                "usage": self.get_cpu_usage(),
                "cores": self.get_cpu_cores()
            },
            "memory": self.get_memory_usage(),
            "disk": self.get_disk_usage(),
            "ip": self.get_ip_address(),
            "hostname": self.get_hostname(),
            "tasks": self.generate_sample_tasks()
        }