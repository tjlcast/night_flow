import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChartBar, Copy, Database, FilePlus, GitBranch, GitFork, GitMerge, Layers, Mail, MessageSquare, Server } from 'lucide-react';

const nodeIcons: Record<string, JSX.Element> = {
  input: <FilePlus size={20} />,
  output: <Database size={20} />,
  transform: <Layers size={20} />,
  api: <Server size={20} />,
  webhook: <Copy size={20} />,
  notification: <Mail size={20} />,
  analytics: <ChartBar size={20} />,
  messaging: <MessageSquare size={20} />,
  conditional: <GitFork size={20} />,
  fanIn: <GitBranch size={20} />,
  fanOut: <GitMerge size={20} />
};

const CustomNode = ({ data, selected }: NodeProps) => {
  const icon = nodeIcons[data.type] || <Database size={20} />;
  
  // Default number of outputs for fan-in and inputs for fan-out
  const parallelPaths = data.parallelPaths || 3;
  
  return (
    <div className={`
      relative min-w-[150px] max-w-[250px] bg-white border-2 rounded-lg shadow-sm
      ${selected ? 'border-blue-500 shadow-blue-100' : 'border-gray-200'}
    `}>
      {/* Default input handle */}
      {data.type !== 'fanOut' ? (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      ) : (
        // Multiple input handles for fan-out node
        Array.from({ length: parallelPaths }).map((_, i) => {
          const position = 100 / (parallelPaths + 1) * (i + 1);
          return (
            <Handle
              key={`in-${i}`}
              id={`in-${i}`}
              type="target"
              position={Position.Top}
              className="w-3 h-3 bg-purple-500 border-2 border-white"
              style={{ left: `${position}%` }}
            />
          )
        })
      )}
      
      <div className="px-4 py-3">
        <div className="flex items-center mb-1">
          <div className="mr-2 text-gray-600">{icon}</div>
          <span className="text-sm font-medium text-gray-800">{data.label}</span>
        </div>
        {data.action && (
          <div className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600 mt-1">
            {data.action}
          </div>
        )}
        
        {data.condition && (
          <div className="text-xs px-2 py-1 bg-blue-50 rounded-md text-blue-600 mt-1 border border-blue-100">
            条件: {data.condition}
          </div>
        )}

        {(data.type === 'fanIn' || data.type === 'fanOut') && (
          <div className="text-xs px-2 py-1 bg-purple-50 rounded-md text-purple-600 mt-1 border border-purple-100">
            并行路径: {data.parallelPaths || 3}
          </div>
        )}
      </div>
      
      {data.type === 'conditional' ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 bg-green-500 border-2 border-white"
            style={{ left: '30%' }}
          />
          <div className="absolute text-xs text-green-600 font-medium" style={{ bottom: -5, left: '25%' }}>True</div>
          
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 bg-red-500 border-2 border-white"
            style={{ left: '70%' }}
          />
          <div className="absolute text-xs text-red-600 font-medium" style={{ bottom: -5, left: '65%' }}>False</div>
        </>
      ) : data.type === 'fanIn' ? (
        // Multiple output handles for fan-in node
        Array.from({ length: parallelPaths }).map((_, i) => {
          const position = 100 / (parallelPaths + 1) * (i + 1);
          return (
            <Handle
              key={`out-${i}`}
              id={`out-${i}`}
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 bg-purple-500 border-2 border-white"
              style={{ left: `${position}%` }}
            />
          )
        })
      ) : data.type === 'fanOut' ? (
        // Single output for fan-out
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-purple-500 border-2 border-white"
        />
      ) : (
        // Default output handle
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
