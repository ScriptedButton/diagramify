"use client";

import { useCallback, useState } from "react";
import {
  EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
} from "reactflow";
import { cn } from "@/lib/utils";
import { PencilIcon, InfoIcon, LinkIcon } from "lucide-react";

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
      hasCoDependency,
      dependsOn,
    } = data;
    if (activityId && duration !== undefined) {
      return (
        <div className="flex flex-col items-center min-w-[80px]">
          <div className="font-semibold flex items-center gap-1.5">
            <span>{activityId}</span>
            {hasCoDependency && !showDetails && (
              <LinkIcon
                size={14}
                className="text-indigo-500 animate-pulse"
                aria-label="Has co-dependencies"
              />
            )}
            {showDetails && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  isCritical
                    ? "bg-red-100 dark:bg-red-800/30"
                    : hasCoDependency
                    ? "bg-indigo-100 dark:bg-indigo-800/30"
                    : "bg-gray-100 dark:bg-gray-800"
                )}
              >
                {isCritical
                  ? "Critical"
                  : hasCoDependency
                  ? "Co-Dependency"
                  : `Float: ${float || 0}`}
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

          {showDetails && dependsOn && dependsOn.length > 0 && (
            <div className="text-xs mt-1 p-1 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-800">
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                Depends on:{" "}
              </span>
              <span>{dependsOn.join(", ")}</span>
            </div>
          )}

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
  const hasCoDependency = data?.hasCoDependency || false;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {data && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "bg-white dark:bg-gray-900",
              "shadow-md",
              "border border-gray-200 dark:border-gray-800",
              "rounded-md",
              "p-1",
              "flex items-center gap-2",
              isCritical
                ? "border-red-300 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/50"
                : hasCoDependency
                ? "border-indigo-300 dark:border-indigo-800/50 bg-indigo-50/80 dark:bg-indigo-950/50"
                : ""
            )}
            onClick={onEdgeClick}
          >
            {formatLabel()}

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onEdgeClick}
              >
                <PencilIcon size={14} />
              </button>
              <button
                type="button"
                className={cn(
                  "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300",
                  "p-1 rounded-full",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  showDetails && "bg-gray-100 dark:bg-gray-800"
                )}
                onClick={toggleDetails}
              >
                <InfoIcon size={14} />
              </button>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
