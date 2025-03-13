import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Eye, EyeOff, Minus } from "lucide-react";

interface EdgeContextMenuProps {
  children: React.ReactNode;
  onToggleDashed: () => void;
  onToggleLabel: () => void;
  isDashed: boolean;
  showLabel: boolean;
}

export function EdgeContextMenu({
  children,
  onToggleDashed,
  onToggleLabel,
  isDashed,
  showLabel,
}: EdgeContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="edge-context-trigger">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onToggleDashed}>
          <Minus className="mr-2 h-4 w-4" />
          {isDashed ? "Make Solid" : "Make Dashed"}
        </ContextMenuItem>
        <ContextMenuItem onClick={onToggleLabel}>
          {showLabel ? (
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
      </ContextMenuContent>
    </ContextMenu>
  );
}
