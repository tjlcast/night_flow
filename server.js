const express = require("express");
const app = express();
const WebSocket = require("ws");
const winston = require("winston");
const workerRoutes = require("./routes/workers");

// 模拟数据库
let nodes = [
  {
    id: 1,
    name: "Web服务器-01",
    online: true,
    ip: "192.168.1.101",
    cpu: { usage: 65, cores: 8 },
    memory: { used: 12, total: 16 },
    disk: { used: 120, total: 256 },
    tasks: [
      { id: 101, name: "Web服务", status: "running" },
      { id: 102, name: "数据库同步", status: "running" },
      { id: 103, name: "日志清理", status: "completed" },
    ],
  },
  {
    id: 2,
    name: "数据库服务器-01",
    online: true,
    ip: "192.168.1.102",
    cpu: {
      usage: 45,
      cores: 16,
    },
    memory: {
      used: 32,
      total: 64,
    },
    disk: {
      used: 512,
      total: 1024,
    },
    tasks: [
      { id: 201, name: "主数据库", status: "running" },
      { id: 202, name: "备份任务", status: "completed" },
    ],
  },
  {
    id: 3,
    name: "缓存服务器-01",
    online: false,
    ip: "192.168.1.103",
    cpu: {
      usage: 0,
      cores: 4,
    },
    memory: {
      used: 0,
      total: 8,
    },
    disk: {
      used: 5,
      total: 50,
    },
    tasks: [],
  },
  {
    id: 4,
    name: "应用服务器-01",
    online: true,
    ip: "192.168.1.104",
    cpu: {
      usage: 78,
      cores: 8,
    },
    memory: {
      used: 14,
      total: 16,
    },
    disk: {
      used: 80,
      total: 200,
    },
    tasks: [
      { id: 401, name: "应用服务A", status: "running" },
      { id: 402, name: "应用服务B", status: "failed" },
      { id: 403, name: "定时任务", status: "completed" },
    ],
  },
];

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// 日志配置
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "manager.log" }),
  ],
});

// worker的路由
app.use("/api/v1/workers", workerRoutes(logger, nodes));
// 存储节点状态
const workerStatus = new Map();

// REST API
app.get("/api/nodes", (req, res) => {
  res.json(nodes);
});

app.get("/api/nodes/:id", (req, res) => {
  const node = nodes.find((n) => n.id === parseInt(req.params.id));
  if (node) {
    res.json(node);
  } else {
    res.status(404).json({ error: "Node not found" });
  }
});

// 下线节点API
app.put("/api/nodes/:id/offline", (req, res) => {
  const nodeId = parseInt(req.params.id);
  const nodeIndex = nodes.findIndex((n) => n.id === nodeId);

  if (nodeIndex === -1) {
    return res.status(404).json({ error: "Node not found" });
  }

  nodes[nodeIndex].online = false;

  // 广播节点下线通知
  broadcastToWebSocketClients({
    type: "node_offline",
    payload: { id: nodeId },
  });

  res.json({ success: true, message: "Node set to offline" });
});

// 上线节点API
app.put("/api/nodes/:id/online", (req, res) => {
  const nodeId = parseInt(req.params.id);
  const nodeIndex = nodes.findIndex((n) => n.id === nodeId);

  if (nodeIndex === -1) {
    return res.status(404).json({ error: "Node not found" });
  }

  nodes[nodeIndex].online = true;

  // 广播节点上线通知
  broadcastToWebSocketClients({
    type: "node_online",
    payload: nodes[nodeIndex],
  });

  res.json({ success: true, message: "Node set to online" });
});

// 删除节点API
app.delete("/api/nodes/:id", (req, res) => {
  const nodeId = parseInt(req.params.id);
  const nodeIndex = nodes.findIndex((n) => n.id === nodeId);

  if (nodeIndex === -1) {
    return res.status(404).json({ error: "Node not found" });
  }

  // 从数组中删除节点
  nodes.splice(nodeIndex, 1);

  // 广播节点删除通知
  broadcastToWebSocketClients({
    type: "node_deleted",
    payload: { id: nodeId },
  });

  res.json({ success: true, message: "Node deleted successfully" });
});

const server = app.listen(3000, () => {
  startHeartbeatChecker();
  console.log("API server running on port 3000");
});

// WebSocket服务器
const wss = new WebSocket.Server({ server });

// 存储所有连接的WebSocket客户端
let webSocketClients = [];

wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");
  webSocketClients.push(ws);

  ws.on("close", () => {
    console.log("Client disconnected");
    webSocketClients = webSocketClients.filter((client) => client !== ws);
  });
});

// 广播消息给所有WebSocket客户端
function broadcastToWebSocketClients(message) {
  const messageString = JSON.stringify(message);
  webSocketClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

// 启动心跳检测定时器
function startHeartbeatChecker() {
  setInterval(() => {
    const now = Date.now();
    nodes.forEach((node) => {
      // 检查是否存在last_heartbeat字段
      const hasNoHeartbeat = !node.hasOwnProperty("last_heartbeat");
      // 检查是否超时（30秒）
      const isTimeout =
        node.last_heartbeat && now - node.last_heartbeat > 30000; // 30秒超时
      if (node.online && (hasNoHeartbeat || isTimeout)) {
        node.online = false;
        console.log(`Worker ${node.id} timed out`);
        // 广播更新
        broadcastToWebSocketClients({
          type: "node_update",
          payload: node,
        });
      }
    });
  }, 35000); // 每30秒检查一次
}

// 模拟实时更新
setInterval(() => {
  nodes.forEach((node) => {
    if (node.name == "jialtang-surface") {
      return;
    }

    if (node.online) {
      // 模拟数据变化
      node.cpu.usage = Math.max(
        0,
        Math.min(100, node.cpu.usage + (Math.random() * 10 - 5))
      );
      node.memory.used = Math.max(
        0,
        Math.min(node.memory.total, node.memory.used + (Math.random() - 0.5))
      );
      node.disk.used = Math.max(
        0,
        Math.min(node.disk.total, node.disk.used + (Math.random() * 2 - 1))
      );

      // 随机改变任务状态
      if (Math.random() > 0.8 && node.tasks.length > 0) {
        const randomTaskIndex = Math.floor(Math.random() * node.tasks.length);
        const statuses = ["running", "completed", "failed"];
        node.tasks[randomTaskIndex].status =
          statuses[Math.floor(Math.random() * statuses.length)];
      }

      // 广播更新
      broadcastToWebSocketClients({
        type: "node_update",
        payload: node,
      });
    }
  });

  // 随机模拟节点上线/下线
  if (Math.random() > 0.9) {
    const randomNodeIndex = Math.floor(Math.random() * nodes.length);
    nodes[randomNodeIndex].online = !nodes[randomNodeIndex].online;

    broadcastToWebSocketClients({
      type: nodes[randomNodeIndex].online ? "node_online" : "node_offline",
      payload: nodes[randomNodeIndex].online
        ? nodes[randomNodeIndex]
        : { id: nodes[randomNodeIndex].id },
    });
  }
}, 5000);
