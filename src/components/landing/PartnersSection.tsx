import { useTranslation } from 'react-i18next';
import tgexpert from '@/assets/partners/tgexpert.webp';
import googlereger from '@/assets/partners/googlereger.webp';
import instareg from '@/assets/partners/instareg.webp';

export function PartnersSection() {
  const { t } = useTranslation();

  const partners = [
    { image: tgexpert, name: 'Telegram Expert' },
    { image: googlereger, name: 'Googlereger by Delar' },
    { image: instareg, name: 'Instareg by Delar' },
  ];

  const comingSoon = [
    t('partners.comingSoon'),
    t('partners.comingSoon'),
    t('partners.comingSoon'),
    t('partners.comingSoon'),
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            {t('partners.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('partners.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {partners.map((partner, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col items-center w-[180px]"
            >
              <img 
                src={partner.image} 
                alt={partner.name}
                className="w-24 h-24 object-contain mb-4"
              />
              <span className="text-sm text-center text-foreground font-medium">
                {partner.name}
              </span>
            </div>
          ))}
          
          {comingSoon.map((_, index) => (
            <div 
              key={`coming-${index}`}
              className="bg-muted/50 rounded-2xl p-6 border border-border flex flex-col items-center justify-center w-[180px] h-[180px]"
            >
              <span className="text-sm text-muted-foreground">
                {t('partners.comingSoon')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
