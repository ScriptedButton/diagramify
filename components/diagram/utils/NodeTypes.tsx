import { NodeTypes } from "@xyflow/react";
import { CircularNode } from "../nodes/CircularNode";
import { CustomNodeProps } from "../types";

// Define custom node types
export const NODE_TYPES: NodeTypes = {
  circularNode: (props: CustomNodeProps) => <CircularNode {...props} />,
};
