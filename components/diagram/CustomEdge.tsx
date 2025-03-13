"use client";

import { useCallback, useState } from "react";
import {
  EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Minus, Eye, EyeOff, Settings, PanelLeftIcon } from "lucide-react";

interface EdgeData {
  activityId?: string;
  duration?: number;
  earlyStart?: number;
  earlyFinish?: number;
  label?: string;
  isCritical?: boolean;
  hasCoDependency?: boolean;
  advancedMode?: boolean;
  isDashed?: boolean;
  hideLabel?: boolean;
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
  const [localData, setLocalData] = useState<EdgeData>({
    isDashed: Boolean(data?.isDashed),
    hideLabel: Boolean(data?.hideLabel),
    ...data,
  });

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

  const handleToggleDashed = useCallback(() => {
    const newData = { ...localData, isDashed: !localData.isDashed };
    setLocalData(newData);
    window.updateDiagramEdge?.(id, newData);
  }, [id, localData]);

  const handleToggleLabel = useCallback(() => {
    const newData = { ...localData, hideLabel: !localData.hideLabel };
    setLocalData(newData);
    window.updateDiagramEdge?.(id, newData);
  }, [id, localData]);

  const handleEditProperties = useCallback(() => {
    if (window.openDiagramEditor) {
      window.openDiagramEditor(id);
    }
  }, [id]);

  // Format the label based on the data
  const formatLabel = () => {
    if (!localData || localData.hideLabel) return null;

    const {
      activityId,
      duration,
      isCritical,
      hasCoDependency,
      advancedMode,
      earlyStart,
    } = localData;

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
    if (!localData || localData.hideLabel) return false;
    return typeof localData.activityId === "string";
  };

  const label = formatLabel();

  const edgeElement = (
    <g className="react-flow__edge-wrapper">
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke:
            style?.stroke ||
            (localData?.hasCoDependency ? "#6366f1" : "#94a3b8"),
          strokeWidth: style?.strokeWidth || 2,
          strokeDasharray: localData?.isDashed
            ? "5,5"
            : style?.strokeDasharray || "none",
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
    </g>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{edgeElement}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleToggleDashed}>
          <Minus className="mr-2 h-4 w-4" />
          {localData?.isDashed ? "Make Solid" : "Make Dashed"}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleToggleLabel}>
          {!localData?.hideLabel ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide Label
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Show Label
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleEditProperties}>
          <PanelLeftIcon className="mr-2 h-4 w-4" />
          Edit Properties
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
