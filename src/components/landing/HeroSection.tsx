import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ServiceIcon } from '@/components/ServiceIcon';
import { RefreshCw, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import phoneMockup from '@/assets/phone-title.webp';

interface Service {
  id: string;
  name: string;
  icon: string;
  sort_order?: number;
}

interface ServicePrice {
  service_id: string;
  total_stock: number;
  min_price: number;
  service: Service;
}

export function HeroSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const advantages = [
    t('hero.advantages.item1'),
    t('hero.advantages.item2'),
    t('hero.advantages.item3'),
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    
    // Single optimized query: get all services with their aggregated prices
    const { data: pricesData } = await supabase
      .from('service_prices')
      .select(`
        service_id,
        price,
        stock,
        service:services!inner(id, name, icon, is_active, sort_order)
      `)
      .eq('is_active', true)
      .eq('service.is_active', true);

    if (pricesData) {
      // Group by service and calculate aggregates
      const serviceMap = new Map<string, ServicePrice>();
      
      for (const item of pricesData) {
        const serviceId = item.service_id;
        const service = item.service as unknown as Service;
        
        if (!serviceId || !service) continue;
        
        if (serviceMap.has(serviceId)) {
          const existing = serviceMap.get(serviceId)!;
          existing.total_stock += (item.stock || 0);
          existing.min_price = Math.min(existing.min_price, item.price);
        } else {
          serviceMap.set(serviceId, {
            service_id: serviceId,
            total_stock: item.stock || 0,
            min_price: item.price,
            service: service
          });
        }
      }
      
      // Sort by sort_order and convert to array
      const servicesWithPrices = Array.from(serviceMap.values())
        .sort((a, b) => (a.service.sort_order || 0) - (b.service.sort_order || 0));
      
      setServices(servicesWithPrices);
    }
    setLoading(false);
  };

  const filteredServices = services.filter(s => 
    s.service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleServiceClick = () => {
    navigate('/receive-sms');
  };

  return (
    <section className="bg-hero-gradient min-h-[600px] flex items-center py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Content */}
          <div className="text-white space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-[48px] font-bold leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>

            {/* Services List Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 max-w-md">
              {/* Search Input */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder={t('serviceSearch.placeholder') || '搜索服务...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-white/20 rounded-lg bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              </div>

              {/* Services List with scroll */}
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="w-5 h-5 animate-spin text-white/70" />
                </div>
              ) : (
                <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {filteredServices.map((item) => (
                    <div 
                      key={item.service_id}
                      onClick={handleServiceClick}
                      className="flex items-center justify-between py-2.5 px-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <ServiceIcon icon={item.service.icon} name={item.service.name} size="md" />
                        <span className="font-medium text-white text-sm">{item.service.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/60 text-xs">
                          {item.total_stock.toLocaleString()}
                        </span>
                        <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                          ${item.min_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredServices.length === 0 && !loading && (
                    <div className="text-center py-4 text-white/50 text-sm">
                      {t('serviceSearch.noResults') || '未找到服务'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/receive-sms">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-6 text-base rounded-full border-2 border-primary"
                >
                  {t('hero.cta')}
                </Button>
              </Link>
              <Link to="/api">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base rounded-full bg-transparent"
                >
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <img 
              src={phoneMockup} 
              alt="SMS Messages" 
              className="w-[320px] md:w-[380px] lg:w-[450px] h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}