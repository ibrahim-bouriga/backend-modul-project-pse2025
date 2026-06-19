"use client";

import { useState, useEffect } from "react";
import { CarConfiguration } from "./types";
import { BACKEND_URL } from "../../../_lib/api";

interface ConfigurationSelectorProps {
  carId: string;
  onConfigurationSelect: (config: CarConfiguration) => void;
}

export default function ConfigurationSelector({
  carId,
  onConfigurationSelect,
}: ConfigurationSelectorProps) {
  const [configurations, setConfigurations] = useState<CarConfiguration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<CarConfiguration | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${BACKEND_URL}/api/cars/${carId}/configs`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch configurations");
        }

        const data = await response.json();
        setConfigurations(data.configurations || []);

        // Auto-select first configuration
        if (data.configurations && data.configurations.length > 0) {
          setSelectedConfig(data.configurations[0]);
          onConfigurationSelect(data.configurations[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchConfigurations();
  }, [carId, onConfigurationSelect]);

  const handleConfigSelect = (config: CarConfiguration) => {
    setSelectedConfig(config);
    onConfigurationSelect(config);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Configurations</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Configurations</h3>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (configurations.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Configurations</h3>
        <div className="bg-zinc-800 rounded-lg p-6 text-center">
          <p className="text-zinc-400">No configurations available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">
        Available Configurations
      </h3>

      <div className="space-y-3">
        {configurations.map((config) => {
          const isSelected = selectedConfig?.id === config.id;
          const price = parseFloat(config.price);
          const formattedPrice = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(price);

          return (
            <button
              key={config.id}
              onClick={() => handleConfigSelect(config)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-zinc-500 bg-zinc-800"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-zinc-700"
                      style={{ backgroundColor: config.color.toLowerCase() }}
                      title={config.color}
                    />
                    <span className="text-white font-semibold">
                      {config.color}
                    </span>
                  </div>
                </div>
                <span className="text-white font-bold">{formattedPrice}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-zinc-500">Wheels:</span>
                  <span className="text-zinc-300 ml-2">{config.wheels}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Interior:</span>
                  <span className="text-zinc-300 ml-2">{config.interior}</span>
                </div>
              </div>

              {config.extras && Object.keys(config.extras).length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Extras:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(config.extras).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isSelected && (
                <div className="mt-3 flex items-center gap-2 text-green-500 text-sm font-semibold">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
