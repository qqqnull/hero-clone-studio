import { useTranslation } from 'react-i18next';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ranks = [
  { level: 1, amount: 10, discount: 5, image: '🥉' },
  { level: 2, amount: 200, discount: 7, image: '🥈' },
  { level: 3, amount: 1000, discount: 15, image: '🥇' },
  { level: 4, amount: 2000, discount: 25, image: '💎' },
  { level: 5, amount: 3000, discount: 40, image: '👑' },
];

const steps = [
  { step: 1, titleKey: 'loyalty.step1.title', descKey: 'loyalty.step1.desc' },
  { step: 2, titleKey: 'loyalty.step2.title', descKey: 'loyalty.step2.desc' },
  { step: 3, titleKey: 'loyalty.step3.title', descKey: 'loyalty.step3.desc' },
];

const faqs = [
  { questionKey: 'loyalty.faq1.q', answerKey: 'loyalty.faq1.a' },
  { questionKey: 'loyalty.faq2.q', answerKey: 'loyalty.faq2.a' },
  { questionKey: 'loyalty.faq3.q', answerKey: 'loyalty.faq3.a' },
];

export default function LoyaltyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <AnnouncementBar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('loyalty.title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('loyalty.subtitle')}
            </p>
          </div>

          {/* Ranks Display */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 mb-12">
            <h2 className="text-xl font-bold text-foreground text-center mb-8">
              {t('loyalty.upgradeTitle')}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {ranks.map((rank) => (
                <div 
                  key={rank.level}
                  className="bg-card border border-border rounded-xl p-6 text-center min-w-[150px]"
                >
                  <div className="text-4xl mb-3">{rank.image}</div>
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('loyalty.level')} {rank.level}
                  </div>
                  <div className="font-bold text-foreground mb-2">
                    ${rank.amount}+
                  </div>
                  <div className="text-primary font-semibold">
                    {t('loyalty.upTo')} {rank.discount}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Table */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>{t('loyalty.tableTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4">{t('loyalty.rankCol')}</th>
                      <th className="text-left py-3 px-4">{t('loyalty.weeklyCol')}</th>
                      <th className="text-left py-3 px-4">{t('loyalty.discountCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranks.map((rank) => (
                      <tr key={rank.level} className="border-b border-border">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{rank.image}</span>
                            <span className="font-medium">{t('loyalty.level')} {rank.level}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">${rank.amount}</td>
                        <td className="py-4 px-4">
                          <span className="text-primary font-semibold">
                            {t('loyalty.upTo')} {rank.discount}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">{t('loyalty.permanent')}</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• {t('loyalty.permanent1')}</li>
                  <li>• {t('loyalty.permanent2')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              {t('loyalty.stepsTitle')}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step) => (
                <div key={step.step} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{t(step.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(step.descKey)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>{t('loyalty.faqTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {t(faq.questionKey)}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {t(faq.answerKey)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
