"use client";

import { useRef } from "react";
import Draggable from "react-draggable";

type DraggableTextProps = {
  note: {
    id: number;
    content: string;
    x: number;
    y: number;
  };
  onStop: (id: number, x: number, y: number) => void;
  onChange: (id: number, content: string) => void;
};

export default function DraggableText({ note, onStop, onChange }: DraggableTextProps) {
  const nodeRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      defaultPosition={{ x: note.x, y: note.y }}
      onStop={(_, data) => onStop(note.id, data.x, data.y)}
    >
      <textarea
        ref={nodeRef}
        value={note.content}
        onChange={(e) => onChange(note.id, e.target.value)}
        className="absolute p-0 m-0 resize-none w-32 h-24 outline-none bg-transparent text-black"
        placeholder="Enter text..."
        aria-label={`Text ${note.id}`}
      />
    </Draggable>
  );
}