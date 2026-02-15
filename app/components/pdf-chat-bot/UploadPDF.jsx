"use client";

import { useState } from "react";

export default function UploadPdf() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pdf-analyzer/pdf-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setResult(data);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border p-6 shadow-sm">
      <h1 className="text-xl font-semibold mb-4">
        Upload PDF for AI Search
      </h1>

      <input
        type="file"
        accept="application/pdf"
        className="mb-4 block w-full text-sm"
        onChange={(e) => setFile(e.target.files?.[0])}
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
      >
        {loading ? "Processing PDF..." : "Upload & Embed"}
      </button>

      {result && (
        <div className="mt-4 text-sm bg-green-50 border border-green-200 p-3 rounded">
          <p>✅ Pages: {result.pages}</p>
          <p>✅ Chunks stored: {result.chunksCount}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm bg-red-50 border border-red-200 p-3 rounded">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
