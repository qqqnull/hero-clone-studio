import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';

export function WhyChooseSection() {
  const { t } = useTranslation();

  const reasons = [
    t('whyChoose.reasons.reason1'),
    t('whyChoose.reasons.reason2'),
    t('whyChoose.reasons.reason3'),
    t('whyChoose.reasons.reason4'),
    t('whyChoose.reasons.reason5'),
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
          {t('whyChoose.title')}
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-start">
          {/* Left - Reasons List */}
          <div className="space-y-4">
            {reasons.map((reason, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-primary mt-1.5">●</span>
                <span className="text-muted-foreground leading-relaxed">{reason}</span>
              </div>
            ))}
          </div>

          {/* Right - Stats */}
          <div className="space-y-8">
            <StatCard value={180} label={t('whyChoose.countries')} sublabel={t('whyChoose.countriesSub')} />
            <StatCard value={700} suffix="+" label="" sublabel={t('whyChoose.servicesSub')} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, suffix = '', label, sublabel }: { value: number; suffix?: string; label: string; sublabel: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateCount();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, value]);

  const animateCount = () => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
  };

  return (
    <div ref={ref} className="bg-muted/30 rounded-2xl p-8 text-center border border-border">
      <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
        {count}{suffix} {label}
      </div>
      <div className="text-muted-foreground text-sm">
        {sublabel}
      </div>
    </div>
  );
}
