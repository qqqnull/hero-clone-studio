import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Check, Users, Gift, TrendingUp, Award } from 'lucide-react';

const benefits = [
  { icon: <Gift className="w-6 h-6" />, titleKey: 'affiliate.benefit1.title', descKey: 'affiliate.benefit1.desc' },
  { icon: <Users className="w-6 h-6" />, titleKey: 'affiliate.benefit2.title', descKey: 'affiliate.benefit2.desc' },
  { icon: <Award className="w-6 h-6" />, titleKey: 'affiliate.benefit3.title', descKey: 'affiliate.benefit3.desc' },
];

const conditions = [
  { step: 1, titleKey: 'affiliate.condition1' },
  { step: 2, titleKey: 'affiliate.condition2' },
  { step: 3, titleKey: 'affiliate.condition3' },
  { step: 4, titleKey: 'affiliate.condition4' },
];

const faqs = [
  { questionKey: 'affiliate.faq1.q', answerKey: 'affiliate.faq1.a' },
  { questionKey: 'affiliate.faq2.q', answerKey: 'affiliate.faq2.a' },
  { questionKey: 'affiliate.faq3.q', answerKey: 'affiliate.faq3.a' },
];

export default function AffiliatePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    software: '',
    website: '',
    review: '',
    contact: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t('affiliate.submitSuccess'),
      description: t('affiliate.submitSuccessDesc'),
    });
    setFormData({ software: '', website: '', review: '', contact: '', description: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="网站联盟计划"
        description="加入HEROSMS网站联盟计划，推广虚拟号码服务赚取佣金。免费注册，高佣金比例，专业支持。"
        keywords="HEROSMS联盟,接码推广,虚拟号码联盟,推广赚钱"
        url="/affiliate"
      />
      <Navbar />
      <AnnouncementBar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('affiliate.title')}
            </h1>
          </div>

          {/* Banner */}
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 mb-12 text-white">
            <h2 className="text-2xl font-bold mb-4">{t('affiliate.bannerTitle')}</h2>
            <p className="text-lg opacity-90">{t('affiliate.bannerDesc')}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Application Form */}
            <Card>
              <CardHeader>
                <CardTitle>{t('affiliate.formTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('affiliate.software')}</label>
                    <Input 
                      value={formData.software}
                      onChange={(e) => setFormData({ ...formData, software: e.target.value })}
                      placeholder={t('affiliate.softwarePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('affiliate.website')}</label>
                    <Input 
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder={t('affiliate.websitePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('affiliate.review')}</label>
                    <Input 
                      value={formData.review}
                      onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                      placeholder={t('affiliate.reviewPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('affiliate.contact')}</label>
                    <Input 
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder={t('affiliate.contactPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('affiliate.description')}</label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('affiliate.descriptionPlaceholder')}
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full">{t('affiliate.submit')}</Button>
                </form>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('affiliate.benefitsTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {benefit.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{t(benefit.titleKey)}</h4>
                        <p className="text-sm text-muted-foreground">{t(benefit.descKey)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('affiliate.conditionsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {conditions.map((condition) => (
                      <div key={condition.step} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {condition.step}
                        </div>
                        <span className="text-foreground">{t(condition.titleKey)}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-6">{t('affiliate.joinNow')}</Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>{t('affiliate.faqTitle')}</CardTitle>
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
