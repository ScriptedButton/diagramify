import { useCallback, useState } from "react";
import { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import { toPng, toJpeg, toSvg } from "html-to-image";

interface UseDiagramStateProps {
  diagramType: "AOA" | "AON";
  reactFlowInstance: ReactFlowInstance | null;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

export function useDiagramState({
  diagramType,
  reactFlowInstance,
  reactFlowWrapper,
  setNodes,
  setEdges,
}: UseDiagramStateProps) {
  const [undoable, setUndoable] = useState(false);
  const [redoable] = useState(false);

  // Function to get current diagram data for saving
  const getDiagramData = useCallback(() => {
    if (!reactFlowInstance) {
      return { nodes: [], edges: [] };
    }

    return {
      nodes: reactFlowInstance.getNodes(),
      edges: reactFlowInstance.getEdges(),
    };
  }, [reactFlowInstance]);

  // Save diagram function
  const saveDiagram = useCallback(() => {
    if (reactFlowInstance) {
      const flowData = {
        nodes: reactFlowInstance.getNodes(),
        edges: reactFlowInstance.getEdges(),
      };

      try {
        localStorage.setItem(
          "diagramify-save",
          JSON.stringify({
            diagramType,
            data: flowData,
            timestamp: new Date().toISOString(),
          })
        );
        alert("Diagram saved successfully!");
      } catch (error) {
        console.error("Error saving diagram:", error);
        alert("Failed to save diagram.");
      }
    }
  }, [reactFlowInstance, diagramType]);

  // Load diagram function
  const loadDiagram = useCallback(() => {
    try {
      const savedData = localStorage.getItem("diagramify-save");
      if (savedData) {
        const parsed = JSON.parse(savedData);

        if (parsed.diagramType === diagramType && parsed.data) {
          setNodes(parsed.data.nodes || []);
          setEdges(parsed.data.edges || []);
          alert("Diagram loaded successfully!");
        } else {
          alert(`No saved ${diagramType} diagram found.`);
        }
      } else {
        alert("No saved diagram found.");
      }
    } catch (error) {
      console.error("Error loading diagram:", error);
      alert("Failed to load diagram.");
    }
  }, [diagramType, setNodes, setEdges]);

  // Export diagram function
  const exportDiagram = useCallback(() => {
    if (!reactFlowWrapper.current || !reactFlowInstance) {
      alert("Unable to export. No diagram available.");
      return;
    }

    const format = window.prompt(
      "Export format (png, jpeg, svg, json):",
      "png"
    );
    if (!format) return;

    try {
      switch (format.toLowerCase()) {
        case "json":
          const flowData = reactFlowInstance.toObject();
          const jsonData = JSON.stringify(
            {
              diagramType,
              timestamp: new Date().toISOString(),
              data: flowData,
            },
            null,
            2
          );
          const jsonBlob = new Blob([jsonData], { type: "application/json" });
          const jsonUrl = URL.createObjectURL(jsonBlob);
          downloadFile(
            jsonUrl,
            `diagram-${new Date().toISOString().slice(0, 10)}.json`
          );
          URL.revokeObjectURL(jsonUrl);
          break;

        case "png":
          toPng(reactFlowWrapper.current, { backgroundColor: "#ffffff" }).then(
            (dataUrl) =>
              downloadFile(
                dataUrl,
                `diagram-${new Date().toISOString().slice(0, 10)}.png`
              )
          );
          break;

        case "jpeg":
          toJpeg(reactFlowWrapper.current, {
            backgroundColor: "#ffffff",
            quality: 0.95,
          }).then((dataUrl) =>
            downloadFile(
              dataUrl,
              `diagram-${new Date().toISOString().slice(0, 10)}.jpeg`
            )
          );
          break;

        case "svg":
          toSvg(reactFlowWrapper.current, { backgroundColor: "#ffffff" }).then(
            (dataUrl) =>
              downloadFile(
                dataUrl,
                `diagram-${new Date().toISOString().slice(0, 10)}.svg`
              )
          );
          break;

        default:
          alert(
            "Unsupported export format. Please choose png, jpeg, svg, or json."
          );
      }
    } catch (error) {
      console.error("Error exporting diagram:", error);
      alert("Failed to export diagram. Please try again.");
    }
  }, [reactFlowWrapper, reactFlowInstance, diagramType]);

  // Helper function for downloading files
  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create new diagram handler
  const handleNewDiagram = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to start a new diagram? Any unsaved changes will be lost."
      )
    ) {
      localStorage.removeItem("diagramify-save");
      window.location.reload();
    }
  }, []);

  // Handle undo/redo
  const handleUndo = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      if (undoable && reactFlowInstance) {
        if (nodes.length > 0) {
          setNodes(nodes.slice(0, -1));
        } else if (edges.length > 0) {
          setEdges(edges.slice(0, -1));
        }
      }
    },
    [undoable, reactFlowInstance, setNodes, setEdges]
  );

  const handleRedo = useCallback(() => {
    console.log("Redo functionality would be implemented here");
  }, []);

  return {
    undoable,
    setUndoable,
    redoable,
    getDiagramData,
    saveDiagram,
    loadDiagram,
    exportDiagram,
    handleNewDiagram,
    handleUndo,
    handleRedo,
  };
}
