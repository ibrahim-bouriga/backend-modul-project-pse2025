import { FeatureCard } from "./FeatureCard";
import type { Feature } from "../../_types/features";

/**
 * Props for the FeatureGrid component
 */
interface FeatureGridProps {
  /** Array of features to display */
  features: Feature[];
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
}

/**
 * Grid layout component for displaying feature cards
 * Renders a responsive grid of feature cards with optional title and description
 */
export function FeatureGrid({
  features,
  title = "Explore Features",
  description = "Select a module below to inspect its implementation.",
}: FeatureGridProps) {
  return (
    <div className="max-w-6xl mx-auto px-8">
      <h2 className="text-3xl font-black uppercase tracking-tight mb-2">
        {title}
      </h2>
      <p className="text-zinc-400 mb-12 text-sm tracking-wide">
        {description}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.href} feature={feature} />
        ))}
      </div>
    </div>
  );
}
