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
    if (!data) return "";

    const { activityId, duration, isCritical, hasCoDependency, advancedMode } =
      data;

    if (activityId && duration !== undefined) {
      // Decide which format to use based on advancedMode
      const labelText = !advancedMode
        ? `${activityId}(${duration})`
        : `${activityId}(ES:${data.earlyStart || 0},EF:${
            (data.earlyStart || 0) + duration
          })`;

      return (
        <div className="flex items-center">
          <div
            className={cn(
              "font-bold",
              isCritical && "text-red-600",
              hasCoDependency && "text-indigo-600"
            )}
          >
            {labelText}
          </div>
        </div>
      );
    }
    return "";
  };

  // Check if we should render the label
  const shouldRenderLabel = () => {
    // Only render if data exists and either:
    // 1. data.label exists, or
    // 2. activityId and duration exist (for formatted labels)
    return (
      data &&
      ((data.label && data.label.length > 0) ||
        (data.activityId && data.duration !== undefined))
    );
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {shouldRenderLabel() && (
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
            {formatLabel()}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
