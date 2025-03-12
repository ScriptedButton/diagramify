"use client";

import { useCallback } from "react";
import {
  EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps) {
  // Calculate a unique curvature based on the edge ID to prevent overlapping
  const edgeIdNumber = parseInt(id.replace(/\D/g, ""), 10);
  const baseCurvature = 0.35;
  const uniqueCurvature = isNaN(edgeIdNumber)
    ? baseCurvature
    : baseCurvature + (edgeIdNumber % 10) * 0.03;

  // Decide which path function to use based on the type
  let edgePath, labelX, labelY;

  const defaultParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: uniqueCurvature,
  };

  // Generate the path based on the type stored in data
  if (data?.edgeType === "straight") {
    // For straight edges, draw a direct line
    edgePath = `M${sourceX},${sourceY} L${targetX},${targetY}`;
    // Position the label at the middle of the line
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  } else if (data?.edgeType === "step") {
    // For step edges (right angles), calculate a path with right angles
    const midX = (sourceX + targetX) / 2;
    edgePath = `M${sourceX},${sourceY} L${midX},${sourceY} L${midX},${targetY} L${targetX},${targetY}`;
    // Position the label in the middle segment
    labelX = midX;
    labelY = (sourceY + targetY) / 2;
  } else {
    // Default is bezier curve
    [edgePath, labelX, labelY] = getBezierPath(defaultParams);
  }

  const onEdgeClick = useCallback(() => {
    const newDuration = window.prompt(
      "Enter duration:",
      data?.duration?.toString() || "1"
    );
    if (newDuration !== null) {
      const duration = parseInt(newDuration, 10);
      if (!isNaN(duration) && duration > 0) {
        window.updateDiagramEdge?.(id, { ...data, duration });
      }
    }
  }, [id, data]);

  // Format the label based on the data
  const formatLabel = () => {
    if (!data) return null;

    const { activityId, duration, isCritical, hasCoDependency, advancedMode } =
      data;

    if (activityId && typeof duration === "number") {
      const earlyStart =
        typeof data.earlyStart === "number" ? data.earlyStart : 0;
      const labelText = !advancedMode
        ? `${activityId}(${duration})`
        : `${activityId}(ES:${earlyStart},EF:${earlyStart + duration})`;

      return (
        <div className="flex items-center">
          <div
            className={cn(
              "font-bold",
              isCritical ? "text-red-600" : "",
              hasCoDependency ? "text-indigo-600" : ""
            )}
          >
            {labelText}
          </div>
        </div>
      );
    }
    return null;
  };

  // Check if we should render the label
  const shouldRenderLabel = () => {
    if (!data) return false;

    return (
      (typeof data.label === "string" && data.label.length > 0) ||
      (typeof data.activityId === "string" && typeof data.duration === "number")
    );
  };

  const label = formatLabel();

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke:
            style?.stroke || (data?.hasCoDependency ? "#6366f1" : "#94a3b8"),
          strokeWidth: style?.strokeWidth || 2,
        }}
      />
      {shouldRenderLabel() && label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "bg-white dark:bg-gray-900",
              "rounded-md",
              "p-1",
              "flex items-center gap-2"
            )}
            onClick={onEdgeClick}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
