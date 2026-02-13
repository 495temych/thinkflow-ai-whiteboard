"use client";

import { useEffect, useState } from "react";

export default function ViewPDFPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("thinkflowPDFPath");
      if (stored) {
        // Normalize relative path
        let cleanPath = stored.replace("../", "/").replace("./", "/");
        setPdfUrl(`http://127.0.0.1:8000${cleanPath}`);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-purple-700 mb-6">🎉 Project Plan Ready!</h1>
      <p className="text-lg text-gray-700 text-center max-w-xl">
        Your ThinkFlow Project Plan PDF has been successfully generated and saved.
      </p>
      <p className="text-md text-gray-600 mt-2 text-center max-w-xl">
        You can now find the document in your project folder or download it using the interface below.
      </p>
      {pdfUrl && (
        <a
          href={pdfUrl}
          download
          className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-full"
        >
          Download Project Plan PDF
        </a>
      )}
    </div>
  );
}