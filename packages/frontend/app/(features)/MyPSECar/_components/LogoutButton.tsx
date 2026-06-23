"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/mypsecars/auth/logout", { method: "POST" });
    router.push("/MyPSECar/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="shrink-0 mt-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-xl transition"
    >
      Abmelden
    </button>
  );
}