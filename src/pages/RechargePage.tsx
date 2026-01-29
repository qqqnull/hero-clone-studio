import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Zap, Shield, Bitcoin, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react';

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
];

// Demo wallet address - in production this should come from backend
const WALLET_ADDRESS = 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export default function RechargePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState('trc20');
  const [showPayment, setShowPayment] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const amounts = [5, 10, 20, 50, 100];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = value.replace(/[^0-9.]/g, '');
    setCustomAmount(numValue);
    if (numValue) {
      setSelectedAmount(0);
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

  const handleRecharge = () => {
    const amount = getDisplayAmount();
    if (amount < 5) {
      toast({
        title: t('recharge.minAmount'),
        description: t('recharge.minAmountDesc'),
        variant: 'destructive',
      });
      return;
    }
    setShowPayment(true);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(WALLET_ADDRESS);
    setCopied(true);
    toast({ title: t('recharge.addressCopied') });
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedChainData = chains.find(c => c.id === selectedChain);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <AnnouncementBar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          {!showPayment ? (
            <>
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

              {/* Main Form */}
              <Card className="rounded-t-none">
                <CardContent className="p-6 space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      {t('recharge.amount')} (USDT)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {amounts.map(amount => (
                        <button
                          key={amount}
                          onClick={() => handleAmountSelect(amount)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            selectedAmount === amount
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="text"
                      placeholder={t('recharge.customAmount')}
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Chain Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      {t('recharge.selectNetwork')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {chains.map(chain => (
                        <button
                          key={chain.id}
                          onClick={() => handleChainSelect(chain.id)}
                          className={`p-3 rounded-lg border text-center transition-colors relative ${
                            selectedChain === chain.id
                              ? 'bg-primary text-primary-foreground border-primary'
                              : chain.available
                                ? 'border-border hover:border-primary'
                                : 'border-border opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {chain.recommended && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                              {t('recharge.recommended')}
                            </span>
                          )}
                          <div className="font-medium">{chain.name}</div>
                          <div className="text-xs opacity-70">{chain.network}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">{t('recharge.payAmount')}</span>
                      <span className="font-bold">${getDisplayAmount()} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('recharge.network')}</span>
                      <span>{selectedChainData?.fullName}</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleRecharge}>
                    {t('recharge.proceed')}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Payment Details */
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bitcoin className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{t('recharge.paymentDetails')}</h2>
                  <p className="text-muted-foreground">
                    {t('recharge.sendExact')} <strong>${getDisplayAmount()} USDT</strong>
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      {t('recharge.networkWarning')} <strong>{selectedChainData?.fullName}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('recharge.walletAddress')}
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <code className="flex-1 text-sm break-all">{WALLET_ADDRESS}</code>
                    <Button variant="ghost" size="icon" onClick={copyAddress}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• {t('recharge.note1')}</p>
                  <p>• {t('recharge.note2')}</p>
                  <p>• {t('recharge.note3')}</p>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>
                    {t('recharge.back')}
                  </Button>
                  <Button className="flex-1" onClick={() => navigate('/user-center?tab=profile')}>
                    {t('recharge.checkBalance')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
