import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Zap, Shield, ArrowLeft, HelpCircle, Bitcoin, ExternalLink } from 'lucide-react';

// Chain configuration
const chains = [
  {
    id: 'trc20',
    name: 'TRC20',
    fullName: 'USDT-TRC20',
    network: 'Tether on TRON Network',
    available: true,
    recommended: true,
  },
  {
    id: 'bsc',
    name: 'BSC',
    fullName: 'USDT-BEP20',
    network: 'Binance Smart Chain',
    available: false,
  },
  {
    id: 'eth',
    name: 'ETH',
    fullName: 'USDT-ERC20',
    network: 'Ethereum Network',
    available: false,
  },
  {
    id: 'arb',
    name: 'ARB',
    fullName: 'USDT-Arbitrum',
    network: 'Arbitrum One',
    available: false,
  },
  {
    id: 'sol',
    name: 'SOL',
    fullName: 'USDT-Solana',
    network: 'Solana Network',
    available: false,
  },
];

export default function RechargePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [selectedAmount, setSelectedAmount] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState('trc20');

  const fromReceiveCode = searchParams.get('from') === 'receive-code';

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const amounts = [5, 10, 20, 50, 100];

  const handleRecharge = () => {
    const amount = selectedAmount || Number(customAmount);
    if (amount && amount > 0) {
      if (amount < 5) {
        toast({
          title: t('recharge.minAmount'),
          description: t('recharge.minAmountDesc'),
          variant: 'destructive',
        });
        return;
      }
      const orderId = `UST${Date.now()}`;
      navigate(`/recharge-usdt?amount=${amount}&order_id=${orderId}`);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = value.replace(/[^0-9.]/g, '');
    setCustomAmount(numValue);
    if (numValue) {
      setSelectedAmount(null);
    }
  };

  const handleChainSelect = (chainId: string) => {
    const chain = chains.find(c => c.id === chainId);
    if (chain && !chain.available) {
      toast({
        title: t('recharge.channelUnavailable'),
        description: t('recharge.useTRC20'),
        variant: 'destructive',
      });
      return;
    }
    setSelectedChain(chainId);
  };

  const getDisplayAmount = () => {
    return selectedAmount || Number(customAmount) || 5;
  };

  const selectedChainData = chains.find(c => c.id === selectedChain);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <AnnouncementBar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Header Card */}
          <div className="bg-primary rounded-t-xl p-6 text-primary-foreground">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t('recharge.title')}</h1>
                <p className="text-sm opacity-80">Balance Recharge</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Bitcoin className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{t('recharge.usdtPayment')}</div>
                  <div className="text-xs opacity-70">{t('recharge.multiNetwork')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{t('recharge.instantCredit')}</div>
                  <div className="text-xs opacity-70">{t('recharge.autoConfirm')}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{t('recharge.secure')}</div>
                  <div className="text-xs opacity-70">{t('recharge.guaranteed')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-card border border-border rounded-b-xl">
            {/* Amount Input */}
            <div className="p-6 border-b border-border">
              <label className="block text-sm font-medium text-foreground mb-3">
                {t('recharge.amount')} (USDT)
              </label>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <div className="w-12 flex items-center justify-center bg-muted border-r border-border">
                  <span className="text-muted-foreground font-medium">$</span>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={t('recharge.customAmount')}
                  value={customAmount || selectedAmount?.toString() || ''}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                {amounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleAmountSelect(amount)}
                  >
                    {amount} USDT
                  </Button>
                ))}
              </div>
            </div>

            {/* Network Selection */}
            <div className="p-6 border-b border-border">
              <label className="block text-sm font-medium text-foreground mb-3">
                {t('recharge.selectNetwork')}
              </label>
              <Select value={selectedChain} onValueChange={handleChainSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('recharge.selectNetwork')} />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) => (
                    <SelectItem
                      key={chain.id}
                      value={chain.id}
                      className={!chain.available ? 'opacity-60' : ''}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{chain.name}</span>
                        <span className="text-muted-foreground">- {chain.fullName}</span>
                        {chain.recommended && (
                          <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded">
                            {t('recharge.recommended')}
                          </span>
                        )}
                        {!chain.available && (
                          <span className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive rounded">
                            暂停
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected Chain Details */}
              {selectedChainData && selectedChainData.available && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-lg">
                    ₮
                  </div>
                  <div>
                    <div className="font-medium">{selectedChainData.fullName}</div>
                    <div className="text-xs text-muted-foreground">{selectedChainData.network}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Recharge Notice */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{t('recharge.notice')}</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('recharge.note1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('recharge.note2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-destructive">{t('recharge.note3')}</strong></span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="p-6">
              <Button
                className="w-full h-12 text-lg font-medium"
                onClick={handleRecharge}
                disabled={!selectedAmount && !customAmount}
              >
                <Zap className="h-5 w-5 mr-2" />
                {t('recharge.proceed')} {getDisplayAmount()} USDT
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                点击按钮即表示您同意《<span className="text-primary cursor-pointer">充值服务协议</span>》
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (fromReceiveCode) {
                  navigate('/receive-sms');
                } else {
                  navigate('/');
                }
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {fromReceiveCode ? '返回接码页' : '返回首页'}
            </Button>

            <a
              href="https://t.me/herosms_support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-2 border-destructive text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="font-medium text-sm">充值遇到问题?</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
