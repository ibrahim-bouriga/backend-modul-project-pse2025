import type { ReactNode } from "react";
import Header from "../_components/Header";
import Footer from "../_components/Footer";

export default function FeaturesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
