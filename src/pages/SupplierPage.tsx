import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Shield, Check } from 'lucide-react';

const benefits = [
  { 
    icon: <DollarSign className="w-8 h-8" />, 
    title: '85/15 on all services',
    desc: 'keep 85% of the commission from any sale, with no service restrictions'
  },
  { 
    icon: <TrendingUp className="w-8 h-8" />, 
    title: 'Low withdrawal fees',
    desc: 'cash out your earnings with maximum profit'
  },
  { 
    icon: <Shield className="w-8 h-8" />, 
    title: 'Free registration',
    desc: 'anyone can join, no payments or requirements'
  },
];

export default function SupplierPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    telegram: '',
  });
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('supplier.passwordMismatch'),
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: t('supplier.registerSuccess'),
      description: t('supplier.registerSuccessDesc'),
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="成为供应商"
        description="成为HEROSMS号码供应商，85%高佣金分成，低提现费用，免费注册。出租您的手机号码赚取收入。"
        keywords="号码供应商,出租手机号,虚拟号码供应,HEROSMS供应商"
        url="/supplier"
      />
      <Navbar />
      <AnnouncementBar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#2d2d44] rounded-2xl p-8 mb-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-6">HeroSMS Benefits — Start With Bonuses</h1>
              <div className="grid md:grid-cols-3 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="text-primary mb-3">{benefit.icon}</div>
                    <h3 className="font-bold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-white/70">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle>{t('supplier.registerTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                {step === 1 && (
                  <div className="space-y-6">
                    <p className="text-muted-foreground">{t('supplier.step1Desc')}</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input 
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('supplier.password')}</label>
                        <Input 
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('supplier.confirmPassword')}</label>
                        <Input 
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Telegram ({t('supplier.optional')})</label>
                        <Input 
                          value={formData.telegram}
                          onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                          placeholder="@username"
                        />
                      </div>
                    </div>
                    <Button onClick={() => setStep(2)} className="w-full">
                      {t('supplier.continue')}
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <p className="text-muted-foreground">{t('supplier.step2Desc')}</p>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" id="terms" className="mt-1" required />
                        <label htmlFor="terms" className="text-sm text-muted-foreground">
                          {t('supplier.agreeTerms')}
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                        {t('supplier.back')}
                      </Button>
                      <Button type="submit" className="flex-1">
                        {t('supplier.register')}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Why Become Supplier */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('supplier.whyTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">{t('supplier.why1.title')}</h4>
                      <p className="text-sm text-muted-foreground">{t('supplier.why1.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">{t('supplier.why2.title')}</h4>
                      <p className="text-sm text-muted-foreground">{t('supplier.why2.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">{t('supplier.why3.title')}</h4>
                      <p className="text-sm text-muted-foreground">{t('supplier.why3.desc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{t('supplier.earnTitle')}</h3>
                  <p className="opacity-90 mb-4">{t('supplier.earnDesc')}</p>
                  <div className="text-3xl font-bold">85%</div>
                  <div className="text-sm opacity-80">{t('supplier.commission')}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
