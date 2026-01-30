import { useTranslation } from 'react-i18next';
import { Search, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ServiceIcon } from '@/components/ServiceIcon';

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

export function ServiceSearchSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [loading, setLoading] = useState(true);

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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
          {t('serviceSearch.title')}
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left - Service Search List */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder={t('serviceSearch.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>

            {/* Service List with scroll */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2">
                {filteredServices.map((item) => (
                  <div 
                    key={item.service_id}
                    onClick={handleServiceClick}
                    className="flex items-center justify-between py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ServiceIcon icon={item.service.icon} name={item.service.name} size="lg" />
                      <span className="font-medium text-foreground">{item.service.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground text-sm">
                        {item.total_stock.toLocaleString()} 个
                      </span>
                      <button className="bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors">
                        到 ${item.min_price.toFixed(2)}
                      </button>
                    </div>
                  </div>
                ))}
                {filteredServices.length === 0 && !loading && (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('serviceSearch.noResults')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right - Features Description */}
          <div className="space-y-8">
            <h3 className="text-xl font-bold text-foreground">
              {t('serviceSearch.perfectTitle')}
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {t('serviceSearch.software.title')}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {t('serviceSearch.software.description')}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {t('serviceSearch.numbers.title')}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {t('serviceSearch.numbers.description')}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {t('serviceSearch.discount.title')}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {t('serviceSearch.discount.description')}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {t('serviceSearch.simple.title')}
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {t('serviceSearch.simple.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
