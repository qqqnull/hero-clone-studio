import { useTranslation } from 'react-i18next';
import { UserPlus, Wallet, Search, Phone, MessageSquare } from 'lucide-react';

export function StepsSection() {
  const { t } = useTranslation();

  const steps = [
    { icon: UserPlus, title: t('steps.step1.title'), description: t('steps.step1.description') },
    { icon: Wallet, title: t('steps.step2.title'), description: t('steps.step2.description') },
    { icon: Search, title: t('steps.step3.title'), description: t('steps.step3.description') },
    { icon: Phone, title: t('steps.step4.title'), description: t('steps.step4.description') },
    { icon: MessageSquare, title: t('steps.step5.title'), description: t('steps.step5.description') },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('steps.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('steps.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[calc(100%-20px)] h-0.5 bg-primary/20" />
              )}

              <div className="flex flex-col items-center text-center relative z-10">
                {/* Step Number Badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold z-20">
                  {index + 1}
                </div>

                {/* Icon Container */}
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group hover:bg-primary/20 transition-colors">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
