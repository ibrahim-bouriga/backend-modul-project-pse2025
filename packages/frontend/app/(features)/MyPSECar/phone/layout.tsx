import type { ReactNode } from "react";

export default function PhoneLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {children}
    </div>
  );
}
