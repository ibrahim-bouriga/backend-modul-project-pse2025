import type { ReactNode } from "react";

export default function PhoneLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-white font-sans">{children}</div>
  );
}
