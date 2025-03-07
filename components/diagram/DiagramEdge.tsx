"use client";

import { motion } from "motion/react";
import { EdgeData, NodeData, Point } from "./types";

interface DiagramEdgeProps {
  edge: EdgeData;
  nodes: NodeData[];
}

export function DiagramEdge({ edge, nodes }: DiagramEdgeProps) {
  // Find source and target nodes
  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);

  // If either node is not found, don't render
  if (!sourceNode || !targetNode) {
    return null;
  }

  // Calculate start and end points (center of the nodes)
  const nodeWidth = 192; // Width of the node (w-48 = 12rem = 192px)
  const nodeHeight = 120; // Approximate height of the node card

  const start: Point = {
    x: sourceNode.x + nodeWidth / 2,
    y: sourceNode.y + nodeHeight / 2,
  };

  const end: Point = {
    x: targetNode.x + nodeWidth / 2,
    y: targetNode.y + nodeHeight / 2,
  };

  // Calculate control points for the curved line
  const controlPoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 - 50, // Curve upward
  };

  // Calculate the path
  const path = `M ${start.x},${start.y} Q ${controlPoint.x},${controlPoint.y} ${end.x},${end.y}`;

  // Calculate the mid point for the label
  const midPoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2 - 25,
  };

  return (
    <>
      {/* SVG container for the path and arrow */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          overflow: "visible",
          zIndex: 0,
        }}
      >
        {/* The edge line */}
        <motion.path
          d={path}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="text-gray-400 dark:text-gray-600"
        />

        {/* Arrow head */}
        <motion.polygon
          points="-5,-5 5,0 -5,5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          className="text-gray-400 dark:text-gray-600 fill-current"
          style={{
            transform: `translate(${end.x}px, ${end.y}px) rotate(${Math.atan2(
              end.y - start.y,
              end.x - start.x
            )}rad)`,
          }}
        />
      </svg>

      {/* Label */}
      {edge.label && (
        <motion.div
          className="absolute px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700"
          style={{
            x: midPoint.x - 12,
            y: midPoint.y - 12,
            originX: "50%",
            originY: "50%",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {edge.label}
        </motion.div>
      )}

      {/* Weight (if applicable) */}
      {edge.weight !== undefined && (
        <motion.div
          className="absolute px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full"
          style={{
            x: midPoint.x + 15,
            y: midPoint.y - 10,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {edge.weight}
        </motion.div>
      )}
    </>
  );
}
