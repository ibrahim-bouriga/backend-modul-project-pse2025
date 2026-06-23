import Link from "next/link";
import Header from "./_components/Header";
import Footer from "./_components/Footer";

// ─── Edit the hero background image here ───────────────────────────────────
const HERO_IMAGE = "/DSC_5903.webp";
// ───────────────────────────────────────────────────────────────────────────

/**
 * Feature pages registry — add an entry here whenever you create a new page
 * under app/<your-feature>/page.tsx so it shows up on the home screen.
 */
const featurePages: { href: string; title: string; description: string }[] = [
  {
    href: "/car-overview",
    title: "Cars Overview",
    description:
      "Browse all available models from our lineup. Explore specs and compare configurations to find your ideal vehicle.",
  },
  {
    href: "/car-configurator",
    title: "Car Configurator",
    description:
      "Customise every detail in our interactive 3D configurator — then hit Start and drive through a virtual world, steered by tilting your smartphone.",
  },
  {
    href: "/driving-simulation",
    title: "Driving Simulation",
    description:
      "Experience the thrill of driving in a virtual environment. Customize your ride and test it on various tracks.",
  },
  {
    href: "/world-drive",
    title: "World Drive",
    description:
      "Follow the manufacturer's super car as it roams the globe. Live GPS coordinates are broadcast via MQTT and rendered on a real interactive map.",
  },
  {
    href: "/merchandise",
    title: "Merchandise",
    description:
      "Shop our exclusive collection of branded merchandise. Add items to your cart and check out — backed by a fully-featured REST API.",
  },
  {
    href: "/MyPSECar",
    title: "MyPSECar",
    description:
      "Your personal vehicle dashboard. Monitor fuel level and live GPS position in real time — all data streamed directly from your car via MQTT.",
  },
  {
    href: "/example",
    title: "Example Feature",
    description:
      "Reference implementation: shows how to build a feature page and connect to the backend API.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <Header fixed />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative w-full h-screen bg-center bg-cover flex flex-col justify-end pt-20"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      >
        {/* dark gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />

        <div className="relative z-10 px-8 pb-20 max-w-4xl">
          <p className="text-sm font-semibold tracking-[0.3em] uppercase text-zinc-300 mb-4">
            Study Project · Backend-Entwicklung
          </p>
          <h1 className="text-6xl font-black uppercase leading-none tracking-tight mb-6">
            Drive the
            <br />
            Backend.
          </h1>
          <p className="text-lg text-zinc-300 max-w-xl leading-relaxed">
            MyPSECar is the full-stack showcase built by students mastering
            modern backend architecture — REST APIs, real-time MQTT, object
            storage, and containerised deployments.
          </p>
        </div>
      </section>

      {/* ── Feature Tiles ────────────────────────────────────────────────── */}
      <section className="bg-zinc-950 px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-2">
            Explore Features
          </h2>
          <p className="text-zinc-400 mb-12 text-sm tracking-wide">
            Select a module below to inspect its implementation.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featurePages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="group block bg-zinc-900 rounded-2xl p-8 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                <h3 className="text-lg font-black uppercase tracking-wide mb-3 group-hover:text-white text-zinc-100">
                  {page.title}
                  <span className="ml-2 text-zinc-500 group-hover:text-white">
                    →
                  </span>
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
