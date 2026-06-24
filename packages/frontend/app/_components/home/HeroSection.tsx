import type { HeroConfig } from "../../_types/features";

/**
 * Hero section component for the homepage
 * Displays a full-screen hero with background image, title, subtitle, and description
 */
export function HeroSection({
  image,
  title,
  subtitle,
  description,
}: HeroConfig) {
  return (
    <section
      className="relative w-full h-screen bg-center bg-cover flex flex-col justify-end pt-20"
      style={{ backgroundImage: `url(${image})` }}
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/10" />

      <div className="relative z-10 px-8 pb-20 max-w-4xl">
        <p className="text-sm font-semibold tracking-[0.3em] uppercase text-zinc-300 mb-4">
          {subtitle}
        </p>
        <h1 className="text-6xl font-black uppercase leading-none tracking-tight mb-6">
          {title.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < title.split("\n").length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="text-lg text-zinc-300 max-w-xl leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}

