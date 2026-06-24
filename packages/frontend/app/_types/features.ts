/**
 * Type definitions for homepage features and configuration
 */

/**
 * Represents a feature/module in the application
 */
export interface Feature {
  /** Route path for the feature */
  href: string;
  /** Display title of the feature */
  title: string;
  /** Brief description of what the feature does */
  description: string;
  /** Optional icon identifier */
  icon?: string;
  /** Category for grouping features */
  category?: 'core' | 'utility' | 'example';
}

/**
 * Configuration for the hero section
 */
export interface HeroConfig {
  /** Background image URL */
  image: string;
  /** Main heading text (supports \n for line breaks) */
  title: string;
  /** Subtitle/tagline text */
  subtitle: string;
  /** Longer description text */
  description: string;
}

