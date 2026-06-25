import type { Feature, HeroConfig } from "../../_types/features";

/**
 * Hero section configuration for the homepage
 */
export const HERO_CONFIG: HeroConfig = {
  image: "/DSC_5903.webp",
  title: "Drive the\nBackend.",
  subtitle: "Study Project · Backend-Entwicklung",
  description:
    "MyPSECar is the full-stack showcase built by students mastering modern backend architecture — REST APIs, real-time MQTT, object storage, and containerised deployments.",
};

/**
 * List of all application features displayed on the homepage
 * Add new features here to automatically include them in the homepage grid
 */
export const FEATURES: Feature[] = [
  {
    href: "/car-overview",
    title: "Cars Overview",
    description:
      "Browse all available models from our lineup. Explore specs and compare configurations to find your ideal vehicle.",
    category: "core",
  },
  {
    href: "/car-configurator",
    title: "Car Configurator",
    description:
      "Customise every detail in our interactive 3D configurator — then hit Start and drive through a virtual world, steered by tilting your smartphone.",
    category: "core",
  },
  {
    href: "/world-drive",
    title: "World Drive",
    description:
      "Follow the manufacturer's super car as it roams the globe. Live GPS coordinates are broadcast via MQTT and rendered on a real interactive map.",
    category: "core",
  },
  {
    href: "/merchandise",
    title: "Merchandise",
    description:
      "Shop our exclusive collection of branded merchandise. Add items to your cart and check out — backed by a fully-featured REST API.",
    category: "core",
  },
  {
    href: "/MyPSECar",
    title: "MyPSECar",
    description:
      "Your personal vehicle dashboard. Monitor fuel level and live GPS position in real time — all data streamed directly from your car via MQTT.",
    category: "core",
  },
];
