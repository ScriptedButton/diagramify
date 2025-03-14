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
  edgeStyle,
}: UseEdgeHandlingProps) {
  const onConnect = useCallback(
    (params: Connection) => {
      if (mode === "connect" && params.source && params.target) {
        // Check for existing edges between these nodes
        const existingEdge = edges.find(
          (edge) =>
            edge.source === params.source && edge.target === params.target
        );

        if (existingEdge) {
          console.log("Edge already exists between these nodes");
          return;
        }

        // Check for incoming edges to the target node for co-dependency
        const existingIncomingEdges = edges.filter(
          (edge) => edge.target === params.target
        );
        const hasCoDependency = existingIncomingEdges.length > 0;

        // Generate a unique activity ID for AOA diagrams
        const activityId =
          diagramType === "AOA" ? generateUniqueActivityId(edges) : undefined;

        // Set edge style based on type
        const edgeType = edgeStyle === "bezier" ? "default" : edgeStyle;
        const edgeLineStyle = {
          stroke: hasCoDependency ? "#6366f1" : "#94a3b8",
          strokeWidth: 2,
        };

        // Handle source and target handles
        const sourceHandle = params.sourceHandle || "right";
        const targetHandle = params.targetHandle || "left";

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
    [mode, setEdges, edges, diagramType, edgeStyle]
  );

  return { onConnect };
}
