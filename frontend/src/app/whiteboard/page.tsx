"use client";

import DraggableNote from "../components/DraggableNote";
import DraggableText from "../components/DraggableText";
import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { useRouter } from "next/navigation";

const colorStyles: Record<"yellow" | "pink" | "green" | "blue" | "purple", string> = {
  yellow: "bg-yellow-300",
  pink: "bg-pink-300",
  green: "bg-green-300",
  blue: "bg-blue-300",
  purple: "bg-purple-300",
};
const ColorPalette = ({ onSelect }: { onSelect: (color: "yellow" | "pink" | "green" | "blue" | "purple") => void }) => {
  return (
    <div className="flex flex-col space-y-2 mt-2">
      {(["yellow", "pink", "green", "blue", "purple"] as const).map((color) => (
        <button
          key={color}
          type="button"
          className={`w-6 h-6 rounded-full border-2 border-gray-400 cursor-pointer ${colorStyles[color]}`}
          onClick={() => onSelect(color)}
          aria-label={`Select ${color} sticky note`}
        />
      ))}
    </div>
  );
};

export default function WhiteboardPage() {
  const [activeTool, setActiveTool] = useState<"text" | "sticky" | "delete" | null>(null);
  const selectedColorRef = useRef<"yellow" | "pink" | "green" | "blue" | "purple" | null>(null);
  const [notes, setNotes] = useState<
    {
      id: number;
      type: "text" | "sticky";
      content: string;
      x: number;
      y: number;
      color: "yellow" | "pink" | "green" | "blue" | "purple";
      quadrant: number;
    }[]
  >([]);
  const [industry, setIndustry] = useState("");
  const [trends, setTrends] = useState<string[]>([]);

  const quadrantRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("thinkflowUserData");
      if (stored) {
        const parsed = JSON.parse(stored);
        setIndustry(parsed.industry || "");
        const raw = parsed.trends || "";
        setTrends(raw.split("#").filter(Boolean).map((tag: string) => "#" + tag.trim()));
      }
    }
  }, []);

  const router = useRouter();

  const handleGenerateIdeas = async () => {
    const grouped = {
      industry: industry,
      pain_points: [] as string[],
      ideas: [] as string[],
      goals: [] as string[],
      constraints: [] as string[],
    };

    notes.forEach((note) => {
      const { quadrant, content } = note;
      const trimmed = content.trim();
      if (!trimmed) return;

      if (quadrant === 0) grouped.pain_points.push(trimmed);
      else if (quadrant === 1) grouped.ideas.push(trimmed);
      else if (quadrant === 2) grouped.goals.push(trimmed);
      else if (quadrant === 3) grouped.constraints.push(trimmed);
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-ideas", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(grouped),
      });

      const result = await response.json();
      if (!result?.ideas || typeof result.ideas !== "string" || result.ideas.trim().length === 0) {
        alert("Received empty idea list. Please try again.");
        return;
      }
      console.log("Generated ideas:", result);
      console.log("Grouped notes sent to API:", JSON.stringify(grouped, null, 2));

      if (typeof window !== "undefined") {
        const rawIdeas: string = result.ideas || "";
        const parsedIdeas = rawIdeas
          .split(/Idea \d+:/)
          .map((ideaChunk: string) => ideaChunk.trim())
          .filter((idea: string) => idea.length > 0)
          .map((idea: string, index: number) => `Idea ${index + 1}: ${idea}`);
        localStorage.setItem("thinkflowGeneratedIdeas", JSON.stringify(parsedIdeas));
        // Enhanced localStorage logic
        const previousData = localStorage.getItem("thinkflowUserData");
        let parsed = {};
        if (previousData) {
          try {
            parsed = JSON.parse(previousData);
          } catch (err) {
            console.error("⚠️ Failed to parse existing user data from localStorage:", err);
          }
        }

        const updatedData = {
          ...parsed,
          ideas: parsedIdeas,
          industry: industry,
          team_size: 3, // Replace this with actual dynamic value if available
          team_members: [
            { name: "Alice", skills: ["frontend development", "UI/UX design"] },
            { name: "Bob", skills: ["backend development", "database management"] },
            { name: "Charlie", skills: ["machine learning", "data preprocessing"] }
          ]
        };

        localStorage.setItem("thinkflowUserData", JSON.stringify(updatedData));
        router.push("/select-idea");
      }

    } catch (error) {
      console.error("Failed to generate ideas:", error);
      alert("Error generating ideas. See console.");
    }
  };

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool) return;

    for (let i = 0; i < quadrantRefs.length; i++) {
      const ref = quadrantRefs[i].current;
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = Date.now();
          if (activeTool === "text") {
            setNotes((prev) => [
              ...prev,
              { id, type: "text", content: "", x, y, color: "yellow", quadrant: i },
            ]);
          } else if (activeTool === "sticky" && selectedColorRef.current !== null) {
            const color = selectedColorRef.current;
            setNotes((prev) => [
              ...prev,
              { id, type: "sticky", content: "", x, y, color, quadrant: i },
            ]);
          }
          setActiveTool(null);
          selectedColorRef.current = null;
          break;
        }
      }
    }
  };

  const placeStickyNote = (color: "yellow" | "pink" | "green" | "blue" | "purple") => {
    selectedColorRef.current = color;
    setActiveTool("sticky");
  };

  const updateNote = (id: number, content: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, content } : note))
    );
  };

  return (
    <>
      <div className="absolute top-2 left-2 z-50">
        <button
          className="bg-transparent text-[8px] text-gray-300 hover:text-red-400 underline"
          onClick={async () => {
            const testPayload = {
              industry: "Healthcare",
              pain_points: [
                "Mental health support is hard to access",
                "Long wait times for doctor appointments"
              ],
              ideas: [
                "AI chatbot for mental health symptom checking",
                "Mobile app for remote diagnostics"
              ],
              goals: [
                "Reduce stress",
                "Improve patient self-care"
              ],
              constraints: [
                "No certified medical advisor on the team",
                "Limited time and budget",
                "Team knows frontend, backend, basic ML"
              ]
            };
            try {
              const response = await fetch("http://127.0.0.1:8000/generate-ideas", {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(testPayload),
              });

              const result = await response.json();
              if (!result?.ideas || typeof result.ideas !== "string" || result.ideas.trim().length === 0) {
                alert("Received empty idea list. Please try again.");
                return;
              }
              console.log("Generated ideas:", result);

              if (typeof window !== "undefined") {
                const rawIdeas: string = result.ideas || "";
                const parsedIdeas = rawIdeas
                  .split(/Idea \d+:/)
                  .map((ideaChunk: string) => ideaChunk.trim())
                  .filter((idea: string) => idea.length > 0)
                  .map((idea: string, index: number) => `Idea ${index + 1}: ${idea}`);
                localStorage.setItem("thinkflowGeneratedIdeas", JSON.stringify(parsedIdeas));
                // Enhanced localStorage logic
                const previousData = localStorage.getItem("thinkflowUserData");
                let parsed = {};
                if (previousData) {
                  try {
                    parsed = JSON.parse(previousData);
                  } catch (err) {
                    console.error("⚠️ Failed to parse existing user data from localStorage:", err);
                  }
                }

                const updatedData = {
                  ...parsed,
                  ideas: parsedIdeas,
                  industry: industry,
                  team_size: 3, // Replace this with actual dynamic value if available
                  team_members: [
                    { name: "Alice", skills: ["frontend development", "UI/UX design"] },
                    { name: "Bob", skills: ["backend development", "database management"] },
                    { name: "Charlie", skills: ["machine learning", "data preprocessing"] }
                  ]
                };

                localStorage.setItem("thinkflowUserData", JSON.stringify(updatedData));
                router.push("/select-idea");
              }

            } catch (error) {
              console.error("Failed to generate test ideas:", error);
              alert("Error generating ideas. See console.");
            }
          }}
        >
          test
        </button>
      </div>
      <div className="flex h-screen">
      {/* Sidebar Toolbar */}
      <div className="w-20 bg-purple-100 flex flex-col justify-center items-center py-4 space-y-6 border-r border-purple-300">
        <button
          className={`rounded-full px-4 py-2 bg-red-400 text-white ${activeTool === "delete" ? "ring-2 ring-black" : ""}`}
          onClick={() => setActiveTool("delete")}
        >
          ❌
        </button>
        <button
          className={`rounded-full px-4 py-2 bg-purple-500 text-white ${activeTool === "text" ? "ring-2 ring-black" : ""
            }`}
          onClick={() => setActiveTool("text")}
        >
          T
        </button>
        <button
          className={`rounded-full px-4 py-2 bg-yellow-300 text-black ${activeTool === "sticky" ? "ring-2 ring-black" : ""
            }`}
          onClick={() => {
            setActiveTool("sticky");
            selectedColorRef.current = null;
          }}
        >
          📌
        </button>
        {activeTool === "sticky" && selectedColorRef.current === null && (
          <ColorPalette onSelect={placeStickyNote} />
        )}
      </div>

      {/* Main Whiteboard */}
      <div className="flex-1 relative bg-gray-50 p-4">
        {/* Top Header and Generate Ideas Button */}
        <div className="flex justify-center items-start mb-4 relative w-full">
          <div className="w-full flex flex-col items-center text-center">
            <div className="text-purple-700 font-bold text-2xl mb-1">
              Industry: {industry}
            </div>
            <div className="text-purple-600 font-medium text-sm flex flex-wrap justify-center gap-2 px-4 max-w-xl mx-auto text-center">
              {trends.map((tag, index) => (
                <span key={index}>{tag}</span>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <button
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded"
              onClick={handleGenerateIdeas}
            >
              Generate Ideas
            </button>
          </div>
        </div>

        {/* Quadrants */}
        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[calc(100%-6rem)] relative"
          onClick={handleBoardClick}
        >
          {["Pain Points / Needs", "Ideas / Features", "Goals / Outcomes", "Constraints / Resources"].map((title, index) => (
            <div
              key={index}
              ref={quadrantRefs[index]}
              className="border-2 border-purple-300 rounded-lg p-3 bg-white relative overflow-hidden"
            >
              <h3 className="text-purple-700 font-semibold text-sm mb-2">{title}</h3>
              {/* Notes */}
              {notes.map((note) => {
                if (note.quadrant !== index) return null;
                const DraggableComponent = note.type === "text" ? DraggableText : DraggableNote;
                const boundsSelector = `.grid > div:nth-child(${note.quadrant + 1})`;
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      if (activeTool === "delete") {
                        setNotes(prev => prev.filter(n => n.id !== note.id));
                        setActiveTool(null);
                      }
                    }}
                  >
                    <DraggableComponent
                      note={{ ...note }}
                      onStop={(id, x, y) => {
                        setNotes((prev) =>
                          prev.map((n) => {
                            if (n.id !== id) return n;
                            const parent = document.querySelectorAll(".grid > div")[n.quadrant] as HTMLElement;
                            if (!parent) return n;
                            const noteWidth = 150;
                            const noteHeight = 100;
                            const maxX = parent.clientWidth - noteWidth;
                            const maxY = parent.clientHeight - noteHeight;
                            const clampedX = Math.max(0, Math.min(x, maxX));
                            const clampedY = Math.max(0, Math.min(y, maxY));
                            return { ...n, x: clampedX, y: clampedY };
                          })
                        );
                      }}
                      onChange={(id, content) => updateNote(id, content)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
