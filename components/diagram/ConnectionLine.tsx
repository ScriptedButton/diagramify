// Connection line component for visualizing edge creation
import { ConnectionLineComponentProps } from "@xyflow/react";

export const ConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}: ConnectionLineComponentProps) => {
  // Calculate control points for a smoother curve
  const dx = toX - fromX;
  const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 150); // Cap the control point distance

  // Create a smoother curve with dynamic control points
  const d = `M ${fromX},${fromY} 
             C ${fromX + controlPointOffset},${fromY} 
               ${toX - controlPointOffset},${toY} 
               ${toX},${toY}`;

  const baseStrokeWidth =
    typeof connectionLineStyle?.strokeWidth === "number"
      ? connectionLineStyle.strokeWidth
      : 2;

  return (
    <svg
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {/* Shadow effect */}
      <path
        d={d}
        fill="none"
        stroke="rgba(0, 0, 0, 0.1)"
        strokeWidth={baseStrokeWidth + 2}
        style={{
          filter: "blur(2px)",
        }}
      />

      {/* Main connection line */}
      <path
        d={d}
        fill="none"
        stroke={connectionLineStyle?.stroke || "#6366f1"}
        strokeWidth={baseStrokeWidth}
        strokeDasharray="8,4"
        style={{
          strokeLinecap: "round",
          animation: "dash 1s linear infinite",
          zIndex: 10,
        }}
      />

      {/* Highlight effect */}
      <path
        d={d}
        fill="none"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth={1}
        style={{
          strokeLinecap: "round",
          filter: "blur(1px)",
        }}
      />

      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -12;
            }
          }
        `}
      </style>
    </svg>
  );
};
