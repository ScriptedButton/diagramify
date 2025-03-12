import { useCallback } from "react";
import { Node } from "@xyflow/react";

interface UseNodeConversionProps {
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
}

export function useNodeConversion({ setNodes }: UseNodeConversionProps) {
  const handleNodeConversion = useCallback(
    (nodeId: string, type: "start" | "end" | "normal") => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const style =
              type === "start"
                ? {
                    backgroundColor: "#4caf50",
                    color: "white",
                    borderColor: "#388e3c",
                  }
                : type === "end"
                  ? {
                      backgroundColor: "#f44336",
                      color: "white",
                      borderColor: "#d32f2f",
                    }
                  : undefined;

            return {
              ...node,
              data: {
                ...node.data,
                isStartNode: type === "start",
                isEndNode: type === "end",
                isStartEvent: type === "start",
                isEndEvent: type === "end",
                style,
                label:
                  type === "start"
                    ? "Start"
                    : type === "end"
                      ? "End"
                      : node.data.label,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  return {
    handleNodeConversion,
  };
}
