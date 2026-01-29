import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import phoneMockup from '@/assets/phone-title.webp';

export function HeroSection() {
  const { t } = useTranslation();

  const steps = [
    t('hero.steps.step1'),
    t('hero.steps.step2'),
    t('hero.steps.step3'),
    t('hero.steps.step4'),
    t('hero.steps.step5'),
  ];

  return (
    <section className="bg-hero-gradient min-h-[600px] flex items-center py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-white leading-tight mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-white/80">
            {t('hero.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Left - Phone Mockup */}
          <div className="flex justify-center">
            <img 
              src={phoneMockup} 
              alt="SMS Messages" 
              className="w-[280px] md:w-[320px] h-auto"
            />
          </div>

          {/* Right - Steps */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">
              {t('hero.howToGetCode')}
            </h3>
            <ol className="space-y-4">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-white/90">{step}</span>
                </li>
              ))}
            </ol>

            <Link to="/receive-sms" className="block mt-8">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-dark text-white font-semibold px-10 py-6 text-base rounded-full"
              >
                {t('hero.cta')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
