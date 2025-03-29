import { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Node,
  Edge,
  NodeTypes,
  Connection,
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import NodePanel from './NodePanel';
import CustomNode from './CustomNode';
import { nanoid } from './utils';
import { useWorkflowStore } from '../store/workflowStore';

// Define the node types for the workflow
const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

export default function WorkflowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Get state and actions from store
  const { 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    onNodesChange, 
    onEdgesChange,
    addNode,
    removeNode,
    updateNode
  } = useWorkflowStore();
  
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#555', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const name = event.dataTransfer.getData('application/nodename');
      
      if (typeof type === 'undefined' || !type || !reactFlowBounds || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeData: any = { 
        label: name, 
        type, 
        action: '未配置', 
        description: '' 
      };

      // Add specific fields based on node type
      if (type === 'conditional') {
        newNodeData.condition = '';
      } else if (type === 'fanIn' || type === 'fanOut') {
        newNodeData.parallelPaths = 3; // Default number of parallel paths
      }

      const newNode = {
        id: `node-${nanoid()}`,
        type: 'customNode',
        position,
        data: newNodeData,
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );
  
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
    if (nodes.length === 1) {
      setSelectedNode(nodes[0]);
    } else if (nodes.length === 0 && selectedNode) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    updateNode(nodeId, newData);
  }, [updateNode]);

  const deleteNode = useCallback((nodeId: string) => {
    removeNode(nodeId);
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode, removeNode]);

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex">
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              deleteKeyCode={["Backspace", "Delete"]}
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        {selectedNode && (
          <NodePanel 
            node={selectedNode}
            updateNodeData={updateNodeData}
            deleteNode={deleteNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
