import { useTranslation } from 'react-i18next';
import { Zap, Target, DollarSign, Code } from 'lucide-react';

export function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    { icon: Zap, title: t('features.feature1.title'), description: t('features.feature1.description') },
    { icon: Target, title: t('features.feature2.title'), description: t('features.feature2.description') },
    { icon: DollarSign, title: t('features.feature3.title'), description: t('features.feature3.description') },
    { icon: Code, title: t('features.feature4.title'), description: t('features.feature4.description') },
  ];

  return (
    <section className="py-20 bg-hero-gradient text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-colors border border-white/10"
            >
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
