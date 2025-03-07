"use client";

import { useCallback, useState } from "react";
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
} from "reactflow";
import { cn } from "@/lib/utils";
import { PencilIcon, InfoIcon } from "lucide-react";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Use getBezierPath instead of getSmoothStepPath for better curve separation
  // Calculate a unique curvature based on the edge ID to prevent overlapping
  const edgeIdNumber = parseInt(id.replace(/\D/g, ""), 10);
  const baseCurvature = 0.35;
  const uniqueCurvature = isNaN(edgeIdNumber)
    ? baseCurvature
    : baseCurvature + (edgeIdNumber % 10) * 0.03;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: uniqueCurvature,
  });

  // Calculate curve center for animating dashed lines
  const pathCenter = edgePath.split(" ").find((p) => p.includes("C"));

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

  const toggleDetails = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDetails(!showDetails);
    },
    [showDetails]
  );

  // Format the label based on the data
  const formatLabel = () => {
    if (!data) return "";

    const {
      activityId,
      duration,
      earlyStart,
      earlyFinish,
      lateStart,
      lateFinish,
      isCritical,
      float,
    } = data;
    if (activityId && duration !== undefined) {
      return (
        <div className="flex flex-col items-center min-w-[80px]">
          <div className="font-semibold flex items-center gap-1.5">
            <span>{activityId}</span>
            {showDetails && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                {isCritical ? "Critical" : `Float: ${float || 0}`}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 text-xs mt-0.5">
            <span className="font-medium">d={duration}</span>
            {showDetails ? (
              <>
                <span>ES={earlyStart}</span>
                <span>EF={earlyFinish}</span>
              </>
            ) : (
              <span>ES={earlyStart}</span>
            )}
          </div>
          {showDetails &&
            lateStart !== undefined &&
            lateFinish !== undefined && (
              <div className="flex gap-1.5 text-xs mt-0.5">
                <span>LS={lateStart}</span>
                <span>LF={lateFinish}</span>
              </div>
            )}
        </div>
      );
    }
    return data.label || "";
  };

  // Determine if this is a critical path edge
  const isCritical = data?.isCritical || false;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isCritical ? 3 : 2,
          stroke: isCritical ? "#ef4444" : "#94a3b8",
          ...(!showDetails
            ? {}
            : {
                strokeDasharray: "5,5",
                animation: "flowAnimation 30s linear infinite",
              }),
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div
            className={cn(
              "px-3 py-1.5 rounded-md shadow-md border text-sm select-none",
              "transition-all duration-200 relative",
              isCritical
                ? "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700"
                : "bg-white dark:bg-background border-gray-200 dark:border-gray-700",
              "hover:shadow-lg"
            )}
            onClick={onEdgeClick}
          >
            {formatLabel()}

            <div className="absolute -top-1 -right-1 flex items-center space-x-1">
              <button
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={toggleDetails}
              >
                <InfoIcon size={12} />
              </button>
              <button
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdgeClick();
                }}
              >
                <PencilIcon size={12} />
              </button>
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
