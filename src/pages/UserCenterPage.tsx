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
import { Copy, Key, Shield, Users, Calendar, Search, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

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

export default function UserCenterPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';
  
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
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
              <TabsTrigger value="numbers" className="rounded-md px-6">{t('userCenter.numbers')}</TabsTrigger>
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

            {/* Numbers Tab */}
            <TabsContent value="numbers">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t('userCenter.timeRange')}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {t('userCenter.maxRange')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="w-40"
                      />
                      <span>—</span>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="w-40"
                      />
                    </div>
                    <select className="px-3 py-2 border border-border rounded-md bg-background">
                      <option>{t('userCenter.allServices')}</option>
                    </select>
                    <select className="px-3 py-2 border border-border rounded-md bg-background">
                      <option>{t('userCenter.allCountries')}</option>
                    </select>
                    <Button>{t('userCenter.request')}</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {t('userCenter.totalActivations')}: <strong>{orders.length}</strong>
                      </span>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        {t('userCenter.exportCSV')}
                      </Button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={t('userCenter.searchByNumber')}
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="pl-10 w-60"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="py-3 px-2">{t('userCenter.date')} ↓</th>
                          <th className="py-3 px-2">{t('userCenter.country')}</th>
                          <th className="py-3 px-2">{t('userCenter.service')}</th>
                          <th className="py-3 px-2">{t('userCenter.number')}</th>
                          <th className="py-3 px-2">{t('userCenter.smsCode')}</th>
                          <th className="py-3 px-2">{t('userCenter.price')} ↕</th>
                          <th className="py-3 px-2">{t('userCenter.status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="border-b border-border">
                            <td className="py-3 px-2 text-sm">
                              {format(new Date(order.created_at), 'dd.MM.yyyy, HH:mm')}
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-xl">{order.country?.flag}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-xl">{order.service?.icon}</span>
                            </td>
                            <td className="py-3 px-2 font-mono text-sm">{order.phone_number}</td>
                            <td className="py-3 px-2">
                              {order.sms_code ? (
                                <span className="font-mono">{order.sms_code}</span>
                              ) : (
                                <span className="bg-primary text-white px-2 py-1 rounded text-xs">
                                  {t('userCenter.noCode')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2">${order.price?.toFixed(2)}</td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {order.status === 'cancelled' && '● '}{t(`userCenter.status.${order.status}`)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-muted-foreground">
                              {t('userCenter.noOrders')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
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
