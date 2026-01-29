import { useTranslation } from 'react-i18next';
import iphoneImage from '@/assets/iphone-steps.webp';

export function HowToSection() {
  const { t } = useTranslation();

  const steps = [
    t('howTo.steps.step1'),
    t('howTo.steps.step2'),
    t('howTo.steps.step3'),
    t('howTo.steps.step4'),
    t('howTo.steps.step5'),
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - iPhone Image */}
          <div className="flex justify-center lg:justify-start">
            <img 
              src={iphoneImage} 
              alt="iPhone SMS" 
              className="w-[280px] md:w-[320px] h-auto"
            />
          </div>

          {/* Right - Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                {t('howTo.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('howTo.subtitle')}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-foreground">
                {t('howTo.stepsTitle')}
              </h3>
              <ol className="space-y-3">
                {steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 rounded-full transition-colors">
              {t('howTo.cta')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
