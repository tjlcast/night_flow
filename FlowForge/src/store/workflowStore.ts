import { create } from "zustand";
import {
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from "reactflow";

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  updateNode: (nodeId: string, newData: any) => void;
  updateNodeStyle: (nodeId: string, newData: any) => void;
  importWorkflow: (nodes: Node[], edges: Edge[]) => void;
}

// Create a store for workflow state management
export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  edges: [],

  setNodes: (nodes) =>
    set((state) => ({
      nodes: typeof nodes === "function" ? nodes(state.nodes) : nodes,
    })),

  setEdges: (edges) =>
    set((state) => ({
      edges: typeof edges === "function" ? edges(state.edges) : edges,
    })),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    })),

  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    })),

  updateNode: (nodeId, newData) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          // For parallel nodes, force re-render by slightly changing position
          if (
            (node.data.type === "fanIn" || node.data.type === "fanOut") &&
            newData.parallelPaths !== node.data.parallelPaths
          ) {
            return {
              ...node,
              data: { ...node.data, ...newData },
              position: { ...node.position, x: node.position.x + 0.00001 },
            };
          }

          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      }),
    })),

  updateNodeStyle: (nodeId, newStyle) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            style: { ...newStyle },
          };
        }
        return node;
      }),
    })),

  importWorkflow: (importedNodes, importedEdges) =>
    set(() => {
      // Return the new state with imported nodes and edges
      return {
        nodes: importedNodes,
        edges: importedEdges,
      };
    }),
}));
