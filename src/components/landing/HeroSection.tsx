import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Globe, Phone, Headphones, MessageSquare } from 'lucide-react';

export function HeroSection() {
  const { t } = useTranslation();

  const features = [
    { icon: Globe, text: t('hero.features.countries') },
    { icon: Phone, text: t('hero.features.numbers') },
    { icon: MessageSquare, text: t('hero.features.services') },
    { icon: Headphones, text: t('hero.features.support') },
  ];

  return (
    <section className="bg-hero-gradient min-h-[80vh] flex items-center py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 bg-white/10 rounded-lg px-4 py-3"
                >
                  <feature.icon className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-6 text-lg border-accent-glow"
                >
                  {t('hero.cta')}
                </Button>
              </Link>
              <Link to="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
                >
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  const { t } = useTranslation();

  const messages = [
    { service: 'Twitter', icon: '🐦', code: t('phone.messages.twitter') },
    { service: 'Facebook', icon: '📘', code: t('phone.messages.facebook') },
    { service: 'Instagram', icon: '📷', code: t('phone.messages.instagram') },
    { service: 'Telegram', icon: '✈️', code: t('phone.messages.telegram') },
    { service: 'WhatsApp', icon: '💬', code: t('phone.messages.whatsapp') },
  ];

  return (
    <div className="relative animate-float">
      {/* Phone Frame */}
      <div className="w-72 h-[580px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
        {/* Screen */}
        <div className="w-full h-full bg-muted rounded-[2.5rem] overflow-hidden relative">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl" />
          
          {/* Screen Content */}
          <div className="pt-10 px-4 space-y-3 overflow-hidden">
            {messages.map((msg, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur rounded-xl p-3 animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-lg">
                    {msg.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">{msg.service}</div>
                    <div className="text-white/70 text-xs mt-1">{msg.code}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full -z-10" />
    </div>
  );
}
