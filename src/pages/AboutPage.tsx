import { useTranslation } from 'react-i18next';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { SEO } from '@/components/SEO';
import { Check, Zap, Globe, DollarSign, Gift, Shield, Users, Headphones } from 'lucide-react';

const features = [
  { icon: <Shield className="w-8 h-8" />, titleKey: 'about.feature1.title', descKey: 'about.feature1.desc' },
  { icon: <Check className="w-8 h-8" />, titleKey: 'about.feature2.title', descKey: 'about.feature2.desc' },
  { icon: <Shield className="w-8 h-8" />, titleKey: 'about.feature3.title', descKey: 'about.feature3.desc' },
  { icon: <Zap className="w-8 h-8" />, titleKey: 'about.feature4.title', descKey: 'about.feature4.desc' },
  { icon: <Globe className="w-8 h-8" />, titleKey: 'about.feature5.title', descKey: 'about.feature5.desc' },
];

const whyChoose = [
  { icon: <Check className="w-6 h-6 text-primary" />, titleKey: 'about.why1.title', descKey: 'about.why1.desc' },
  { icon: <Zap className="w-6 h-6 text-primary" />, titleKey: 'about.why2.title', descKey: 'about.why2.desc' },
  { icon: <Globe className="w-6 h-6 text-primary" />, titleKey: 'about.why3.title', descKey: 'about.why3.desc' },
  { icon: <DollarSign className="w-6 h-6 text-primary" />, titleKey: 'about.why4.title', descKey: 'about.why4.desc' },
  { icon: <Gift className="w-6 h-6 text-primary" />, titleKey: 'about.why5.title', descKey: 'about.why5.desc' },
  { icon: <Headphones className="w-6 h-6 text-primary" />, titleKey: 'about.why6.title', descKey: 'about.why6.desc' },
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="关于我们"
        description="HEROSMS是全球领先的虚拟号码服务平台，提供180+国家覆盖、700+服务支持、1000万+激活次数，24/7客户支持。"
        keywords="HEROSMS,虚拟号码平台,接码服务商,关于我们"
        url="/about"
      />
      <Navbar />
      <AnnouncementBar />
      
      <main className="flex-1 pt-8">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t('about.title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t('about.subtitle')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 mb-20">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>

          {/* Why Choose Section */}
          <div className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              {t('about.whyTitle')}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyChoose.map((item, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {t(item.titleKey)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(item.descKey)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-12 text-white text-center mb-20">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold mb-2">180+</div>
                <div className="text-white/80">{t('about.stats.countries')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">700+</div>
                <div className="text-white/80">{t('about.stats.services')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">10M+</div>
                <div className="text-white/80">{t('about.stats.activations')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-white/80">{t('about.stats.support')}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
