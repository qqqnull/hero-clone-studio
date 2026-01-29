import { useTranslation } from 'react-i18next';

export function AboutPlatformSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              {t('aboutPlatform.title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('aboutPlatform.description')}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {t('aboutPlatform.whyChoose.title')}
            </h3>
            <ul className="space-y-3">
              {(t('aboutPlatform.whyChoose.items', { returnObjects: true }) as string[]).map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
