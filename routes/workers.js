const express = require("express");

module.exports = (logger, nodes) => {
  const router = express.Router();

  // 生成唯一ID
  const generateId = () => {
    const maxId = nodes.length > 0 ? Math.max(...nodes.map((n) => n.id)) : 0;
    return maxId + 1;
  };

  // 节点注册
  router.post("/register", (req, res) => {
    const worker = req.body;

    if (!worker.ip) {
      logger.warn("Invalid registration attempt ", { worker });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 创建新节点
    const newNode = {
      id: generateId(),
      name: worker.name || `Worker-${generateId()}`,
      online: true,
      ip: worker.ip,
      port: worker.port,
      cpu: { usage: 0, cores: worker.cpu_cores || 4 },
      memory: { used: 0, total: worker.memory_gb || 8 },
      disk: { used: 0, total: worker.disk_gb || 100 },
      tasks: [],
      last_heartbeat: Date.now(),
      metrics: null,
    };

    nodes.push(newNode);
    logger.info(`Worker registered: ${newNode.name} (ID: ${newNode.id})`, {
      nodes,
    });

    res.json({
      worker_id: newNode.id,
      status: "registered",
      heartbeat_interval: 30000, // 30秒心跳间隔
    });
  });

  // 心跳处理
  router.post("/:worker_id/heartbeat", (req, res) => {
    const workerId = parseInt(req.params.worker_id);
    const worker = nodes.find((n) => n.id === workerId);

    if (!worker) {
      logger.warn(`Heartbeat from unknown worker: ${workerId}`);
      return res.status(404).json({ error: "Worker not found" });
    }

    // 更新最后心跳时间和状态
    worker.last_heartbeat = Date.now();
    worker.online = true;

    // 更新任务状态
    if (req.body.tasks) {
      worker.tasks = req.body.tasks;
    }

    // 更新指标数据
    const metrics = req.body;
    worker.cpu.usage = metrics.cpu.usage_percent;
    worker.memory.used = metrics.memory.used / (1024 * 1024 * 1024); // 转换为GB
    worker.disk.used = metrics.disk[0]?.used / (1024 * 1024 * 1024) || 0; // 转换为GB
    worker.metrics = metrics;
    worker.metrics.timestamp = new Date().toISOString();

    logger.debug(`Heartbeat received from ${workerId}`);

    res.json({
      status: "ok",
      next_heartbeat_interval: 30000,
    });
  });

  // 指标上报
  router.post("/:worker_id/metrics", (req, res) => {
    const workerId = parseInt(req.params.worker_id);
    const worker = nodes.find((n) => n.id === workerId);

    if (!worker) {
      logger.warn(`Metrics from unknown worker: ${workerId}`);
      return res.status(404).json({ error: "Worker not found" });
    }

    // 更新指标数据
    const metrics = req.body;
    worker.cpu.usage = metrics.cpu.usage_percent;
    worker.memory.used = metrics.memory.used / (1024 * 1024 * 1024); // 转换为GB
    worker.disk.used = metrics.disk[0]?.used / (1024 * 1024 * 1024) || 0; // 转换为GB
    worker.metrics = metrics;
    worker.metrics.timestamp = new Date().toISOString();

    logger.debug(`Metrics updated for ${workerId}`);

    res.json({ status: "ok" });
  });

  return router;
};
