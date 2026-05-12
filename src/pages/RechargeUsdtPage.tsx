import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, Check, DollarSign, Shield, Zap, ExternalLink, ArrowLeft, HelpCircle, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const generatePaymentOrderId = () => `USTHERO${Date.now()}`;

const PAYMENT_GATEWAY = 'https://payusdt.shop/';
const DEFAULT_PLATFORM = 'herosms';

export default function RechargeUsdtPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [platform, setPlatform] = useState<string>(DEFAULT_PLATFORM);
  const [supportLink, setSupportLink] = useState<string>('https://t.me/herosms_support');
  const hasCreatedOrder = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const amount = Number(searchParams.get('amount') || '0');
  const orderIdParam = searchParams.get('order_id');

  const COUNTDOWN_SECONDS = 30 * 60;
  const [timeLeft, setTimeLeft] = useState<number>(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!paymentOrderId) return;
    const storageKey = `recharge_deadline_${paymentOrderId}`;
    let deadline = Number(localStorage.getItem(storageKey) || 0);
    if (!deadline || deadline < Date.now()) {
      deadline = Date.now() + COUNTDOWN_SECONDS * 1000;
      localStorage.setItem(storageKey, String(deadline));
    }
    const tick = () => {
      const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [paymentOrderId]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };
  const isExpired = timeLeft <= 0;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!amount || amount <= 0) {
      navigate('/recharge');
    }
  }, [user, amount, navigate]);

  // Load platform id + support link from settings
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('key,value')
          .in('key', ['payment_platform_id', 'support_link']);
        data?.forEach((row) => {
          if (row.key === 'payment_platform_id' && row.value) setPlatform(row.value);
          if (row.key === 'support_link' && row.value) setSupportLink(row.value);
        });
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    })();
  }, []);

  // Create pending transaction once
  useEffect(() => {
    if (!user || !amount || hasCreatedOrder.current) return;
    hasCreatedOrder.current = true;

    const orderId = orderIdParam || generatePaymentOrderId();
    setPaymentOrderId(orderId);

    (async () => {
      try {
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('transactions').insert({
            user_id: user.id,
            order_id: orderId,
            type: 'recharge',
            amount,
            currency: 'USDT',
            payment_method: 'USDT-TRC20',
            status: 'pending',
            note: `通过 payusdt.shop 充值 ${amount} USDT`,
          });
        }
      } catch (e) {
        console.error('Failed to create transaction record', e);
      }
    })();
  }, [user, amount, orderIdParam]);

  const handleCopyOrderId = () => {
    if (!paymentOrderId) return;
    navigator.clipboard.writeText(paymentOrderId);
    setCopiedOrderId(true);
    toast({ title: '已复制订单号' });
    setTimeout(() => setCopiedOrderId(false), 1500);
  };

  const buildPaymentUrl = () => {
    const params = new URLSearchParams({
      platform,
      order_id: paymentOrderId,
      amount: amount.toFixed(2),
    });
    return `${PAYMENT_GATEWAY}?${params.toString()}`;
  };

  const handleProceedPayment = () => {
    if (!paymentOrderId) return;
    setIsProcessing(true);
    window.location.href = buildPaymentUrl();
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
              <div className="w-12 h-12 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">订单确认</h1>
                <p className="text-sm opacity-80">Confirm Your Order</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-b-xl">
            {/* Order Info */}
            <div className="p-6 border-b border-border space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">订单编号</div>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="flex-1 font-mono text-sm break-all">
                    {paymentOrderId || '生成中...'}
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleCopyOrderId} disabled={!paymentOrderId}>
                    {copiedOrderId ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">支付金额</div>
                  <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                    <DollarSign className="h-5 w-5" />
                    {amount.toFixed(2)}
                    <span className="text-sm text-muted-foreground ml-1">USDT</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">订单状态</div>
                  <div className="text-base font-medium text-yellow-600">{isExpired ? '已过期' : '待支付'}</div>
                </div>
              </div>

              <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${isExpired ? 'bg-destructive/10 border-destructive/30' : 'bg-primary/5 border-primary/20'}`}>
                <div className="flex items-center gap-2">
                  <Clock className={`h-5 w-5 ${isExpired ? 'text-destructive' : 'text-primary'}`} />
                  <span className="text-sm text-muted-foreground">支付剩余时间</span>
                </div>
                <span className={`font-mono text-xl font-bold tabular-nums ${isExpired ? 'text-destructive' : 'text-primary'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">商户标识</div>
                <div className="text-base font-medium">{platform}</div>
              </div>
            </div>

            {/* Notice */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">支付须知</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>点击下方按钮将跳转至支付网关 payusdt.shop 完成 USDT 支付</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>请勿关闭页面，支付完成后系统将自动到账</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>请使用同一订单号完成支付，避免重复下单</span>
                </li>
              </ul>
            </div>

            {/* Action */}
            <div className="p-6">
              <Button
                className="w-full h-12 text-lg font-medium"
                onClick={handleProceedPayment}
                disabled={!paymentOrderId || isProcessing || isExpired}
              >
                <Zap className="h-5 w-5 mr-2" />
                {isExpired ? '订单已过期，请重新下单' : isProcessing ? '正在跳转...' : `前往支付 ${amount.toFixed(2)} USDT`}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                跳转后将由 payusdt.shop 处理您的支付
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/recharge')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回充值
            </Button>
            <a
              href={supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-2 border-destructive text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="font-medium text-sm">遇到问题?</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
