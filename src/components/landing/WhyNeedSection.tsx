import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';

export function WhyNeedSection() {
  const { t } = useTranslation();

  const reasons = [
    t('whyNeed.reasons.reason1'),
    t('whyNeed.reasons.reason2'),
    t('whyNeed.reasons.reason3'),
    t('whyNeed.reasons.reason4'),
    t('whyNeed.reasons.reason5'),
    t('whyNeed.reasons.reason6'),
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
            {t('whyNeed.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('whyNeed.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, index) => (
            <div key={index} className="flex items-start gap-3 p-4">
              <div className="w-6 h-6 flex-shrink-0 mt-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.1276 23.8742L19.3849 7.93461C19.5944 7.57372 19.2972 7.12963 18.8837 7.18588L12.726 8.02283L14.1973 0.298675C14.2469 0.0382844 13.9111 -0.110919 13.7511 0.100347L4.64919 12.1149C4.38407 12.4648 4.6648 12.9624 5.1014 12.9164L11.8902 12.2018L9.66463 23.7006C9.61096 23.978 9.98572 24.1185 10.1276 23.8742Z" fill="#FFDC64"/>
                  <path d="M7.49554 11.2634C7.32552 11.277 7.2126 11.0911 7.30297 10.9465L14.1082 0.0581036C14.007 -0.0220058 13.8476 -0.027162 13.7511 0.100244L4.64919 12.1148C4.38407 12.4647 4.6648 12.9623 5.1014 12.9163L11.8902 12.2017L9.66463 23.7005C9.63463 23.8556 9.73926 23.9648 9.86155 23.9909L13.6753 11.9231C13.854 11.3574 13.403 10.7907 12.8117 10.8381L7.49554 11.2634Z" fill="#FFC850"/>
                </svg>
              </div>
              <span className="text-foreground">{reason}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8 max-w-3xl mx-auto">
          {t('whyNeed.conclusion')}
        </p>
      </div>
    </section>
  );
}
