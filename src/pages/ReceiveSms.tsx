import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Minus, Plus } from 'lucide-react';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

const services = [
  { name: 'Instagram+Threads', icon: '📸', selected: true },
  { name: 'Amazon', icon: '📦', selected: false },
  { name: 'Google,youtube,Gmail', icon: '🔴', selected: false },
  { name: 'Whatsapp', icon: '💬', selected: false },
  { name: 'facebook', icon: '👤', selected: false },
  { name: 'Twitter', icon: '🐦', selected: false },
  { name: 'Telegram', icon: '✈️', selected: false },
  { name: 'BPJSTK', icon: '🏢', selected: false },
  { name: 'Ticketmaster', icon: '🎫', selected: false },
  { name: 'WeChat', icon: '💚', selected: false },
];

const countries = [
  { name: 'Indonesia', code: '+62', flag: '🇮🇩', count: 34262, priceRange: '$0.0334 - $0.3929' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭', count: 1316, priceRange: '$0.05 - $0.4845' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷', count: 516254, priceRange: '$0.035 - $0.4118' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴', count: 15975, priceRange: '$0.05 - $0.3247' },
  { name: 'Chile', code: '+56', flag: '🇨🇱', count: 1122, priceRange: '$0.035 - $0.1449' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱', count: 5021, priceRange: '$0.06 - $0.4906' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', count: 169904, priceRange: '$0.02 - $0.2353' },
  { name: 'USA', code: '+1', flag: '🇺🇸', count: 207670, priceRange: '$0.077 - $0.9059' },
];

export default function ReceiveSms() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [serviceSearch, setServiceSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedService, setSelectedService] = useState('Instagram+Threads');
  const [quantities, setQuantities] = useState<Record<string, number>>(() => 
    countries.reduce((acc, c) => ({ ...acc, [c.name]: 1 }), {})
  );
  const [activeNumbers, setActiveNumbers] = useState<Array<{ number: string; time: string; price: string }>>([
    { number: '+31 (613) 54 36 78', time: '18:12', price: '$0.06' }
  ]);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const updateQuantity = (country: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [country]: Math.max(1, (prev[country] || 1) + delta)
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <AnnouncementBar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-foreground mb-8">服务</h1>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Services Panel */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="找服务"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>

              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {filteredServices.map((service, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedService(service.name)}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg transition-colors text-left ${
                      selectedService === service.name
                        ? 'bg-primary text-white'
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
                    placeholder="找国家"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <select className="px-4 py-3 border border-border rounded-lg bg-background text-foreground">
                  <option>按受欢迎</option>
                  <option>按价格</option>
                  <option>按数量</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredCountries.map((country, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 px-4 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <span className="font-medium text-foreground">{country.name} {country.code}</span>
                        <span className="text-muted-foreground text-sm ml-2">{country.count.toLocaleString()} 个</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-border rounded-lg">
                        <button 
                          onClick={() => updateQuantity(country.name, -1)}
                          className="p-2 hover:bg-muted/50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm">{quantities[country.name]} 个</span>
                        <button 
                          onClick={() => updateQuantity(country.name, 1)}
                          className="p-2 hover:bg-muted/50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-full transition-colors whitespace-nowrap">
                        {country.priceRange}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My Numbers Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">我的号码</h2>
              <div className="space-y-2">
                {activeNumbers.map((num, index) => (
                  <div 
                    key={index}
                    className="bg-primary text-white rounded-xl px-6 py-4 flex items-center gap-3"
                  >
                    <span className="text-xl">📱</span>
                    <span className="text-xl">🇳🇱</span>
                    <span className="font-medium">{num.number}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">可交付性统计</span>
                <select className="text-sm border-none bg-transparent">
                  <option>下拉</option>
                </select>
              </div>
              
              {activeNumbers.map((num, index) => (
                <div key={index} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📱</span>
                      <span className="text-xl">🇳🇱</span>
                      <span className="font-medium text-foreground">{num.number}</span>
                      <span className="text-primary font-medium">{num.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-muted/50 rounded-lg">🔄</button>
                      <button className="p-2 hover:bg-muted/50 rounded-lg">📋</button>
                      <button className="p-2 hover:bg-muted/50 rounded-lg">❌</button>
                      <button className="p-2 hover:bg-muted/50 rounded-lg">⏰</button>
                      <span className="text-muted-foreground text-sm">激活: {num.time}</span>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center text-muted-foreground text-sm">
                    复制我们为你给你的号码，将其粘贴至服务确认窗口并等待短信
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
