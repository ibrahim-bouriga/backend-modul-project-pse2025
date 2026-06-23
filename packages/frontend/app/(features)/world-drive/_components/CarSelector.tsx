"use client";

export interface Car {
  id:     string;
  name:   string;
  color:  string;
  isLive: boolean;
}

interface Props {
  cars:         Car[];
  focusedCarId: string | null;
  onFocus:      (car: Car) => void;
}

export default function CarSelector({ cars, focusedCarId, onFocus }: Props) {
  if (cars.length === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-xl px-3 py-2 shadow-lg">
      {cars.map((car) => (
        <button
          key={car.id}
          onClick={() => onFocus(car)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            focusedCarId === car.id ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${car.isLive ? "animate-pulse" : "opacity-40"}`}
            style={{ backgroundColor: car.color }}
          />
          {car.name}
        </button>
      ))}
    </div>
  );
}
