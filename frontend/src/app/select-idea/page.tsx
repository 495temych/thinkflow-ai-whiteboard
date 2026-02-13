"use client";

import React, { useEffect, useState } from "react";
import type { JSX } from "react";
import { useRouter } from "next/navigation";

type IdeaBlock = string[];

export default function SelectIdeaPage() {
  const [ideas, setIdeas] = useState<IdeaBlock[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      let rawIdeas: string | null = localStorage.getItem("thinkflowUserData");
      let structuredIdeas: IdeaBlock[] = [];

      if (rawIdeas) {
        const parsed = JSON.parse(rawIdeas || "{}") as {
          industry?: string;
          team_size?: number;
          team_members?: Array<{ name: string; skills: string | string[] }>;
          ideas?: string[] | string;
          selected_idea?: string;
        };
        if (Array.isArray(parsed.ideas)) {
          structuredIdeas = parsed.ideas.map((idea) =>
            typeof idea === "string" ? idea.trim().split("\n") : []
          );
        } else if (typeof parsed.ideas === "string") {
          structuredIdeas = [[parsed.ideas.trim()]];
        }
      }

      // Fallback: check 'thinkflowGeneratedIdeas'
      if (structuredIdeas.length === 0) {
        const backup = localStorage.getItem("thinkflowGeneratedIdeas");
        if (backup) {
          try {
            const parsedBackup = JSON.parse(backup);
            if (Array.isArray(parsedBackup)) {
              structuredIdeas = parsedBackup.map((idea: string) => idea.trim().split("\n"));
              console.log("✅ Fallback to thinkflowGeneratedIdeas:", structuredIdeas);
            }
          } catch (e) {
            console.warn("⚠️ Failed to parse thinkflowGeneratedIdeas fallback", e);
          }
        }
      }

      if (structuredIdeas.length > 0) {
        setIdeas(structuredIdeas);
        console.log("✅ Final structured ideas ready for rendering:", structuredIdeas);
      } else {
        console.warn("📭 No structured ideas to display.");
      }
    }
  }, []);

  const handleSelect = (index: number): void => {
    setSelectedIndex(index);
  };

const handleGeneratePlan = async (): Promise<void> => {
  if (selectedIndex !== null) {
    const selectedIdea = ideas[selectedIndex].join("\n");
    const stored = localStorage.getItem("thinkflowUserData");
    if (stored) {
      const parsed = JSON.parse(stored || "{}") as {
        industry?: string;
        team_size?: number;
        team_members?: Array<{ name: string; skills: string | string[] }>;
        ideas?: string[] | string;
        selected_idea?: string;
      };

      if (!parsed.industry || !parsed.team_size || !parsed.team_members || !Array.isArray(parsed.team_members) || parsed.team_members.length === 0) {
        alert("Missing required fields: industry, team size, or team members.");
        return;
      }

      if (!Array.isArray(parsed.team_members)) {
        parsed.team_members = [];
      }

      // Normalize team members
      parsed.team_members = parsed.team_members.map((member: any) => ({
        name: member.name || "",
        skills:
          typeof member.skills === "string"
            ? member.skills.split(",").map((s: string) => s.trim())
            : Array.isArray(member.skills)
            ? member.skills
            : [],
      }));

      parsed.selected_idea = selectedIdea;
      delete parsed.ideas; // clean up before sending

      console.log("📦 Final payload for /generate-pdf:", parsed);

      const response = await fetch("http://127.0.0.1:8000/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ PDF generation failed:", errorText);
        alert("Failed to generate PDF: " + errorText);
        return;
      }

      const result = await response.json();
      if (result?.file_url) {
        localStorage.setItem("thinkflowPDFPath", result.file_url);
        router.push("/generate-pdf");
      } else {
        alert("Failed to generate PDF");
      }
    }
  } else {
    alert("Please select an idea to continue.");
  }
};

  return (
    <div className="min-h-screen p-8 bg-white text-purple-800">
      <h1 className="text-3xl font-bold text-center mb-6">Step 3: Choose One idea out of 3</h1>
      <div className="flex flex-col space-y-4 max-w-4xl mx-auto">
        {ideas.map((ideaLines: string[], idx: number): JSX.Element => (
          <div
            key={idx}
            className={`border-2 rounded-lg p-4 relative cursor-pointer ${
              selectedIndex === idx ? "border-purple-700 bg-purple-50" : "border-purple-300"
            }`}
            onClick={() => handleSelect(idx)}
          >
            <div className="absolute top-4 left-4 text-2xl">
              {selectedIndex === idx ? "✅" : "⬜"}
            </div>
            <div className="pl-10">
              {ideaLines.map((line: string, i: number) => {
                let formatted: string = line;
                if (line.startsWith("Idea ")) {
                  formatted = `${line}`;
                } else if (line.includes("Goal:")) {
                  formatted = `${line}`;
                } else if (line.includes("Target Users:")) {
                  formatted = `${line}`;
                } else if (line.includes("Fit for Team:")) {
                  formatted = `${line}`;
                } else if (line.includes("Tech Stack:")) {
                  formatted = `${line}`;
                } else if (line.includes("Scalability:")) {
                  formatted = `${line}`;
                }
                return (
                  <p key={i} className="mb-1 whitespace-pre-wrap">{formatted}</p>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <button
          onClick={handleGeneratePlan}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-full"
        >
          Generate a Plan →
        </button>
      </div>
    </div>
  );
}
