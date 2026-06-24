import Header from "./_components/Header";
import Footer from "./_components/Footer";
import { HeroSection } from "./_components/home/HeroSection";
import { FeatureGrid } from "./_components/home/FeatureGrid";
import { Section } from "./_components/ui/Section";
import { FEATURES, HERO_CONFIG } from "./_lib/constants/features";

/**
 * Homepage component
 * Displays hero section and feature grid using extracted, reusable components
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header fixed />
      
      <HeroSection {...HERO_CONFIG} />
      
      <Section background="darker">
        <FeatureGrid features={FEATURES} />
      </Section>
      
      <Footer />
    </div>
  );
}
