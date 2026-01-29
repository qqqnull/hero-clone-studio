import { useTranslation } from 'react-i18next';
import tgexpert from '@/assets/partners/tgexpert.webp';
import googlereger from '@/assets/partners/googlereger.webp';
import instareg from '@/assets/partners/instareg.webp';

export function PartnersSection() {
  const { t } = useTranslation();

  const partners = [
    { image: tgexpert, name: 'TELEGRAM EXPERT' },
    { image: googlereger, name: 'GOOGLEREGER BY DELAR' },
    { image: instareg, name: 'INSTAREG BY DELAR' },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
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
              className="bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col items-center justify-center w-[200px] h-[160px]"
            >
              <img 
                src={partner.image} 
                alt={partner.name}
                className="w-16 h-16 object-contain mb-3"
              />
              <span className="text-xs text-center text-foreground font-bold tracking-wide">
                {partner.name}
              </span>
            </div>
          ))}
          
          {[1, 2].map((index) => (
            <div 
              key={`coming-${index}`}
              className="bg-muted/30 rounded-2xl p-8 border border-border flex flex-col items-center justify-center w-[200px] h-[160px]"
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
