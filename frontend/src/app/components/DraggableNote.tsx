import { useRef } from "react";
import Draggable from "react-draggable";

type DraggableNoteProps = {
  note: {
    id: number;
    type: "text" | "sticky";
    content: string;
    x: number;
    y: number;
    color: "yellow" | "pink" | "green" | "blue" | "purple";
  };
  onStop: (id: number, x: number, y: number) => void;
  onChange: (id: number, content: string) => void;
};

export default function DraggableNote({ note, onStop, onChange }: DraggableNoteProps) {
  const nodeRef = useRef<HTMLTextAreaElement>(null); // ✅ Define nodeRef

  const colorMap: Record<DraggableNoteProps["note"]["color"], string> = {
    yellow: "bg-yellow-200",
    pink: "bg-pink-200",
    green: "bg-green-200",
    blue: "bg-blue-200",
    purple: "bg-purple-200",
  };

  const noteColorClass = note.type === "sticky" ? colorMap[note.color] : "bg-white";
  console.log("Rendering note with color:", note.color);

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>} // ✅ Cast here
      defaultPosition={{ x: note.x, y: note.y }}
      onStop={(_, data) => onStop(note.id, data.x, data.y)}
    >
      <textarea
        ref={nodeRef}
        value={note.content}
        onChange={(e) => onChange(note.id, e.target.value)}
        className={`absolute ${noteColorClass} p-2 rounded shadow resize w-32 h-24 text-black`}
        placeholder="Enter note..."
        aria-label={`Note ${note.id}`}
      />
    </Draggable>
  );
}