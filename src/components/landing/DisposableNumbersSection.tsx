import { useTranslation } from 'react-i18next';
import { List, DollarSign, Package, Target } from 'lucide-react';

export function DisposableNumbersSection() {
  const { t } = useTranslation();

  const features = [
    { 
      number: '1', 
      title: t('disposable.feature1.title'), 
      description: t('disposable.feature1.description'),
      icon: List
    },
    { 
      number: '2', 
      title: t('disposable.feature2.title'), 
      description: t('disposable.feature2.description'),
      icon: DollarSign
    },
    { 
      number: '3', 
      title: t('disposable.feature3.title'), 
      description: t('disposable.feature3.description'),
      icon: Package
    },
    { 
      number: '4', 
      title: t('disposable.feature4.title'), 
      description: t('disposable.feature4.description'),
      icon: Target
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            {t('disposable.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('disposable.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-6 border border-border relative"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                {feature.number}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 mt-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
