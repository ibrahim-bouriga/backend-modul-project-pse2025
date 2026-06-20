import Image from "next/image";

const cars = [
  {
    name: "Revuelto",
    year: 2024,
    category: "Supercar",
    engine: "V12 HPEV",
    power: "1 001 hp",
    acceleration: "2.5 s",
    topSpeed: "350+ km/h",
    image: "/revuelto.webp",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    dot: "bg-orange-400",
  },
  {
    name: "Huracán EVO",
    year: 2023,
    category: "Supercar",
    engine: "V10 NA",
    power: "640 hp",
    acceleration: "2.9 s",
    topSpeed: "325 km/h",
    image: "/huracan-evo.jpg",
    badge: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    dot: "bg-lime-400",
  },
  {
    name: "Urus S",
    year: 2023,
    category: "Super SUV",
    engine: "V8 Biturbo",
    power: "666 hp",
    acceleration: "3.5 s",
    topSpeed: "305 km/h",
    image: "/urus-s.jpg",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
  {
    name: "Aventador SVJ",
    year: 2022,
    category: "Limited",
    engine: "V12 NA",
    power: "770 hp",
    acceleration: "2.8 s",
    topSpeed: "350 km/h",
    image: "/aventador-svj.webp",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    dot: "bg-violet-400",
  },
  {
    name: "Sterrato",
    year: 2023,
    category: "Off-Road",
    engine: "V10 NA",
    power: "610 hp",
    acceleration: "3.4 s",
    topSpeed: "260 km/h",
    image: "/sterrato.webp",
    badge: "bg-amber-600/20 text-amber-300 border-amber-600/30",
    dot: "bg-amber-400",
  },
  {
    name: "Huracán Tecnica",
    year: 2023,
    category: "Supercar",
    engine: "V10 NA",
    power: "640 hp",
    acceleration: "3.2 s",
    topSpeed: "325 km/h",
    image: "/huracan-tecnica.jpg",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    dot: "bg-cyan-400",
  },
];

export default function CarGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <div
          key={car.name}
          className="group bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col"
        >
          {/* Car image */}
          <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
            <Image
              src={car.image}
              alt={car.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-900/60 to-transparent" />
            <span
              className={`absolute bottom-4 left-4 text-xs font-semibold tracking-[0.2em] uppercase px-3 py-1 rounded-full border ${car.badge}`}
            >
              {car.category}
            </span>
          </div>

          {/* Card body */}
          <div className="p-6 flex flex-col gap-4 flex-1">
            <div>
              <p className="text-xs text-zinc-500 tracking-widest uppercase mb-1">
                {car.year}
              </p>
              <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-100">
                {car.name}
              </h3>
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { label: "Engine", value: car.engine },
                { label: "Power", value: car.power },
                { label: "0–100 km/h", value: car.acceleration },
                { label: "Top Speed", value: car.topSpeed },
              ].map((spec) => (
                <div key={spec.label}>
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-0.5">
                    {spec.label}
                  </p>
                  <p className="text-sm font-bold text-zinc-200">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Bottom accent line */}
            <div className={`mt-auto h-px w-full rounded-full ${car.dot} opacity-30`} />
          </div>
        </div>
      ))}
    </div>
  );
}
