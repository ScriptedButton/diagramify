import { CustomNode, CustomEdge } from "../types";

/**
 * Calculates the early start, early finish, late start, late finish, and critical path
 * for a project network diagram.
 * @param nodes The nodes in the diagram
 * @param edges The edges in the diagram
 * @param diagramType The type of diagram: "AOA" (Activity-on-Arrow) or "AON" (Activity-on-Node)
 */
export function calculateCriticalPath(
  nodes: CustomNode[],
  edges: CustomEdge[],
  diagramType: "AOA" | "AON" = "AOA"
): { nodes: CustomNode[]; edges: CustomEdge[] } {
  // Step 1: Identify start and end nodes
  const startNodes = nodes.filter(
    (node) =>
      node.data?.isStartNode ||
      node.data?.isStartEvent ||
      (node.data?.label === "Start" &&
        node.data?.style?.backgroundColor === "#4caf50")
  );

  const endNodes = nodes.filter(
    (node) =>
      node.data?.isEndNode ||
      node.data?.isEndEvent ||
      (node.data?.label === "End" &&
        node.data?.style?.backgroundColor === "#f44336")
  );

  if (startNodes.length === 0 || endNodes.length === 0) {
    console.warn("Cannot calculate critical path without start and end nodes");
    return { nodes, edges };
  }

  // Create a map of node IDs to their outgoing and incoming edges
  const outgoingEdges: Record<string, CustomEdge[]> = {};
  const incomingEdges: Record<string, CustomEdge[]> = {};

  nodes.forEach((node) => {
    outgoingEdges[node.id] = [];
    incomingEdges[node.id] = [];
  });

  edges.forEach((edge) => {
    if (outgoingEdges[edge.source]) {
      outgoingEdges[edge.source].push(edge);
    }
    if (incomingEdges[edge.target]) {
      incomingEdges[edge.target].push(edge);
    }
  });

  // Create node maps for easier access
  const nodeMap: Record<string, CustomNode> = {};
  nodes.forEach((node) => {
    nodeMap[node.id] = { ...node };

    // Initialize node values with more explicit naming and reset critical state
    nodeMap[node.id].data = {
      ...nodeMap[node.id].data,
      isCritical: false, // Reset critical state for clean calculation
      earliest: 0, // ES for incoming edges, EF for outgoing edges
      latest: Infinity, // Initialize latest time to Infinity for proper min calculation
      earlyStart: 0, // Explicit ES
      earlyFinish: 0, // Explicit EF
      lateStart: 0, // Explicit LS
      lateFinish: 0, // Explicit LF
      processed: false, // Track if the node has been processed in forward pass
      backwardProcessed: false, // Track if the node has been processed in backward pass
    };
  });

  // NEW: Create a map to group co-dependent activities by their activity ID
  const activityGroups: Record<string, CustomEdge[]> = {};

  // Initialize all edges with ES = 0 and EF = duration
  const updatedEdges: CustomEdge[] = edges.map((edge) => {
    const duration = (edge.data?.duration as number) || 0;
    const activityId = edge.data?.activityId as string | undefined;

    // Group edges by activity ID to track co-dependencies
    if (activityId) {
      if (!activityGroups[activityId]) {
        activityGroups[activityId] = [];
      }
      activityGroups[activityId].push(edge);
    }

    return {
      ...edge,
      data: {
        ...edge.data,
        isCritical: false, // Reset critical state on edge
        slack: undefined, // Reset slack values
        earlyStart: 0,
        earlyFinish: duration,
        hasCoDependency: activityId
          ? activityGroups[activityId].length > 1
          : false,
        codependencyGroup: activityId, // Track which group this edge belongs to
      },
    };
  });

  // Mark co-dependencies now that we know the full group sizes
  updatedEdges.forEach((edge) => {
    const activityId = edge.data?.activityId as string | undefined;
    if (activityId && activityGroups[activityId]?.length > 1) {
      const index = updatedEdges.findIndex((e) => e.id === edge.id);
      if (index >= 0) {
        updatedEdges[index].data = {
          ...updatedEdges[index].data,
          hasCoDependency: true,
          codependencyGroup: activityId,
        };
      }
    }
  });

  // Enhanced Forward Pass Algorithm for handling codependencies
  // First, initialize all start nodes
  startNodes.forEach((node) => {
    nodeMap[node.id].data = {
      ...nodeMap[node.id].data,
      earliest: 0,
      earlyStart: 0,
      earlyFinish:
        diagramType === "AON"
          ? (nodeMap[node.id].data?.duration as number) || 0
          : 0,
      processed: true,
    };
  });

  // Process nodes in topological order using a queue-based approach
  const nodesToProcess = [...startNodes.map((node) => node.id)];
  let processedCount = startNodes.length;
  const totalNodes = nodes.length;

  // Continue until all nodes are processed or no more can be processed
  while (nodesToProcess.length > 0 && processedCount < totalNodes) {
    const currentNodeId = nodesToProcess.shift()!;

    // Process all outgoing edges and their target nodes
    for (const edge of outgoingEdges[currentNodeId]) {
      const targetNodeId = edge.target;
      const targetNode = nodeMap[targetNodeId];

      // Skip already processed nodes
      if (targetNode.data?.processed) continue;

      // Check if all incoming edges to this target have been processed
      const allPredecessorsProcessed = incomingEdges[targetNodeId].every(
        (inEdge) => nodeMap[inEdge.source].data?.processed
      );

      if (allPredecessorsProcessed) {
        // Calculate the early start as the maximum of all predecessors' early finish
        let maxEarlyFinish = 0;

        for (const inEdge of incomingEdges[targetNodeId]) {
          const sourceNode = nodeMap[inEdge.source];
          const sourceNodeEF =
            diagramType === "AOA"
              ? (sourceNode.data?.earliest as number)
              : (sourceNode.data?.earlyFinish as number);

          const edgeIdx = updatedEdges.findIndex((e) => e.id === inEdge.id);
          const edgeDuration =
            (updatedEdges[edgeIdx].data?.duration as number) || 0;

          // Calculate EF for this incoming edge
          const incomingEF =
            diagramType === "AOA" ? sourceNodeEF + edgeDuration : sourceNodeEF;

          updatedEdges[edgeIdx].data = {
            ...updatedEdges[edgeIdx].data,
            earlyStart:
              diagramType === "AOA"
                ? sourceNodeEF
                : (sourceNode.data?.earlyFinish as number),
            earlyFinish: incomingEF,
          };

          maxEarlyFinish = Math.max(maxEarlyFinish, incomingEF);
        }

        // Update the target node's early times
        const nodeDuration = (targetNode.data?.duration as number) || 0;

        if (diagramType === "AOA") {
          targetNode.data = {
            ...targetNode.data,
            earliest: maxEarlyFinish,
            earlyStart: maxEarlyFinish,
            earlyFinish: maxEarlyFinish,
            processed: true,
          };
        } else {
          // AON
          targetNode.data = {
            ...targetNode.data,
            earliest: maxEarlyFinish,
            earlyStart: maxEarlyFinish,
            earlyFinish: maxEarlyFinish + nodeDuration,
            processed: true,
          };
        }

        // Add to the queue for further processing
        nodesToProcess.push(targetNodeId);
        processedCount++;

        // Optional debug info
        console.log(
          `Forward pass - Node ${targetNodeId}: ES=${targetNode.data.earlyStart}, EF=${targetNode.data.earlyFinish}`
        );
      }
    }
  }

  // NEW: Synchronize co-dependency timing values after forward pass
  // This ensures activities with the same ID have consistent ES/EF values
  // based on the MAX rule for co-dependent activities
  Object.entries(activityGroups).forEach(([activityId, groupEdges]) => {
    if (groupEdges.length > 1) {
      // Find the maximum ES and EF values within this activity group
      let maxES = 0;
      let maxEF = 0;

      groupEdges.forEach((edge) => {
        const edgeIndex = updatedEdges.findIndex((e) => e.id === edge.id);
        if (edgeIndex >= 0) {
          const es = (updatedEdges[edgeIndex].data?.earlyStart as number) || 0;
          const ef = (updatedEdges[edgeIndex].data?.earlyFinish as number) || 0;

          maxES = Math.max(maxES, es);
          maxEF = Math.max(maxEF, ef);
        }
      });

      // Apply the maximum values to all edges in the group
      groupEdges.forEach((edge) => {
        const edgeIndex = updatedEdges.findIndex((e) => e.id === edge.id);
        if (edgeIndex >= 0) {
          updatedEdges[edgeIndex].data = {
            ...updatedEdges[edgeIndex].data,
            earlyStart: maxES,
            earlyFinish: maxEF,
          };

          // Log for debugging
          console.log(
            `Co-dependency ${activityId} synchronized: ES=${maxES}, EF=${maxEF}`
          );
        }
      });
    }
  });

  // Step 3: Find the project duration (maximum EF among all end nodes)
  let projectDuration = 0;
  endNodes.forEach((endNode) => {
    const endNodeEF = (endNode.data?.earlyFinish as number) || 0;
    projectDuration = Math.max(projectDuration, endNodeEF);
  });

  // Step 4: Backward pass - Calculate Late Start (LS) and Late Finish (LF)
  // Initialize all end nodes with latest = project duration
  endNodes.forEach((node) => {
    nodeMap[node.id].data = {
      ...nodeMap[node.id].data,
      latest: projectDuration,
      lateStart:
        diagramType === "AON"
          ? projectDuration - ((node.data?.duration as number) || 0)
          : projectDuration,
      lateFinish: projectDuration,
      backwardProcessed: true,
    };
  });

  // Enhanced Backward Pass Algorithm
  const nodesToProcessBackward = [...endNodes.map((node) => node.id)];
  let backwardProcessedCount = endNodes.length;

  // Continue until all nodes are processed or no more can be processed
  while (
    nodesToProcessBackward.length > 0 &&
    backwardProcessedCount < totalNodes
  ) {
    const currentNodeId = nodesToProcessBackward.shift()!;

    // Process all incoming edges and their source nodes
    for (const edge of incomingEdges[currentNodeId]) {
      const sourceNodeId = edge.source;
      const sourceNode = nodeMap[sourceNodeId];

      // Skip already backward-processed nodes
      if (sourceNode.data?.backwardProcessed) continue;

      // Check if all outgoing edges from this source have been backward-processed
      const allSuccessorsProcessed = outgoingEdges[sourceNodeId].every(
        (outEdge) => nodeMap[outEdge.target].data?.backwardProcessed
      );

      if (allSuccessorsProcessed) {
        // Calculate the late finish as the minimum of all successors' late start
        let minLateStart = Infinity;

        for (const outEdge of outgoingEdges[sourceNodeId]) {
          const targetNode = nodeMap[outEdge.target];
          const targetNodeLS =
            diagramType === "AOA"
              ? (targetNode.data?.latest as number)
              : (targetNode.data?.lateStart as number);

          const edgeIdx = updatedEdges.findIndex((e) => e.id === outEdge.id);
          const edgeDuration =
            (updatedEdges[edgeIdx].data?.duration as number) || 0;

          // Calculate LS for this outgoing edge
          const outgoingLS =
            diagramType === "AOA" ? targetNodeLS - edgeDuration : targetNodeLS;

          updatedEdges[edgeIdx].data = {
            ...updatedEdges[edgeIdx].data,
            lateFinish:
              diagramType === "AOA"
                ? targetNodeLS
                : (targetNode.data?.lateStart as number),
            lateStart: outgoingLS,
          };

          minLateStart = Math.min(minLateStart, outgoingLS);
        }

        // Update the source node's late times
        const nodeDuration = (sourceNode.data?.duration as number) || 0;

        if (diagramType === "AOA") {
          sourceNode.data = {
            ...sourceNode.data,
            latest: minLateStart,
            lateStart: minLateStart,
            lateFinish: minLateStart,
            backwardProcessed: true,
          };
        } else {
          // AON
          sourceNode.data = {
            ...sourceNode.data,
            latest: minLateStart + nodeDuration,
            lateStart: minLateStart,
            lateFinish: minLateStart + nodeDuration,
            backwardProcessed: true,
          };
        }

        // Add to the queue for further processing
        nodesToProcessBackward.push(sourceNodeId);
        backwardProcessedCount++;

        // Optional debug info
        console.log(
          `Backward pass - Node ${sourceNodeId}: LS=${sourceNode.data.lateStart}, LF=${sourceNode.data.lateFinish}`
        );
      }
    }
  }

  // NEW: Synchronize co-dependency timing values after backward pass
  // This ensures activities with the same ID have consistent LS/LF values
  // based on the MIN rule for late times
  Object.entries(activityGroups).forEach(([activityId, groupEdges]) => {
    if (groupEdges.length > 1) {
      // Find the minimum LS and LF values within this activity group
      let minLS = Infinity;
      let minLF = Infinity;

      groupEdges.forEach((edge) => {
        const edgeIndex = updatedEdges.findIndex((e) => e.id === edge.id);
        if (edgeIndex >= 0) {
          const ls = (updatedEdges[edgeIndex].data?.lateStart as number) || 0;
          const lf = (updatedEdges[edgeIndex].data?.lateFinish as number) || 0;

          if (ls < minLS) minLS = ls;
          if (lf < minLF) minLF = lf;
        }
      });

      // Apply the minimum values to all edges in the group
      groupEdges.forEach((edge) => {
        const edgeIndex = updatedEdges.findIndex((e) => e.id === edge.id);
        if (edgeIndex >= 0) {
          updatedEdges[edgeIndex].data = {
            ...updatedEdges[edgeIndex].data,
            lateStart: minLS,
            lateFinish: minLF,
          };

          // Log for debugging
          console.log(
            `Co-dependency ${activityId} synchronized: LS=${minLS}, LF=${minLF}`
          );
        }
      });
    }
  });

  // Step 5: Calculate slack/float and identify critical path
  updatedEdges.forEach((edge) => {
    const es = (edge.data?.earlyStart as number) || 0;
    const ef = (edge.data?.earlyFinish as number) || 0;
    const ls = (edge.data?.lateStart as number) || 0;
    const lf = (edge.data?.lateFinish as number) || 0;
    const slack = ls - es;

    // Make sure to include complete timing information in edge data
    edge.data = {
      ...edge.data,
      earlyStart: es,
      earlyFinish: ef,
      lateStart: ls,
      lateFinish: lf,
      slack,
      isCritical: slack === 0,
    };

    // For debugging
    if (edge.data?.activityId) {
      console.log(
        `Edge ${edge.data.activityId} - ES:${es}, EF:${ef}, LS:${ls}, LF:${lf}, Slack:${slack}`
      );
    }
  });

  // Calculate slack for nodes and mark critical path nodes
  Object.values(nodeMap).forEach((node) => {
    const es = (node.data?.earlyStart as number) || 0;
    const ls = (node.data?.lateStart as number) || 0;
    const slack = ls - es;

    // First set slack and reset critical flag
    node.data = {
      ...node.data,
      slack,
      isCritical: slack === 0, // Node is critical if and ONLY if slack is zero
      // Remove temporary processing flags before returning
      processed: undefined,
      backwardProcessed: undefined,
    };
  });

  // Convert nodeMap back to array
  const updatedNodes = Object.values(nodeMap);

  return { nodes: updatedNodes, edges: updatedEdges };
}
