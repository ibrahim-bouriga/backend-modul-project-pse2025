import Link from "next/link";

interface HeaderProps {
  fixed?: boolean;
}

export default function Header({ fixed = false }: HeaderProps) {
  const fixedClasses = fixed
    ? "fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-sm py-4"
    : "border-b border-zinc-900 py-5";

  return (
    <nav className={`flex items-center justify-between px-8 ${fixedClasses}`}>
      <Link href="/" className="text-xl font-black tracking-widest uppercase">
        MyPSECar
      </Link>
      <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400">
        Backend-Entwicklung · PSE 2025
      </span>
    </nav>
  );
}
