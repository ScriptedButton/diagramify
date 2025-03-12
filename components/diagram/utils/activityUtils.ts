import { Edge } from "@xyflow/react";

export function generateUniqueActivityId(edges: Edge[]): string {
  const usedActivityIds = new Set(
    edges.map((edge) => edge.data?.activityId).filter(Boolean)
  );
  let activityId = "";
  let charCode = 65; // 'A'

  while (!activityId || usedActivityIds.has(activityId)) {
    activityId = String.fromCharCode(charCode);
    charCode++;
    if (charCode > 90) {
      // 'Z'
      // If we run out of letters, start using AA, AB, etc.
      charCode = 65;
      activityId = "A" + String.fromCharCode(charCode);
    }
  }

  return activityId;
}
