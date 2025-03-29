import { ArrowRight, ArrowsUpFromLine, ArrowRightToLine, ChartBar, Copy, Database, FilePlus, GitBranch, GitFork, GitMerge, Layers, Mail, MessageSquare, Server, Workflow } from 'lucide-react';

const nodeCategories = [
  {
    title: '数据处理',
    nodes: [
      { type: 'input', name: '数据输入', icon: <FilePlus size={20} /> },
      { type: 'transform', name: '数据转换', icon: <Layers size={20} /> },
      { type: 'output', name: '数据输出', icon: <Database size={20} /> }
    ]
  },
  {
    title: '流程控制',
    nodes: [
      { type: 'conditional', name: 'If/Else 条件', icon: <GitFork size={20} /> },
      { type: 'fanIn', name: '扇入 (并行开始)', icon: <GitBranch size={20} /> },
      { type: 'fanOut', name: '扇出 (并行结束)', icon: <GitMerge size={20} /> }
    ]
  },
  {
    title: 'API操作',
    nodes: [
      { type: 'api', name: 'API请求', icon: <Server size={20} /> },
      { type: 'webhook', name: 'Webhook', icon: <Copy size={20} /> }
    ]
  },
  {
    title: '服务集成',
    nodes: [
      { type: 'notification', name: '通知服务', icon: <Mail size={20} /> },
      { type: 'analytics', name: '分析服务', icon: <ChartBar size={20} /> },
      { type: 'messaging', name: '消息服务', icon: <MessageSquare size={20} /> }
    ]
  }
];

export default function Sidebar() {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, nodeName: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/nodename', nodeName);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-white overflow-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-800 flex items-center">
          <Workflow size={18} className="mr-2" />
          节点库
        </h2>
      </div>
      <div className="px-4 py-2">
        {nodeCategories.map((category, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider py-2">
              {category.title}
            </h3>
            <div className="space-y-2">
              {category.nodes.map((node, nodeIndex) => (
                <div
                  key={nodeIndex}
                  className="border border-gray-200 p-3 rounded-md bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-grab flex items-center"
                  onDragStart={(event) => onDragStart(event, node.type, node.name)}
                  draggable
                >
                  <div className="text-gray-600 mr-2">{node.icon}</div>
                  <span className="text-sm text-gray-700">{node.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
