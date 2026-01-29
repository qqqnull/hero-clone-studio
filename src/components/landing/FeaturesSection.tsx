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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 text-center hover:bg-white/20 transition-colors"
            >
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
