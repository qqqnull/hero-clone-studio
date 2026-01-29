import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';

export function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    { value: 180, suffix: '', label: t('stats.countries'), sublabel: t('stats.countriesSub') },
    { value: 700, suffix: '+', label: '', sublabel: t('stats.servicesSub') },
  ];

  return (
    <section className="py-16 bg-hero-gradient">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, suffix, label, sublabel }: { value: number; suffix: string; label: string; sublabel: string }) {
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
    <div ref={ref} className="text-center text-white">
      <div className="text-5xl md:text-6xl font-bold mb-2">
        {count}{suffix} {label}
      </div>
      <div className="text-white/70 text-sm">
        {sublabel}
      </div>
    </div>
  );
}
