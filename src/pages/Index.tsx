import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import {
  HeroSection,
  ServiceSearchSection,
  WhyNeedSection,
  PartnersSection,
  DisposableNumbersSection,
  AboutPlatformSection,
  WhyChooseSection,
  GuideSection,
  PurchaseGuideSection,
  FAQSection,
} from '@/components/landing';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AnnouncementBar />
      <main className="flex-1">
        <HeroSection />
        <ServiceSearchSection />
        <WhyNeedSection />
        <PartnersSection />
        <DisposableNumbersSection />
        <AboutPlatformSection />
        <WhyChooseSection />
        <GuideSection />
        <PurchaseGuideSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
