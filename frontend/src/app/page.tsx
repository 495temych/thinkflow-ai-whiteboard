// ✅ Checkpoint: Working flow up to idea selection (pages 1–3)
// Includes: Welcome → Whiteboard → Select Idea Page
// Last verified: 2025-05-18

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [industry, setIndustry] = useState("Healthcare");
  const [teamSize, setTeamSize] = useState(3);
  const [teamMembers, setTeamMembers] = useState([{ name: "", skills: "" }]);

  useEffect(() => {
    setTeamMembers((prev) => {
      const copy = [...prev];
      while (copy.length < teamSize) copy.push({ name: "", skills: "" });
      return copy.slice(0, teamSize);
    });
  }, [teamSize]);

  const handleContinue = async () => {
    try {
      const standardizedMembers = teamMembers.map((m) => ({
        name: m.name.trim(),
        skills: m.skills.trim()
      }));

      const response = await fetch("http://127.0.0.1:8000/generate-hashtags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          industry,
          skills: standardizedMembers.map((m) => m.skills),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch hashtags");
      }

      const data = await response.json();
      const trends = data?.trends || "";

      const payload = {
        industry,
        teamSize,
        teamMembers: standardizedMembers,
        trends,
      };

      const existingData = JSON.parse(localStorage.getItem("thinkflowUserData") || "{}");
      const mergedPayload = { ...existingData, ...payload };
      localStorage.setItem("thinkflowUserData", JSON.stringify(mergedPayload));
      router.push("/whiteboard");
    } catch (error) {
      alert("Failed to generate project trends. Please try again.");
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-8 bg-white text-purple-800">
      <h1 className="text-4xl font-bold text-purple-500 text-center">
        ThinkFlow: Smart Project Kickstart
      </h1>

      <p className="text-lg text-gray-700 max-w-xl text-center">
        This assistant helps your team generate AI-powered project ideas in your
        chosen industry, based on your members’ real skills. Start by entering
        your team’s focus and composition.
      </p>

      <div className="flex flex-col items-center space-y-2">
        <label className="text-lg font-semibold text-purple-800">
          🔍 Target Industry
        </label>
        <input
          className="border px-4 py-2 rounded-md w-64 text-center"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Healthcare, Finance, Education"
        />
      </div>

      <div className="flex flex-col items-center space-y-2">
        <label className="text-lg font-semibold text-purple-800">👥 Team Size</label>
        <input
          type="number"
          className="border px-4 py-2 rounded-md w-64 text-center"
          value={teamSize}
          onChange={(e) => setTeamSize(parseInt(e.target.value))}
          placeholder="e.g. 3"
        />
      </div>

      <div className="text-center">
        <h2 className="text-lg font-bold underline text-purple-300 mb-2">
          🧠 Team Members & Skills
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          List of your team and their key competencies
        </p>
        <table className="border-collapse border w-full max-w-xl text-sm text-left text-purple-800">
          <thead>
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Skills</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member, index) => (
              <tr key={index}>
                <td className="border p-2">
                  <input
                    className="bg-white text-purple-800 w-full"
                    value={member.name}
                    onChange={(e) => {
                      const updated = [...teamMembers];
                      updated[index].name = e.target.value;
                      setTeamMembers(updated);
                    }}
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="bg-white text-purple-800 w-full"
                    value={member.skills}
                    onChange={(e) => {
                      const updated = [...teamMembers];
                      updated[index].skills = e.target.value;
                      setTeamMembers(updated);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleContinue}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-full"
      >
        Continue →
      </button>
    </div>
  );
}