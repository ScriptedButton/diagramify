import { EdgeData, CustomEdge } from "@/components/diagram/types";

export const updateLinkedCoDependencies = (
  edgeId: string,
  newData: EdgeData,
  allEdges: CustomEdge[]
) => {
  // Find the edge being updated
  const targetEdge = allEdges.find((e) => e.id === edgeId);
  if (!targetEdge || !targetEdge.data) return allEdges;

  const targetData = targetEdge.data as EdgeData;
  if (!targetData.activityId) return allEdges;

  // Find all edges with the same activity ID (co-dependencies)
  const linkedEdges = allEdges.filter(
    (e) => e.id !== edgeId && e.data?.activityId === targetData.activityId
  );

  if (linkedEdges.length === 0) return allEdges;

  // Properties that should be shared between co-dependent edges
  const sharedProperties = ["duration", "isDummy", "isCritical", "isDashed"];

  // Update all linked edges with only the shared properties
  return allEdges.map((edge) => {
    const edgeData = edge.data as EdgeData;
    if (edge.id === edgeId) {
      // For the target edge, apply all new data
      return {
        ...edge,
        data: { ...edgeData, ...newData },
        label: newData.hideLabel
          ? undefined
          : `${edgeData.activityId}(${
              newData.duration !== undefined
                ? newData.duration
                : edgeData.duration
            })`,
      };
    } else if (edgeData?.activityId === targetData.activityId) {
      // For linked edges, only apply shared properties
      const sharedData = Object.fromEntries(
        Object.entries(newData).filter(([key]) =>
          sharedProperties.includes(key)
        )
      );
      return {
        ...edge,
        data: { ...edgeData, ...sharedData },
        label: edgeData.hideLabel
          ? undefined
          : `${edgeData.activityId}(${
              newData.duration !== undefined
                ? newData.duration
                : edgeData.duration
            })`,
      };
    }
    return edge;
  });
};
