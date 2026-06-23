"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/MyPSECar";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/mypsecars/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Login fehlgeschlagen");
      }
    } catch {
      setError("Netzwerkfehler – bitte erneut versuchen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2">
          Benutzername
        </label>
        <input
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500 transition"
          placeholder="z.B. fahrer1"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-2">
          Passwort
        </label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500 transition"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Anmelden …" : "Anmelden"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
            PSE 2025
          </p>
          <h1 className="text-4xl font-black uppercase leading-none tracking-tight mb-3">
            MyPSECar
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Melde dich an, um dein Fahrzeug-Dashboard aufzurufen.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
