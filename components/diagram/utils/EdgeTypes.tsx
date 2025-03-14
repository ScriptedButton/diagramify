import { CustomEdge } from "@/components/diagram/CustomEdge";
import { EdgeProps } from "@xyflow/react";

export const EDGE_TYPES = {
  default: (props: EdgeProps) => <CustomEdge {...props} />,
  custom: (props: EdgeProps) => <CustomEdge {...props} />,
  straight: (props: EdgeProps) => (
    <CustomEdge {...props} data={{ ...props.data, edgeType: "straight" }} />
  ),
  step: (props: EdgeProps) => (
    <CustomEdge {...props} data={{ ...props.data, edgeType: "step" }} />
  ),
};
