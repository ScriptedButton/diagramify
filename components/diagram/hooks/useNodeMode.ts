import { useEffect } from "react";
import { Node } from "@xyflow/react";
import { DiagramMode } from "../types";

interface UseNodeModeProps {
  mode: DiagramMode;
  advancedMode: boolean;
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
}

export function useNodeMode({
  mode,
  advancedMode,
  setNodes,
}: UseNodeModeProps) {
  // Update node properties when mode changes
  useEffect(() => {
    const draggable = mode === "select";
    const connectable = mode === "connect";
    const selectable = mode === "select" || mode === "delete";

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          mode,
        },
        draggable,
        connectable,
        selectable,
      }))
    );
  }, [mode, setNodes]);

  // Update nodes when advanced mode changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          advancedMode,
        },
      }))
    );
  }, [advancedMode, setNodes]);
}
