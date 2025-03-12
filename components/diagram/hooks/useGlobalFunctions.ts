import { useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import { EdgeData, NodeData, CustomNode, CustomEdge } from "../types";

interface UseGlobalFunctionsProps {
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => Edge[];
  updateEdgeData: (edgeId: string, data: Partial<EdgeData>) => void;
}

declare global {
  interface Window {
    updateDiagramNode?: (nodeId: string, newData: Partial<NodeData>) => void;
    updateDiagramEdge?: (edgeId: string, newData: Partial<EdgeData>) => void;
    updateDiagramFromJson?: (data: {
      nodes: CustomNode[];
      edges: CustomEdge[];
    }) => void;
  }
}

export function useGlobalFunctions({
  setNodes,
  setEdges,
  updateEdgeData,
}: UseGlobalFunctionsProps) {
  // Setup global functions
  useEffect(() => {
    // Create a global function to update node data
    window.updateDiagramNode = (nodeId: string, newData: Partial<NodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );
    };

    // Create a global function to update edge data
    window.updateDiagramEdge = (edgeId: string, newData: Partial<EdgeData>) => {
      updateEdgeData(edgeId, newData);
    };

    // Create a global function to update the entire diagram from JSON
    window.updateDiagramFromJson = (data: {
      nodes: CustomNode[];
      edges: CustomEdge[];
    }) => {
      if (data.nodes && data.edges) {
        setNodes(() => data.nodes);
        setEdges(() => data.edges);
      }
    };

    // Cleanup when component unmounts
    return () => {
      delete window.updateDiagramNode;
      delete window.updateDiagramEdge;
      delete window.updateDiagramFromJson;
    };
  }, [setNodes, setEdges, updateEdgeData]);
}
