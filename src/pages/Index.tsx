import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import {
  HeroSection,
  HowToSection,
  WhyNeedSection,
  PartnersSection,
  DisposableNumbersSection,
  AboutPlatformSection,
  StatsSection,
  GuideSection,
  FAQSection,
} from '@/components/landing';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AnnouncementBar />
      <main className="flex-1">
        <HeroSection />
        <HowToSection />
        <WhyNeedSection />
        <PartnersSection />
        <DisposableNumbersSection />
        <AboutPlatformSection />
        <StatsSection />
        <GuideSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
