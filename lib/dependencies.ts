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

  // Update all linked edges with the same data
  return allEdges.map((edge) => {
    const edgeData = edge.data as EdgeData;
    if (edge.id === edgeId || edgeData?.activityId === targetData.activityId) {
      return {
        ...edge,
        data: { ...edgeData, ...newData },
        label: `${edgeData.activityId}(${
          newData.duration !== undefined ? newData.duration : edgeData.duration
        })`,
      };
    }
    return edge;
  });
};
