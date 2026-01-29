import { useTranslation } from 'react-i18next';

export function GuideSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {t('guide.title')}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('guide.description')}
          </p>
        </div>
      </div>
    </section>
  );
}
