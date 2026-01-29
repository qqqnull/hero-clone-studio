import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Minus, Plus, Copy, RefreshCw, X, Clock, AlertCircle } from 'lucide-react';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Service {
  id: string;
  name: string;
  icon: string;
  code: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
  phone_code: string;
}

interface ServicePrice {
  id: string;
  service_id: string;
  country_id: string;
  price: number;
  stock: number;
  country: Country;
}

interface ActiveNumber {
  id: string;
  number: string;
  price: number;
  activated_at: string;
  expires_at: string;
  sms_code: string | null;
  sms_content: string | null;
  country: Country;
  service: Service;
}

export default function ReceiveSms() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [services, setServices] = useState<Service[]>([]);
  const [countries, setCountries] = useState<ServicePrice[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeNumbers, setActiveNumbers] = useState<ActiveNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showPhoneForCountry, setShowPhoneForCountry] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    if (user) {
      fetchProfile();
      fetchActiveNumbers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedService) {
      fetchCountriesForService(selectedService.id);
    }
  }, [selectedService]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (data && data.length > 0) {
      setServices(data);
      setSelectedService(data[0]);
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
  };

  const fetchCountriesForService = async (serviceId: string) => {
    const { data } = await supabase
      .from('service_prices')
      .select(`
        *,
        country:countries(*)
      `)
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .gt('stock', 0)
      .order('stock', { ascending: false });
    
    if (data) {
      setCountries(data as ServicePrice[]);
      const initQuantities: Record<string, number> = {};
      data.forEach(item => {
        initQuantities[item.country_id] = 1;
      });
      setQuantities(initQuantities);
    }
  };

  const fetchActiveNumbers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('phone_numbers')
      .select(`
        *,
        country:countries(*),
        service:services(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'in_use')
      .order('activated_at', { ascending: false });
    
    if (data) {
      setActiveNumbers(data as any);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredCountries = countries.filter(c => 
    c.country?.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const updateQuantity = (countryId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [countryId]: Math.max(1, (prev[countryId] || 1) + delta)
    }));
  };

  const handlePriceClick = async (servicePrice: ServicePrice) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check balance first
    if (!profile || profile.balance < servicePrice.price) {
      toast({
        title: t('receiveSms.insufficientBalance'),
        description: t('receiveSms.pleaseRecharge'),
        variant: 'destructive',
      });
      setShowPhoneForCountry(null);
      return;
    }

    // Show phone number for this country
    setShowPhoneForCountry(servicePrice.country_id);
  };

  const handlePurchase = async (servicePrice: ServicePrice) => {
    if (!user || !selectedService) return;

    setPurchaseLoading(servicePrice.country_id);

    // Check balance again
    if (!profile || profile.balance < servicePrice.price) {
      toast({
        title: t('receiveSms.insufficientBalance'),
        description: t('receiveSms.pleaseRecharge'),
        variant: 'destructive',
      });
      setPurchaseLoading(null);
      return;
    }

    try {
      // Get an available phone number
      const { data: phoneNumber, error: phoneError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('country_id', servicePrice.country_id)
        .eq('service_id', selectedService.id)
        .eq('status', 'available')
        .limit(1)
        .single();

      if (phoneError || !phoneNumber) {
        toast({
          title: t('receiveSms.noNumberAvailable'),
          description: t('receiveSms.tryLater'),
          variant: 'destructive',
        });
        setPurchaseLoading(null);
        return;
      }

      // Update phone number status
      await supabase
        .from('phone_numbers')
        .update({
          status: 'in_use',
          user_id: user.id,
          activated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 minutes
        })
        .eq('id', phoneNumber.id);

      // Deduct balance
      await supabase
        .from('profiles')
        .update({
          balance: profile.balance - servicePrice.price,
        })
        .eq('user_id', user.id);

      // Create order
      await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          phone_number_id: phoneNumber.id,
          service_id: selectedService.id,
          country_id: servicePrice.country_id,
          phone_number: phoneNumber.number,
          price: servicePrice.price,
          status: 'active',
        });

      // Create transaction
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: -servicePrice.price,
          balance_after: profile.balance - servicePrice.price,
          status: 'completed',
        });

      toast({
        title: t('receiveSms.numberActivated'),
        description: phoneNumber.number,
      });

      // Refresh data
      fetchProfile();
      fetchActiveNumbers();
      fetchCountriesForService(selectedService.id);
      setShowPhoneForCountry(null);
    } catch (error) {
      toast({
        title: t('receiveSms.error'),
        variant: 'destructive',
      });
    }

    setPurchaseLoading(null);
  };

  const handleCancelNumber = async (numberId: string) => {
    await supabase
      .from('phone_numbers')
      .update({ status: 'available', user_id: null })
      .eq('id', numberId);
    
    fetchActiveNumbers();
    toast({ title: t('receiveSms.numberCancelled') });
  };

  const copyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    toast({ title: t('receiveSms.copied') });
  };

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
          <h1 className="text-2xl font-bold text-foreground mb-8">{t('receiveSms.services')}</h1>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Services Panel */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder={t('receiveSms.findService')}
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-colors text-left ${
                      selectedService?.id === service.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-xl">{service.icon}</span>
                    <span className="font-medium">{service.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Countries Panel */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t('receiveSms.findCountry')}
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <select className="px-4 py-3 border border-border rounded-lg bg-background text-foreground">
                  <option>{t('receiveSms.sortByPopular')}</option>
                  <option>{t('receiveSms.sortByPrice')}</option>
                  <option>{t('receiveSms.sortByStock')}</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredCountries.map((item) => (
                  <div key={item.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.country?.flag}</span>
                        <div>
                          <span className="font-medium text-foreground">
                            {item.country?.name} {item.country?.phone_code}
                          </span>
                          <span className="text-muted-foreground text-sm ml-2">
                            {item.stock.toLocaleString()} {t('receiveSms.available')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-border rounded-lg">
                          <button 
                            onClick={() => updateQuantity(item.country_id, -1)}
                            className="p-2 hover:bg-muted/50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 text-sm">{quantities[item.country_id] || 1}</span>
                          <button 
                            onClick={() => updateQuantity(item.country_id, 1)}
                            className="p-2 hover:bg-muted/50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <Button 
                          onClick={() => handlePriceClick(item)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          disabled={purchaseLoading === item.country_id}
                        >
                          {purchaseLoading === item.country_id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            `$${item.price.toFixed(4)}`
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Phone Number Display - Only shows after clicking price */}
                    {showPhoneForCountry === item.country_id && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        {profile && profile.balance >= item.price ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {t('receiveSms.clickToPurchase')}
                              </span>
                              <span className="text-sm">
                                {t('receiveSms.yourBalance')}: <strong>${profile.balance.toFixed(2)}</strong>
                              </span>
                            </div>
                            <Button 
                              onClick={() => handlePurchase(item)} 
                              className="w-full"
                              disabled={purchaseLoading === item.country_id}
                            >
                              {purchaseLoading === item.country_id ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                              ) : null}
                              {t('receiveSms.confirmPurchase')} - ${item.price.toFixed(4)}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            <div>
                              <p className="font-medium">{t('receiveSms.insufficientBalance')}</p>
                              <p className="text-sm">{t('receiveSms.currentBalance')}: ${profile?.balance?.toFixed(2) || '0.00'}</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="ml-auto"
                              onClick={() => navigate('/recharge')}
                            >
                              {t('receiveSms.recharge')}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {filteredCountries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('receiveSms.noCountriesFound')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* My Numbers Section */}
          {activeNumbers.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">{t('receiveSms.myNumbers')}</h2>
                <div className="space-y-2">
                  {activeNumbers.map((num) => (
                    <div 
                      key={num.id}
                      className="bg-primary text-primary-foreground rounded-xl px-6 py-4 flex items-center gap-3"
                    >
                      <span className="text-xl">{num.service?.icon}</span>
                      <span className="text-xl">{num.country?.flag}</span>
                      <span className="font-medium">{num.number}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">{t('receiveSms.deliveryStats')}</span>
                </div>
                
                {activeNumbers.map((num) => (
                  <div key={num.id} className="bg-card rounded-xl border border-border p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{num.service?.icon}</span>
                        <span className="text-xl">{num.country?.flag}</span>
                        <span className="font-medium text-foreground">{num.number}</span>
                        <span className="text-primary font-medium">${num.price?.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-2 hover:bg-muted/50 rounded-lg"
                          onClick={() => fetchActiveNumbers()}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-muted/50 rounded-lg"
                          onClick={() => copyNumber(num.number)}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-muted/50 rounded-lg text-destructive"
                          onClick={() => handleCancelNumber(num.id)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(num.activated_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    {num.sms_code ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-green-800 font-medium mb-1">{t('receiveSms.codeReceived')}</div>
                        <div className="text-2xl font-bold text-green-700">{num.sms_code}</div>
                        {num.sms_content && (
                          <div className="text-sm text-green-600 mt-2">{num.sms_content}</div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-lg p-4 text-center text-muted-foreground text-sm">
                        {t('receiveSms.waitingForCode')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
