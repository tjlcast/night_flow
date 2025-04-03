import requests
import time
import threading
from datetime import datetime
from system_monitor import SystemMonitor


class WorkerNode:
    def __init__(self, manager_url, worker_id=None, worker_name=None):
        self.manager_url = manager_url
        self.worker_id = worker_id
        self.worker_name = worker_name or f"Worker-{datetime.now().strftime('%Y%m%d')}"
        self.heartbeat_interval = 30  # 默认30秒
        self.is_running = False
        self.monitor = SystemMonitor()

    def register(self):
        """向Manager注册当前Worker"""
        system_info = self.monitor.get_system_info()

        registration_data = {
            "id": self.worker_id,
            "name": self.worker_name,
            "online": True,
            "ip": system_info["ip"],
            "cpu": system_info["cpu"],
            "memory": system_info["memory"],
            "disk": system_info["disk"],
            "tasks": system_info["tasks"]
        }

        try:
            response = requests.post(
                f"{self.manager_url}/api/v1/workers/register",
                json=registration_data,
                timeout=10
            )
            response.raise_for_status()

            data = response.json()
            self.worker_id = data['worker_id']
            self.heartbeat_interval = data.get(
                'heartbeat_interval', 30) / 1000.0
            print(
                f"Registered successfully as {self.worker_name} (ID: {self.worker_id})")
            return True
        except Exception as e:
            print(f"Registration failed: {str(e)}")
            return False

    def send_heartbeat(self):
        """发送心跳到Manager"""
        while self.is_running:
            try:
                system_info = self.monitor.get_system_info()

                # 准备心跳数据
                heartbeat_data = {
                    "id": self.worker_id,
                    "online": True,
                    "cpu": {
                        "usage": system_info["cpu"]["usage"],
                        "cores": system_info["cpu"]["cores"]
                    },
                    "memory": system_info["memory"],
                    "disk": system_info["disk"],
                    "tasks": system_info["tasks"],
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }

                # 发送心跳
                response = requests.post(
                    f"{self.manager_url}/api/v1/workers/{self.worker_id}/heartbeat",
                    json=heartbeat_data,
                    timeout=10
                )
                response.raise_for_status()

                # 更新心跳间隔
                data = response.json()
                if 'next_heartbeat_interval' in data:
                    self.heartbeat_interval = data['next_heartbeat_interval'] / 1000.0

                print(
                    f"Heartbeat sent at {datetime.now().strftime('%H:%M:%S')}")

            except Exception as e:
                print(f"Heartbeat failed: {str(e)}")

            time.sleep(self.heartbeat_interval)

    def start(self):
        """启动Worker节点"""
        if not self.register():
            return False

        self.is_running = True
        heartbeat_thread = threading.Thread(target=self.send_heartbeat)
        heartbeat_thread.daemon = True
        heartbeat_thread.start()

        print(f"Worker {self.worker_name} (ID: {self.worker_id}) started")
        return True

    def stop(self):
        """停止Worker节点"""
        self.is_running = False
        print("Worker stopped")


if __name__ == "__main__":
    # 配置Manager地址
    MANAGER_URL = "http://localhost:3000"

    # 创建并启动Worker
    worker = WorkerNode(
        MANAGER_URL,
        worker_id=324,
        worker_name="jialtang-surface"  # 可以自定义名称
    )

    if worker.start():
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            worker.stop()
    else:
        print("Failed to start worker")
