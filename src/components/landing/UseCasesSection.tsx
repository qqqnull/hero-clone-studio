import { useTranslation } from 'react-i18next';
import { Users, ShoppingBag, Shield, Building, Code, Globe } from 'lucide-react';

export function UseCasesSection() {
  const { t } = useTranslation();

  const useCases = [
    { icon: Users, title: t('useCases.case1.title'), description: t('useCases.case1.description') },
    { icon: ShoppingBag, title: t('useCases.case2.title'), description: t('useCases.case2.description') },
    { icon: Shield, title: t('useCases.case3.title'), description: t('useCases.case3.description') },
    { icon: Building, title: t('useCases.case4.title'), description: t('useCases.case4.description') },
    { icon: Code, title: t('useCases.case5.title'), description: t('useCases.case5.description') },
    { icon: Globe, title: t('useCases.case6.title'), description: t('useCases.case6.description') },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('useCases.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('useCases.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-border group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <useCase.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {useCase.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
