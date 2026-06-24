import Link from "next/link";
import type { Feature } from "../../_types/features";

/**
 * Props for the FeatureCard component
 */
interface FeatureCardProps {
  /** Feature data to display */
  feature: Feature;
}

/**
 * Individual feature card component
 * Displays a clickable card with feature title and description
 */
export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <Link
      href={feature.href}
      className="group block bg-zinc-900 rounded-2xl p-8 border border-zinc-800 
                 hover:border-zinc-700 transition-colors
                 focus:outline-none focus:ring-2 focus:ring-white 
                 focus:ring-offset-2 focus:ring-offset-zinc-950"
    >
      <h3 className="text-lg font-black uppercase tracking-wide mb-3 
                     group-hover:text-white text-zinc-100 transition-colors">
        {feature.title}
        <span className="ml-2 text-zinc-500 group-hover:text-white transition-colors">
          →
        </span>
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed">
        {feature.description}
      </p>
    </Link>
  );
}
