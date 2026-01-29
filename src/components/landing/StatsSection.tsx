import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    { value: 180, suffix: '+', label: t('stats.countries') },
    { value: 700, suffix: '+', label: t('stats.services') },
    { value: 50000, suffix: '+', label: t('stats.users') },
    { value: 1000000, suffix: '+', label: t('stats.messages') },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
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

    return () => clearInterval(timer);
  }, [value]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
        {formatNumber(count)}{suffix}
      </div>
      <div className="text-muted-foreground font-medium">
        {label}
      </div>
    </div>
  );
}
