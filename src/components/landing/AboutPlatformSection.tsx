import { useTranslation } from 'react-i18next';

export function AboutPlatformSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('aboutPlatform.title')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('aboutPlatform.description')}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t('aboutPlatform.description2')}
          </p>
        </div>
      </div>
    </section>
  );
}
