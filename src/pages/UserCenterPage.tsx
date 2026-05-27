import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, Key, Shield, Users, Calendar, Search, Download, RefreshCw, Lock, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { LongTermNumbersTab } from '@/components/LongTermNumbersTab';

interface Order {
  id: string;
  phone_number: string;
  sms_code: string | null;
  price: number;
  status: string;
  created_at: string;
  service: { name: string; icon: string } | null;
  country: { name: string; flag: string } | null;
}

interface RechargeTx {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string | null;
  payment_method: string | null;
  status: string;
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function UserCenterPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';
  
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recharges, setRecharges] = useState<RechargeTx[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [orderSearch, setOrderSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchOrders();
    fetchRecharges();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
    setLoading(false);
  };

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        service:services(name, icon),
        country:countries(name, flag)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders(data || []);
  };

  const fetchRecharges = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('transactions')
      .select('id, order_id, amount, currency, payment_method, status, tx_hash, created_at, completed_at')
      .eq('user_id', user.id)
      .eq('type', 'recharge')
      .order('created_at', { ascending: false })
      .limit(100);
    setRecharges((data as RechargeTx[]) || []);
  };

  const generateApiKey = () => {
    const key = 'sk_' + Array.from({ length: 32 }, () => 

      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('');
    setApiKey(key);
    toast({
      title: t('userCenter.apiKeyGenerated'),
      description: t('userCenter.apiKeyGeneratedDesc'),
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('userCenter.copied'),
    });
  };

  const filteredOrders = orders.filter(order => 
    order.phone_number?.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const userId = profile?.id?.slice(0, 8) || '---';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <AnnouncementBar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-lg">
              <TabsTrigger value="profile" className="rounded-md px-6">{t('userCenter.profile')}</TabsTrigger>
              <TabsTrigger value="numbers" className="rounded-md px-6 gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                {t('longTerm.tabTitle')}
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-md px-6">{t('userCenter.security')}</TabsTrigger>
              <TabsTrigger value="affiliate" className="rounded-md px-6">{t('userCenter.affiliate')}</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">{t('userCenter.balance')}</div>
                    <div className="text-3xl font-bold text-primary">${profile?.balance?.toFixed(2) || '0.00'}</div>
                    <Button className="w-full mt-4" onClick={() => navigate('/recharge')}>
                      {t('userCenter.recharge')}
                    </Button>
                    <Button variant="outline" className="w-full mt-2">
                      {t('userCenter.rechargeHistory')}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">ID</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{userId}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(userId)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-2">Email</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{user?.email}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(user?.email || '')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Numbers Tab → Long-Term Numbers */}
            <TabsContent value="numbers">
              <LongTermNumbersTab />
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      {t('userCenter.apiKey')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t('userCenter.apiKeyDesc')}
                    </p>
                    {apiKey && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <code className="flex-1 text-sm break-all">{apiKey}</code>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(apiKey)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <Button onClick={generateApiKey}>
                      {t('userCenter.generateApiKey')}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      {t('userCenter.password')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t('userCenter.passwordDesc')}
                    </p>
                    <Button variant="outline">
                      {t('userCenter.changePassword')}
                    </Button>

                    <div className="pt-4 border-t border-border">
                      <h4 className="font-semibold mb-2">{t('userCenter.twoFactor')}</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('userCenter.twoFactorDesc')}
                      </p>
                      <Button variant="outline">
                        {t('userCenter.setup2FA')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Affiliate Tab */}
            <TabsContent value="affiliate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t('userCenter.affiliateProgram')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {t('userCenter.affiliateDesc')}
                  </p>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">{t('userCenter.referralLink')}</div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm">https://herosms.com/ref/{userId}</code>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`https://herosms.com/ref/${userId}`)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">0</div>
                      <div className="text-sm text-muted-foreground">{t('userCenter.referrals')}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">$0.00</div>
                      <div className="text-sm text-muted-foreground">{t('userCenter.earnings')}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">5%</div>
                      <div className="text-sm text-muted-foreground">{t('userCenter.commissionRate')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
