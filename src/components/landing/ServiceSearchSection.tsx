import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useState } from 'react';

const services = [
  { name: 'Yahoo', icon: '🔴', count: 2759280, price: 0.01 },
  { name: 'Onet', icon: '💚', count: 660984, price: 0.01 },
  { name: 'Baidu', icon: '🔵', count: 2093983, price: 0.02 },
  { name: 'Tinder', icon: '🔥', count: 2130732, price: 0.0125 },
  { name: 'Discord', icon: '💜', count: 2261579, price: 0.01 },
  { name: 'Fore Coffee', icon: '☕', count: 31178, price: 0.02 },
  { name: 'Naver', icon: '🟢', count: 2871167, price: 0.035 },
  { name: 'eBay', icon: '🛒', count: 2553580, price: 0.04 },
];

export function ServiceSearchSection() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

            {/* Service List */}
            <div className="space-y-1">
              {filteredServices.map((service, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{service.icon}</span>
                    <span className="font-medium text-foreground">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-sm">
                      {service.count.toLocaleString()} 个
                    </span>
                    <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors">
                      到 ${service.price}
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
