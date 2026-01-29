import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Minus, Plus, Copy, RefreshCw, X, Clock, AlertCircle, Menu, ChevronLeft } from 'lucide-react';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
  const isMobile = useIsMobile();
  
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
  const [sortBy, setSortBy] = useState('popular');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      .maybeSingle();
    setProfile(data);
  };

  const fetchCountriesForService = async (serviceId: string) => {
    let query = supabase
      .from('service_prices')
      .select(`
        *,
        country:countries(*)
      `)
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .gt('stock', 0);
    
    if (sortBy === 'popular') {
      query = query.order('stock', { ascending: false });
    } else if (sortBy === 'price') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'stock') {
      query = query.order('stock', { ascending: false });
    }
    
    const { data } = await query;
    
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

    if (!profile || profile.balance < servicePrice.price) {
      toast({
        title: t('receiveSms.insufficientBalance'),
        description: t('receiveSms.pleaseRecharge'),
        variant: 'destructive',
      });
      setShowPhoneForCountry(null);
      return;
    }

    setShowPhoneForCountry(servicePrice.country_id);
  };

  const handlePurchase = async (servicePrice: ServicePrice) => {
    if (!user || !selectedService) return;

    setPurchaseLoading(servicePrice.country_id);

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
      const { data: phoneNumber, error: phoneError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('country_id', servicePrice.country_id)
        .eq('service_id', selectedService.id)
        .eq('status', 'available')
        .limit(1)
        .maybeSingle();

      if (phoneError || !phoneNumber) {
        toast({
          title: t('receiveSms.noNumberAvailable'),
          description: t('receiveSms.tryLater'),
          variant: 'destructive',
        });
        setPurchaseLoading(null);
        return;
      }

      await supabase
        .from('phone_numbers')
        .update({
          status: 'in_use',
          user_id: user.id,
          activated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        })
        .eq('id', phoneNumber.id);

      await supabase
        .from('profiles')
        .update({
          balance: profile.balance - servicePrice.price,
        })
        .eq('user_id', user.id);

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

  const getPriceRange = (price: number) => {
    const minPrice = price;
    const maxPrice = price * (1 + Math.random() * 2);
    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(4)}`;
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Service List Component (reused in both desktop and mobile)
  const ServicesList = () => (
    <>
      {/* Search Input */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder={t('receiveSms.findService')}
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg bg-white text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Services List */}
      <div className="max-h-[calc(100vh-200px)] lg:max-h-[500px] overflow-y-auto">
        {filteredServices.map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className={`w-full flex items-center gap-3 py-3 px-4 transition-all text-left border-b border-gray-50 last:border-b-0 ${
              selectedService?.id === service.id
                ? 'bg-primary text-white'
                : 'hover:bg-gray-50 text-foreground'
            }`}
          >
            <span className="text-lg flex-shrink-0">{service.icon}</span>
            <span className="font-medium text-sm truncate">{service.name}</span>
          </button>
        ))}
        {filteredServices.length === 0 && (
          <div className="p-4 text-center text-gray-400 text-sm">
            {t('receiveSms.noServicesFound')}
          </div>
        )}
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9ff]">
      <Navbar />
      <AnnouncementBar />
      
      <main className="flex-1 py-4 lg:py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Page Title with Mobile Toggle */}
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            {isMobile && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <div className="bg-white h-full">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <h2 className="font-semibold">{t('receiveSms.services')}</h2>
                    </div>
                    <ServicesList />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">{t('receiveSms.services')}</h1>
            {selectedService && isMobile && (
              <div className="flex items-center gap-2 ml-auto bg-primary/10 px-3 py-1.5 rounded-full">
                <span className="text-sm">{selectedService.icon}</span>
                <span className="text-sm font-medium text-primary">{selectedService.name}</span>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-[320px_1fr] gap-4 lg:gap-6 mb-8 lg:mb-12">
            {/* Services Panel - Desktop Only */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <ServicesList />
            </div>

            {/* Countries Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Search and Sort Row */}
              <div className="p-3 lg:p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder={t('receiveSms.findCountry')}
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg bg-white text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-foreground text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="popular">{t('receiveSms.sortByPopular')}</option>
                  <option value="price">{t('receiveSms.sortByPrice')}</option>
                  <option value="stock">{t('receiveSms.sortByStock')}</option>
                </select>
              </div>

              {/* Countries List */}
              <div className="max-h-[400px] lg:max-h-[500px] overflow-y-auto">
                {filteredCountries.map((item) => (
                  <div key={item.id} className="border-b border-gray-50 last:border-b-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 lg:px-4 py-3 hover:bg-gray-50/50 transition-colors gap-3 sm:gap-0">
                      {/* Country Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl flex-shrink-0">{item.country?.flag}</span>
                        <div className="min-w-0">
                          <span className="font-medium text-foreground text-sm block truncate">
                            {item.country?.name}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {item.country?.phone_code} · {item.stock.toLocaleString()}个
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                          <button 
                            onClick={() => updateQuantity(item.country_id, -1)}
                            className="p-2 hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 sm:px-3 text-sm text-foreground font-medium min-w-[36px] text-center">
                            {quantities[item.country_id] || 1}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.country_id, 1)}
                            className="p-2 hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price Button */}
                        <button 
                          onClick={() => handlePriceClick(item)}
                          disabled={purchaseLoading === item.country_id}
                          className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow min-w-[100px] sm:min-w-[140px] disabled:opacity-50"
                        >
                          {purchaseLoading === item.country_id ? (
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                          ) : (
                            getPriceRange(item.price)
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Purchase Section */}
                    {showPhoneForCountry === item.country_id && (
                      <div className="px-3 lg:px-4 pb-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          {profile && profile.balance >= item.price ? (
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
                                <span className="text-gray-600">
                                  {t('receiveSms.clickToPurchase')}
                                </span>
                                <span className="text-foreground">
                                  {t('receiveSms.yourBalance')}: <strong className="text-primary">${profile.balance.toFixed(2)}</strong>
                                </span>
                              </div>
                              <Button 
                                onClick={() => handlePurchase(item)} 
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={purchaseLoading === item.country_id}
                              >
                                {purchaseLoading === item.country_id && (
                                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                )}
                                {t('receiveSms.confirmPurchase')} - ${item.price.toFixed(4)}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-destructive text-sm">{t('receiveSms.insufficientBalance')}</p>
                                <p className="text-xs text-gray-500">{t('receiveSms.currentBalance')}: ${profile?.balance?.toFixed(2) || '0.00'}</p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate('/recharge')}
                                className="flex-shrink-0"
                              >
                                {t('receiveSms.recharge')}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {filteredCountries.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    {t('receiveSms.noCountriesFound')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* My Numbers Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg lg:text-xl font-bold text-foreground">{t('receiveSms.myNumbers')}</h2>
              <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none">
                <option>{t('receiveSms.deliveryStats')}</option>
              </select>
            </div>
            
            {activeNumbers.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Active Numbers List */}
                <div className="space-y-2">
                  {activeNumbers.map((num) => (
                    <div 
                      key={num.id}
                      className="bg-primary text-white rounded-xl px-4 lg:px-5 py-3 lg:py-3.5 flex items-center gap-2 lg:gap-3"
                    >
                      <span className="text-base lg:text-lg">{num.service?.icon}</span>
                      <span className="text-base lg:text-lg">{num.country?.flag}</span>
                      <span className="font-medium text-sm lg:text-base">{num.number}</span>
                    </div>
                  ))}
                </div>

                {/* SMS Display */}
                <div className="space-y-4">
                  {activeNumbers.map((num) => (
                    <div key={num.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 lg:p-4">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base lg:text-lg">{num.service?.icon}</span>
                          <span className="text-base lg:text-lg">{num.country?.flag}</span>
                          <span className="font-medium text-foreground text-xs lg:text-sm">{num.number}</span>
                          <span className="text-primary font-medium text-xs lg:text-sm">${num.price?.toFixed(4)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                            onClick={() => fetchActiveNumbers()}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                            onClick={() => copyNumber(num.number)}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-destructive transition-colors"
                            onClick={() => handleCancelNumber(num.id)}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-1 text-gray-400 text-xs ml-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(num.activated_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      {num.sms_code ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-green-700 font-medium text-sm mb-1">{t('receiveSms.codeReceived')}</div>
                          <div className="text-xl lg:text-2xl font-bold text-green-600">{num.sms_code}</div>
                          {num.sms_content && (
                            <div className="text-sm text-green-600 mt-1">{num.sms_content}</div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-400 text-sm">
                          {t('receiveSms.waitingForCode')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 lg:p-12">
                <p className="text-center text-primary">
                  {t('receiveSms.noActiveNumbers')}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
