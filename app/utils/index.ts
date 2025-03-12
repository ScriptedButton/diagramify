export const loadSavedDiagram = async () => {
  try {
    const savedData = localStorage.getItem("diagramify-save");
    if (savedData) {
      const { data } = JSON.parse(savedData);

      console.log("Parsed data", data);

      return {
        nodes: data.nodes,
        edges: data.edges,
      };
    }
  } catch (error) {
    console.error("Error loading saved diagram", error);
  }
  return { nodes: [], edges: [] };
};
