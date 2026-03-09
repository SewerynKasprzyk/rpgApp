import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { SceneItemSource } from "@rpg/shared";

interface Props {
  id: string;
  sourceType: SceneItemSource;
  sourceId: string;
  label: string;
  payload: Record<string, unknown>;
  children: React.ReactNode;
}

export default function DraggableSourceItem({
  id,
  sourceType,
  sourceId,
  label,
  payload,
  children,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { sourceType, sourceId, label, payload },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1, cursor: "grab" }}
    >
      {children}
    </div>
  );
}
