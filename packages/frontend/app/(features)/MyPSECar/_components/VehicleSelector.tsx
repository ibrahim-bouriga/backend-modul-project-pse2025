'use client';

import { VehicleSelectorProps } from './types';

export default function VehicleSelector({
  vehicles,
  selectedVehicleId,
  onSelect,
}: VehicleSelectorProps) {
  if (vehicles.length === 0) {
    return null;
  }

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Vehicle
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            {selectedVehicle?.nickname || 'Select your PSE car'}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {selectedVehicle
              ? `VIN ${selectedVehicle.vin}`
              : 'Choose a registered vehicle to start live monitoring.'}
          </p>
        </div>

        <div className="w-full sm:max-w-xs">
          <label
            htmlFor="vehicle-selector"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
          >
            Active vehicle
          </label>
          <select
            id="vehicle-selector"
            value={selectedVehicleId ?? ''}
            onChange={(event) => onSelect(event.target.value)}
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition focus:border-red-500"
          >
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.nickname || 'Unnamed vehicle'} · {vehicle.vin}
              </option>
            ))}
          </select>
        </div>
      </div>

      {vehicles.length > 1 && (
        <p className="mt-4 text-xs text-zinc-500">
          {vehicles.length} vehicles available for this user profile.
        </p>
      )}
    </section>
  );
}
