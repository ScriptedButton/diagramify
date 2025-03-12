import { useCallback } from "react";
import { Connection, Edge, MarkerType } from "@xyflow/react";
import { generateUniqueActivityId } from "../utils/activityUtils";

interface UseEdgeHandlingProps {
  mode: string;
  edges: Edge[];
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
  diagramType: "AOA" | "AON";
  advancedMode: boolean;
  edgeStyle: "bezier" | "straight" | "step";
}

export function useEdgeHandling({
  mode,
  edges,
  setEdges,
  diagramType,
  advancedMode,
  edgeStyle,
}: UseEdgeHandlingProps) {
  const onConnect = useCallback(
    (params: Connection) => {
      if (mode === "connect" && params.source && params.target) {
        const existingEdgeCount = edges.filter(
          (edge) =>
            edge.source === params.source && edge.target === params.target
        ).length;

        const activityId = generateUniqueActivityId(edges);
        const existingIncomingEdges = edges.filter(
          (edge) => edge.target === params.target
        );
        const hasCoDependency = existingIncomingEdges.length > 0;

        const sourceHandle =
          existingEdgeCount > 0
            ? `source-${existingEdgeCount}`
            : params.sourceHandle;
        const targetHandle =
          existingEdgeCount > 0
            ? `target-${existingEdgeCount}`
            : params.targetHandle;

        const edgeLineStyle = hasCoDependency
          ? { stroke: "#6366f1", strokeWidth: 2 }
          : { stroke: "#94a3b8", strokeWidth: 2 };

        const edgeType = edgeStyle === "bezier" ? "default" : edgeStyle;

        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          source: params.source,
          target: params.target,
          sourceHandle,
          targetHandle,
          animated: false,
          style: edgeLineStyle,
          type: edgeType,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: hasCoDependency ? "#6366f1" : "#94a3b8",
          },
          labelStyle: { fontSize: "14px", fontWeight: "bold" },
          data:
            diagramType === "AOA"
              ? {
                  activityId,
                  duration: 1,
                  earlyStart: 0,
                  earlyFinish: 1,
                  lateStart: 0,
                  lateFinish: 1,
                  label: !advancedMode
                    ? `${activityId}(1)`
                    : `${activityId}(ES:0,EF:1)`,
                  hasCoDependency,
                  dependsOn: existingIncomingEdges
                    .map((e) => e.data?.activityId as string)
                    .filter(Boolean),
                  edgeType: edgeStyle,
                }
              : {
                  weight: 0,
                  label: "",
                  edgeType: edgeStyle,
                },
        };
        setEdges((eds) => eds.concat(newEdge));
      }
    },
    [mode, setEdges, edges, diagramType, advancedMode, edgeStyle]
  );

  return { onConnect };
}
