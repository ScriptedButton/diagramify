import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";

interface UseNodeDeletionProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
  mode: string;
}

export function useNodeDeletion({
  setNodes,
  setEdges,
  mode,
}: UseNodeDeletionProps) {
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      if (mode !== "delete") return;

      // Remove the node
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));

      // Remove any edges connected to this node
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [mode, setNodes, setEdges]
  );

  return { handleNodeDelete };
}
