"use client";

import { useState } from "react";
import { BACKEND_URL } from "../../../_lib/api";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Interactive component that tests the connection to the backend health endpoint.
 * Mirrors the behaviour of the original app.js: clicking the button fetches
 * /api/health and displays the result inline.
 */
export default function BackendHealthCheck() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleCheck() {
    setStatus("loading");
    setMessage("Connecting to backend...");

    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      const data = await res.json();
      setStatus("success");
      setMessage(`Backend connected! Message: ${data.message}`);
    } catch {
      setStatus("error");
      setMessage(
        `Backend connection failed. Make sure the backend server is running on port 4000.`
      );
    }
  }

  const responseClass =
    status === "success"
      ? "bg-zinc-800 text-green-400 border border-green-800"
      : status === "error"
        ? "bg-zinc-800 text-red-400 border border-red-800"
        : "bg-zinc-800 text-zinc-400";

  return (
    <div>
      <h2 className="text-2xl font-black uppercase tracking-tight mb-1 text-white">Backend</h2>
      <p className="text-zinc-400 text-sm mb-6">
        Express server with Node.js and TypeScript
      </p>

      <button
        onClick={handleCheck}
        disabled={status === "loading"}
        className="w-full px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-sm rounded-lg disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Connecting…" : "Test Backend Connection"}
      </button>

      {message && (
        <div className={`mt-4 p-4 rounded-lg text-sm font-mono ${responseClass}`}>
          {status === "success" && "✓ "}
          {status === "error" && "✗ "}
          {message}
        </div>
      )}
    </div>
  );
}
