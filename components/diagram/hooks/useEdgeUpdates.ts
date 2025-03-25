import { useCallback, useEffect } from "react";
import { updateLinkedCoDependencies } from "@/lib/dependencies";
import { EdgeData, CustomEdge } from "../types";
import { Connection, Edge, reconnectEdge } from "@xyflow/react";

interface UseEdgeUpdatesProps {
  diagramType: "AOA" | "AON";
  advancedMode: boolean;
  edgeStyle: "bezier" | "straight" | "step";
  setEdges: (updater: (edges: CustomEdge[]) => CustomEdge[]) => void;
}

export function useEdgeUpdates({
  diagramType,
  advancedMode,
  edgeStyle,
  setEdges,
}: UseEdgeUpdatesProps) {
  // Helper function to format numbers with appropriate decimal places
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return "0";
    // Show up to 2 decimal places, but only if needed
    return Number.isInteger(num)
      ? num.toString()
      : num
          .toFixed(3)
          .replace(/\.00$/, "")
          .replace(/(\.\d+?)0+$/, "$1");
  };

  // Update edge labels when advanced mode changes
  useEffect(() => {
    console.log(`useEdgeUpdates - advancedMode changed to: ${advancedMode}`);

    if (diagramType === "AOA") {
      setEdges((eds) => {
        console.log(
          `Updating ${eds.length} edges with new advancedMode: ${advancedMode}`
        );

        return eds.map((edge) => {
          const data = edge.data as EdgeData;
          if (data?.activityId) {
            const duration = data.duration || 0;
            const earlyStart = data.earlyStart || 0;
            const earlyFinish = earlyStart + duration;
            const newLabel = advancedMode
              ? `${data.activityId}(${formatNumber(earlyStart)}, ${formatNumber(earlyFinish)})`
              : `${data.activityId}(${formatNumber(duration)})`;

            console.log(`Edge ${edge.id} - new label: ${newLabel}`);

            return {
              ...edge,
              label: newLabel,
              labelStyle: { fontSize: "14px", fontWeight: "bold" },
              data: {
                ...data,
                label: newLabel,
                advancedMode: advancedMode,
              },
            };
          }
          return edge;
        });
      });
    }
  }, [advancedMode, diagramType, setEdges]);

  // Update edge styles when edge style changes
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        type: edgeStyle === "bezier" ? "default" : edgeStyle,
        data: {
          ...edge.data,
          edgeType: edgeStyle,
        },
      }))
    );
  }, [edgeStyle, setEdges]);

  // Update edge data
  const updateEdgeData = useCallback(
    (edgeId: string, newData: Partial<EdgeData>) => {
      setEdges((eds) => {
        // Check for co-dependencies
        const updatedEdges = updateLinkedCoDependencies(
          edgeId,
          newData as EdgeData,
          eds
        );

        if (updatedEdges !== eds) {
          return updatedEdges;
        }

        // Update single edge
        return eds.map((edge) => {
          if (edge.id === edgeId) {
            const data = edge.data as EdgeData;
            const duration =
              newData.duration !== undefined
                ? newData.duration
                : data.duration || 0;
            const earlyStart = data.earlyStart || 0;
            const label =
              diagramType === "AOA"
                ? !advancedMode
                  ? `${data.activityId}(${formatNumber(duration)})`
                  : `${data.activityId}(${formatNumber(earlyStart)}, ${formatNumber(earlyStart + duration)})`
                : newData.label;

            return {
              ...edge,
              data: { ...data, ...newData },
              label,
              labelStyle: { fontSize: "14px", fontWeight: "bold" },
            };
          }
          return edge;
        });
      });
    },
    [diagramType, advancedMode, setEdges]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) =>
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els)),
    [setEdges]
  );

  return {
    updateEdgeData,
    onReconnect,
  };
}
