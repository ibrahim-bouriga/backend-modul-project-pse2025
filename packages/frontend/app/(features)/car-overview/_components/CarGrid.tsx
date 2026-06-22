import Image from "next/image";

const CAR_MODELS_URL = process.env.CAR_MODELS_URL ?? "http://localhost:4001";

const badgeStyles: Record<string, string> = {
  Supercar: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Super SUV": "bg-red-500/20 text-red-300 border-red-500/30",
  Limited: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "Off-Road": "bg-amber-600/20 text-amber-300 border-amber-600/30",
};

const dotStyles: Record<string, string> = {
  Supercar: "bg-orange-400",
  "Super SUV": "bg-red-400",
  Limited: "bg-violet-400",
  "Off-Road": "bg-amber-400",
};

type CarModel = {
  id: number;
  name: string;
  year: number;
  category: string;
  engine: string;
  power: string;
  acceleration: string;
  topSpeed: string;
  imageUrl: string;
};

export default async function CarGrid() {
  const res = await fetch(`${CAR_MODELS_URL}/api/car-models`, {
    next: { revalidate: 60 },
  });
  const cars: CarModel[] = await res.json();

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((car) => (
        <div
          key={car.id}
          className="group bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex flex-col"
        >
          {/* Car image */}
          <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
            <Image
              src={car.imageUrl}
              alt={car.name}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-900/60 to-transparent" />
            <span
              className={`absolute bottom-4 left-4 text-xs font-semibold tracking-[0.2em] uppercase px-3 py-1 rounded-full border ${badgeStyles[car.category] ?? "bg-zinc-700 text-zinc-300 border-zinc-600"}`}
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

            <div
              className={`mt-auto h-px w-full rounded-full opacity-30 ${dotStyles[car.category] ?? "bg-zinc-400"}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
