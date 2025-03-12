import { useReactFlow } from "reactflow";

const loadSavedDiagram = () => {
  const { setNodes, setEdges } = useReactFlow();
  try {
    const savedData = localStorage.getItem("diagramify-save");
    if (savedData) {
      const parsed = JSON.parse(savedData);

      return {
        nodes: parsed.nodes,
        edges: parsed.edges,
      };
    }
  } catch (error) {
    console.error("Error loading saved diagram", error);
  }
  return { nodes: [], edges: [] };
};
