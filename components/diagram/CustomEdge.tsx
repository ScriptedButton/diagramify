"use client";

import { useCallback, useState, useEffect } from "react";
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
import { Minus, Eye, EyeOff, PanelLeftIcon } from "lucide-react";

interface EdgeData {
  activityId?: string;
  duration?: number;
  earlyStart?: number;
  earlyFinish?: number;
  label?: string;
  isCritical?: boolean;
  hasCoDependency?: boolean;
  codependencyGroup?: string; // Added for grouping related codependencies
  advancedMode?: boolean;
  isDashed?: boolean;
  hideLabel?: boolean;
  isDummy?: boolean;
  lateStart?: number;
  lateFinish?: number;
  slack?: number;
  sourceNodeId?: string; // Track source node for codependency calculation
  targetNodeId?: string; // Track target node for codependency calculation
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source, // Added to track source node id
  target, // Added to track target node id
  data,
  markerEnd,
}: EdgeProps) {
  const [localData, setLocalData] = useState<EdgeData>({
    isDashed: Boolean(data?.isDashed),
    hideLabel: Boolean(data?.hideLabel),
    sourceNodeId: source, // Store source node ID
    targetNodeId: target, // Store target node ID
    ...data,
  });

  // Enhanced useEffect to better handle data updates
  useEffect(() => {
    console.log(`CustomEdge useEffect triggered for edge ${id}`);

    // Ensure we're capturing all the important properties
    const newLocalData: EdgeData = {
      isDashed: Boolean(data?.isDashed),
      hideLabel: Boolean(data?.hideLabel),
      activityId: data?.activityId as string | undefined,
      duration: data?.duration as number | undefined,
      earlyStart: data?.earlyStart as number | undefined,
      earlyFinish: data?.earlyFinish as number | undefined,
      lateStart: data?.lateStart as number | undefined,
      lateFinish: data?.lateFinish as number | undefined,
      slack: data?.slack as number | undefined,
      isCritical: Boolean(data?.isCritical),
      hasCoDependency: Boolean(data?.hasCoDependency),
      codependencyGroup: data?.codependencyGroup as string | undefined,
      label: data?.label as string | undefined,
      advancedMode: Boolean(data?.advancedMode),
      isDummy: Boolean(data?.isDummy),
      sourceNodeId: source,
      targetNodeId: target,
    };

    // More detailed debug logging
    console.log(`Edge ${id} new data:`, {
      activityId: data?.activityId,
      duration: data?.duration,
      earlyStart: data?.earlyStart,
      earlyFinish: data?.earlyFinish,
      lateStart: data?.lateStart,
      lateFinish: data?.lateFinish,
      slack: data?.slack,
      isCritical: data?.isCritical,
      hasCoDependency: data?.hasCoDependency,
      codependencyGroup: data?.codependencyGroup,
      hideLabel: data?.hideLabel,
      source,
      target,
    });

    setLocalData(newLocalData);
  }, [id, data, source, target]);

  // Calculate a unique curvature based on the edge ID and codependency status
  const edgeIdNumber = parseInt(id.replace(/\D/g, ""), 10);
  let baseCurvature = 0.35;

  // Adjust curvature for codependency edges to visually distinguish them
  if (localData?.hasCoDependency && localData?.codependencyGroup) {
    // Codependency edges that share the same target should have related curvatures
    // Extract a number from the codependency group for consistent curvature
    const groupNumber = parseInt(
      localData.codependencyGroup.replace(/\D/g, ""),
      10
    );
    baseCurvature = 0.4 + (isNaN(groupNumber) ? 0 : (groupNumber % 5) * 0.05);
  }

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
  const formatEdgeLabel = (data: EdgeData) => {
    // Return early if there's no data or hideLabel is true
    if (!data || data.hideLabel) return "";

    console.log(`Advanced mode: ${data.advancedMode}`);

    if (!data.advancedMode) {
      return `${data.activityId} (${data.duration})`;
    }

    // For debug, log what we're trying to format
    console.log(`Formatting edge label with data:`, data);

    let result = "";

    // First line format: ActivityID (Duration,EarlyFinish)
    if (
      data.activityId &&
      data.duration !== undefined &&
      data.earlyFinish !== undefined
    ) {
      result = `${data.activityId} (${data.earlyStart},${data.earlyFinish})`;
    }
    // If we have activityId but missing some values
    else if (data.activityId) {
      if (data.duration !== undefined) {
        result = `${data.activityId} (${data.duration})`;
      } else {
        result = data.activityId;
      }
    }
    // If no activity ID but there's a label, use that
    else if (data.label) {
      result = data.label;
    }
    // Generic activity label
    else if (data.duration !== undefined) {
      result = `Activity (${data.duration})`;
    }

    // Second line: Duration + late start and late finish if available
    if (
      data.duration !== undefined &&
      data.lateStart !== undefined &&
      data.lateFinish !== undefined
    ) {
      result += `\n${data.duration} (${data.lateStart},${data.lateFinish})`;

      // Add slack information if available
      // if (data.slack !== undefined) {
      //   result += ` S:${data.slack}`;
      // }
    }

    return result;
  };

  // Check if we should render the label
  const shouldRenderLabel = () => {
    // Log what we're checking to help debug
    console.log(`shouldRenderLabel check for edge ${id}:`, {
      hasLocalData: !!localData,
      hideLabel: localData?.hideLabel,
      activityId: localData?.activityId,
      hasEarlyStart: localData?.earlyStart !== undefined,
      hasEarlyFinish: localData?.earlyFinish !== undefined,
      hasLateStart: localData?.lateStart !== undefined,
      hasLateFinish: localData?.lateFinish !== undefined,
      hasDuration: localData?.duration !== undefined,
      label: localData?.label,
    });

    // Don't show if explicitly hidden
    if (!localData || localData.hideLabel) return false;

    // Always show if there's any timing information
    const hasTiming =
      localData.earlyStart !== undefined ||
      localData.earlyFinish !== undefined ||
      localData.lateStart !== undefined ||
      localData.lateFinish !== undefined;

    // Show if it has any identifying or timing information
    return (
      typeof localData.activityId === "string" ||
      hasTiming ||
      localData.duration !== undefined ||
      typeof localData.label === "string"
    );
  };

  const label = formatEdgeLabel(localData || {});

  // Update the edge style based on properties with enhanced codependency handling
  const getEdgeStyle = (data: EdgeData): React.CSSProperties => {
    const style: React.CSSProperties = {
      stroke: "#94a3b8", // Default color
      strokeWidth: 2,
    };

    // Highlight dummy activities
    if (data?.isDummy) {
      style.strokeDasharray = "5,5";
      style.stroke = "#94a3b8"; // Default color but dashed
    }

    // Show co-dependencies with a distinct style
    if (data?.hasCoDependency) {
      style.stroke = "#6366f1"; // Indigo color for co-dependencies
      style.strokeWidth = 2.5; // Slightly thicker
    }

    // Highlight critical path edges - this takes precedence
    if (data?.isCritical) {
      style.stroke = "#ef4444"; // Red color for critical path
      style.strokeWidth = 3;
    }

    // Apply dashed style if explicitly set
    if (data?.isDashed) {
      style.strokeDasharray = "5,5";
    }

    return style;
  };

  const edgeElement = (
    <g className="react-flow__edge-wrapper">
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={getEdgeStyle(localData)}
      />
      {shouldRenderLabel() && label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              whiteSpace: "pre-line",
              textAlign: "center",
            }}
            className={cn(
              "bg-white dark:bg-gray-900",
              "rounded-sm",
              "px-2 py-1",
              "text-xs",
              "leading-tight",
              localData?.isCritical
                ? "font-medium text-red-600 border border-red-400"
                : localData?.hasCoDependency
                  ? "font-medium text-indigo-600 border border-indigo-400"
                  : "border border-gray-200"
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
      <ContextMenuContent className="w-64">
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
