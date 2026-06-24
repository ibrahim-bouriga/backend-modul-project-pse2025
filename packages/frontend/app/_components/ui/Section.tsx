import type { ReactNode } from "react";

/**
 * Props for the Section component
 */
interface SectionProps {
  /** Content to render inside the section */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Background color variant */
  background?: "dark" | "darker" | "black";
  /** Padding size variant */
  padding?: "sm" | "md" | "lg";
}

/**
 * Reusable section container component with consistent styling
 */
export function Section({
  children,
  className = "",
  background = "darker",
  padding = "lg",
}: SectionProps) {
  const bgClasses = {
    dark: "bg-zinc-900",
    darker: "bg-zinc-950",
    black: "bg-black",
  };

  const paddingClasses = {
    sm: "py-10",
    md: "py-16",
    lg: "py-20",
  };

  return (
    <section
      className={`${bgClasses[background]} ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </section>
  );
}
