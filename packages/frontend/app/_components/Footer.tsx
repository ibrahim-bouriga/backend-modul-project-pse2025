import Link from "next/link";

export default function Footer() {
  return (
    <footer className="px-8 py-6 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-600 tracking-wide">
      <Link href="/" className="font-semibold uppercase text-zinc-400 hover:text-white">
        ← Home
      </Link>
      <span>
        Backend URL:{" "}
        <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400">
          {process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000"}
        </code>
      </span>
    </footer>
  );
}
