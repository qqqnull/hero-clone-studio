import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import {
  HeroSection,
  StepsSection,
  UseCasesSection,
  FeaturesSection,
  StatsSection,
} from '@/components/landing';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AnnouncementBar />
      <main className="flex-1">
        <HeroSection />
        <StepsSection />
        <UseCasesSection />
        <StatsSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
