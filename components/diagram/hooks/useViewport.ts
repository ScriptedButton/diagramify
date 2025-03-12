import { useCallback, useState } from "react";
import { ReactFlowInstance } from "@xyflow/react";

interface UseViewportProps {
  reactFlowInstance: ReactFlowInstance | null;
}

export function useViewport({ reactFlowInstance }: UseViewportProps) {
  const [currentZoom, setCurrentZoom] = useState(1);

  // Handle zoom changes
  const handleZoom = useCallback(
    (zoomLevel: number) => {
      if (reactFlowInstance) {
        const { x, y } = reactFlowInstance.getViewport();
        reactFlowInstance.setViewport({ x, y, zoom: zoomLevel });
        setCurrentZoom(zoomLevel);
      }
    },
    [reactFlowInstance]
  );

  // Fit view to show all nodes
  const fitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
      setCurrentZoom(reactFlowInstance.getZoom());
    }
  }, [reactFlowInstance]);

  // Handle viewport changes (e.g., after panning)
  const handleViewportChange = useCallback(() => {
    if (reactFlowInstance) {
      const { zoom } = reactFlowInstance.getViewport();
      setCurrentZoom(zoom);
    }
  }, [reactFlowInstance]);

  return {
    currentZoom,
    setCurrentZoom,
    handleZoom,
    fitView,
    handleViewportChange,
  };
}
