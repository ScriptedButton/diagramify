"use client";

import { useCallback } from "react";
import {
  EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

interface EdgeData {
  activityId?: string;
  duration?: number;
  earlyStart?: number;
  earlyFinish?: number;
  label?: string;
  isCritical?: boolean;
  hasCoDependency?: boolean;
  advancedMode?: boolean;
}

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
    const currentDuration = data?.duration?.toString() || "";
    const newDuration = window.prompt(
      "Enter duration (leave empty for no duration):",
      currentDuration
    );
    if (newDuration !== null) {
      const duration =
        newDuration.trim() === "" ? undefined : parseInt(newDuration, 10);
      if (
        newDuration.trim() === "" ||
        (typeof duration === "number" && duration > 0)
      ) {
        window.updateDiagramEdge?.(id, { ...data, duration });
      }
    }
  }, [id, data]);

  // Format the label based on the data
  const formatLabel = () => {
    if (!data) return null;

    const edgeData = data as EdgeData;
    const {
      activityId,
      duration,
      isCritical,
      hasCoDependency,
      advancedMode,
      earlyStart,
    } = edgeData;

    if (!activityId) return null;

    let labelText: string = activityId;

    if (typeof duration === "number") {
      if (!advancedMode) {
        labelText = `${activityId}(${duration})`;
      } else {
        const es = typeof earlyStart === "number" ? earlyStart : 0;
        labelText = `${activityId}(ES:${es},EF:${es + duration})`;
      }
    }

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
  };

  // Check if we should render the label
  const shouldRenderLabel = () => {
    if (!data) return false;
    const edgeData = data as EdgeData;
    return typeof edgeData.activityId === "string";
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
