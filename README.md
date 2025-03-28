要运行上面的 Node.js REST API 代码，你需要按照以下步骤操作：

## 1. 准备环境

首先确保你已经安装了 Node.js 和 npm（Node.js 包管理器）：

1. 下载并安装 Node.js：[https://nodejs.org/](https://nodejs.org/)（建议选择 LTS 版本）
2. 安装完成后，打开终端/命令行，验证安装：
   ```bash
   node -v
   npm -v
   ```

## 2. 创建项目目录

1. 创建一个新目录用于你的项目：
   ```bash
   mkdir node-monitor-api
   cd node-monitor-api
   ```

## 3. 初始化 Node.js 项目

1. 初始化项目（会创建 package.json 文件）：
   ```bash
   npm init -y
   ```

## 4. 安装所需依赖

安装 Express 和 WebSocket 库：
```bash
npm install express ws
```

## 5. 创建 API 文件

1. 创建一个名为 `server.js` 的文件，将上面的 Node.js 代码复制进去

或者使用命令行创建：
```bash
touch server.js
```

然后用文本编辑器（如 VSCode、Notepad++等）打开 `server.js`，粘贴上面的 Node.js REST API 代码。

## 6. 运行服务器

启动服务器：
```bash
node server.js
```

你应该会看到控制台输出：
```
API server running on port 3000
```

## 7. 测试 API

现在你可以测试 API 是否正常工作：

### 测试 REST API

1. 使用浏览器访问：
   ```
   http://localhost:3000/api/nodes
   ```
   你应该能看到返回的 JSON 格式的节点数据

2. 测试特定节点（例如 ID 为 1 的节点）：
   ```
   http://localhost:3000/api/nodes/1
   ```

### 测试 WebSocket

你可以使用 WebSocket 客户端工具测试 WebSocket 连接，如：

1. 安装 WebSocket 客户端工具（如 `wscat`）：
   ```bash
   npm install -g wscat
   ```

2. 连接到 WebSocket 服务器：
   ```bash
   wscat -c ws://localhost:3000
   ```
   连接成功后，你会实时收到服务器发送的节点更新消息

## 8. 与前端配合使用

修改前端代码中的 API 地址为：
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
const WS_BASE_URL = 'ws://localhost:3000';
```

然后打开前端页面，它现在会连接到你的本地 API 服务器。

## 9. 开发建议

1. **使用 nodemon 自动重启**：
   开发时安装 nodemon 可以自动重启服务器：
   ```bash
   npm install -g nodemon
   ```
   然后使用以下命令运行：
   ```bash
   nodemon server.js
   ```

2. **环境变量**：
   建议将端口等配置放在环境变量中：
   ```javascript
   const PORT = process.env.PORT || 3000;
   server.listen(PORT, () => {
       console.log(`API server running on port ${PORT}`);
   });
   ```

3. **生产部署**：
   生产环境建议：
   - 使用 PM2 管理进程：`npm install -g pm2`
   - 使用 Nginx 作为反向代理
   - 配置 HTTPS

## 10. 完整项目结构

你的项目目录现在应该类似这样：
```
node-monitor-api/
├── node_modules/
├── package.json
├── package-lock.json
└── server.js
```

现在你已经成功设置并运行了机器节点管理系统的后端 API 服务！