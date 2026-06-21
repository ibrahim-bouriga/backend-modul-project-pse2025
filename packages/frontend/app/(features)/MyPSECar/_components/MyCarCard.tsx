import Image from "next/image";
import type { Car } from "../_lib/data";

interface MyCarCardProps {
  car: Car;
}

export default function MyCarCard({ car }: MyCarCardProps) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="relative aspect-[16/9] bg-zinc-800">
        <Image
          src={car.image}
          alt={car.name}
          fill
          className="object-cover"
          sizes="(max-width: 896px) 100vw, 896px"
          priority
        />
      </div>
      <div className="p-6">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-2">
          Dein Fahrzeug
        </p>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          {car.name}
        </h2>
      </div>
    </div>
  );
}
