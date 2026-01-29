import { useTranslation } from 'react-i18next';

export function DisposableNumbersSection() {
  const { t } = useTranslation();

  const features = [
    { 
      number: '1', 
      title: t('disposable.feature1.title'), 
      description: t('disposable.feature1.description'),
    },
    { 
      number: '2', 
      title: t('disposable.feature2.title'), 
      description: t('disposable.feature2.description'),
    },
    { 
      number: '3', 
      title: t('disposable.feature3.title'), 
      description: t('disposable.feature3.description'),
    },
    { 
      number: '4', 
      title: t('disposable.feature4.title'), 
      description: t('disposable.feature4.description'),
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {t('disposable.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('disposable.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-8 border border-border shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {feature.number}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
