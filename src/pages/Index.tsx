import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { SEO } from '@/components/SEO';
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
      <SEO 
        title="虚拟号码短信接收平台 | 180+国家 700+服务"
        description="HEROSMS提供全球虚拟手机号码接收短信验证码服务，支持180+国家、700+平台，包括Telegram、WhatsApp、Google、Facebook等。隐私安全，即时接收，API接入支持。"
        keywords="虚拟号码,接码平台,短信验证码,临时手机号,SMS verification,virtual phone number,receive SMS,Telegram验证码,WhatsApp验证码"
        url="/"
      />
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
