import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import phoneMockup from '@/assets/phone-title.webp';

export function HeroSection() {
  const { t } = useTranslation();

  const advantages = [
    t('hero.advantages.item1'),
    t('hero.advantages.item2'),
    t('hero.advantages.item3'),
  ];

  return (
    <section className="bg-hero-gradient min-h-[600px] flex items-center py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-[48px] font-semibold leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>

            {/* Advantages List */}
            <ul className="space-y-3 pt-2">
              {advantages.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-accent mt-2.5 flex-shrink-0" />
                  <span className="text-white/90 text-base">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/receive-sms">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-6 text-base rounded-full border-2 border-primary"
                >
                  {t('hero.cta')}
                </Button>
              </Link>
              <Link to="/api">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base rounded-full bg-transparent"
                >
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <img 
              src={phoneMockup} 
              alt="SMS Messages" 
              className="w-[320px] md:w-[380px] lg:w-[450px] h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
