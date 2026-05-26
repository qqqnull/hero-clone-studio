import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ServiceIcon } from '@/components/ServiceIcon';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lock, Clock, AlertTriangle, RefreshCw, Trash2, MessageSquare, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  phone_number: string;
  monthly_fee: number;
  status: 'active' | 'grace' | 'expired' | 'cancelled';
  auto_renew: boolean;
  used_this_period: boolean;
  current_period_end: string;
  grace_period_ends_at: string | null;
  country_id: string | null;
}

interface ServiceOption {
  id: string;
  price: number;
  service: { id: string; name: string; code: string; icon: string | null };
}

export function LongTermNumbersTab() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Receive-SMS dialog state
  const [smsDialogSub, setSmsDialogSub] = useState<Subscription | null>(null);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [consumingId, setConsumingId] = useState<string | null>(null);

  const fetchSubs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_phone_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSubs((data as Subscription[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubs();
  }, [user]);

  const toggleAutoRenew = async (sub: Subscription) => {
    await supabase
      .from('user_phone_subscriptions')
      .update({ auto_renew: !sub.auto_renew })
      .eq('id', sub.id);
    fetchSubs();
  };

  const goRecharge = (phone: string, amount: number) => {
    toast({
      title: t('longTerm.insufficientBalance'),
      description: t('longTerm.rechargeNeedDesc', {
        phone,
        amount: amount.toFixed(2),
      }),
      variant: 'destructive',
    });
    navigate('/recharge');
  };

  const renewNow = async (sub: Subscription) => {
    const balance = Number(profile?.balance ?? 0);
    if (balance < sub.monthly_fee) {
      goRecharge(sub.phone_number, sub.monthly_fee);
      return;
    }

    const { error } = await supabase.rpc('lock_phone_subscription', {
      _phone_number: sub.phone_number,
      _country_id: sub.country_id,
      _monthly_fee: sub.monthly_fee,
    });
    if (error) {
      if (error.message?.includes('INSUFFICIENT_BALANCE')) {
        goRecharge(sub.phone_number, sub.monthly_fee);
        return;
      }
      toast({ title: t('receiveSms.error'), variant: 'destructive' });
      return;
    }
    toast({ title: t('longTerm.renewedToast') });
    await refreshProfile();
    fetchSubs();
  };

  const cancel = async (sub: Subscription) => {
    await supabase
      .from('user_phone_subscriptions')
      .update({ status: 'cancelled', auto_renew: false })
      .eq('id', sub.id);
    toast({ title: t('longTerm.cancelledToast') });
    fetchSubs();
  };

  const openSmsDialog = async (sub: Subscription) => {
    setSmsDialogSub(sub);
    setServiceSearch('');
    if (!sub.country_id) {
      setServices([]);
      return;
    }
    setServicesLoading(true);
    const { data } = await supabase
      .from('service_prices')
      .select('id, price, service:services(id, name, code, icon)')
      .eq('country_id', sub.country_id)
      .eq('is_active', true);
    const list = ((data as any[]) || [])
      .filter((r) => r.service)
      .map((r) => ({ id: r.id, price: Number(r.price), service: r.service })) as ServiceOption[];
    list.sort((a, b) => a.service.name.localeCompare(b.service.name));
    setServices(list);
    setServicesLoading(false);
  };

  const handleConsume = async (opt: ServiceOption) => {
    if (!smsDialogSub || !user) return;
    const balance = Number(profile?.balance ?? 0);
    if (balance < opt.price) {
      setSmsDialogSub(null);
      goRecharge(smsDialogSub.phone_number, opt.price);
      return;
    }
    setConsumingId(opt.id);
    const { error } = await supabase.rpc('consume_phone_subscription', {
      _subscription_id: smsDialogSub.id,
      _service_price: opt.price,
    });
    if (error) {
      setConsumingId(null);
      if (error.message?.includes('INSUFFICIENT_BALANCE')) {
        setSmsDialogSub(null);
        goRecharge(smsDialogSub.phone_number, opt.price);
        return;
      }
      toast({ title: t('receiveSms.error'), variant: 'destructive' });
      return;
    }
    // Record an order so the user can track it
    await supabase.from('orders').insert({
      user_id: user.id,
      service_id: opt.service.id,
      country_id: smsDialogSub.country_id,
      phone_number: smsDialogSub.phone_number,
      price: opt.price,
      status: 'active',
    });
    setConsumingId(null);
    toast({
      title: t('longTerm.smsActivatedTitle'),
      description: t('longTerm.smsActivatedDesc', {
        phone: smsDialogSub.phone_number,
        amount: opt.price.toFixed(2),
      }),
    });
    setSmsDialogSub(null);
    await refreshProfile();
    fetchSubs();
  };

  const filteredServices = services.filter((s) =>
    s.service.name.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">…</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="text-sm leading-relaxed">
              <p className="text-foreground font-semibold mb-1">🎁 {t('longTerm.giftTitle')}</p>
              <p className="text-muted-foreground">{t('longTerm.giftDesc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="text-foreground font-semibold mb-1">{t('longTerm.tabIntroTitle')}</p>
              <p>{t('longTerm.tabIntroDesc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {subs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('longTerm.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {subs.map((sub) => {
            const periodEnd = new Date(sub.current_period_end);
            const graceEnd = sub.grace_period_ends_at ? new Date(sub.grace_period_ends_at) : null;
            const isGrace = sub.status === 'grace';
            const isExpired = sub.status === 'expired' || sub.status === 'cancelled';

            return (
              <Card key={sub.id} className={isGrace ? 'border-yellow-300' : isExpired ? 'opacity-60' : ''}>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center gap-4 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-mono font-semibold text-base">{sub.phone_number}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t('longTerm.monthlyFee')}: <span className="text-primary font-medium">${sub.monthly_fee.toFixed(2)}</span>
                          {sub.used_this_period && (
                            <Badge variant="secondary" className="ml-2 bg-green-50 text-green-700 border-green-200">
                              {t('longTerm.willRenewFree')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {isGrace && graceEnd ? (
                        <div className="flex items-center gap-1.5 text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{t('longTerm.graceEndsAt', { date: format(graceEnd, 'MM/dd HH:mm') })}</span>
                        </div>
                      ) : isExpired ? (
                        <Badge variant="outline">{t(`longTerm.status.${sub.status}`)}</Badge>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{t('longTerm.renewOn', { date: format(periodEnd, 'yyyy/MM/dd') })}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isExpired && (
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Switch
                          checked={sub.auto_renew}
                          onCheckedChange={() => toggleAutoRenew(sub)}
                        />
                        <span>{t('longTerm.autoRenew')}</span>
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={isGrace}
                          onClick={() => openSmsDialog(sub)}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          {t('longTerm.receiveSms')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => renewNow(sub)}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          {t('longTerm.renewNow')}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(sub)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          {t('longTerm.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!smsDialogSub} onOpenChange={(o) => !o && setSmsDialogSub(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {t('longTerm.pickServiceTitle')}
            </DialogTitle>
            <DialogDescription>
              {smsDialogSub && (
                <span>
                  {t('longTerm.pickServiceDesc')}
                  <span className="block mt-1 font-mono text-foreground">{smsDialogSub.phone_number}</span>
                  <span className="block mt-1 text-xs">
                    {t('longTerm.currentBalance')}: <span className="text-primary font-medium">${Number(profile?.balance ?? 0).toFixed(2)}</span>
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('longTerm.searchService')}
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-80 overflow-y-auto -mx-2 px-2 space-y-1.5">
            {servicesLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">…</div>
            ) : filteredServices.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t('longTerm.noServices')}
              </div>
            ) : (
              filteredServices.map((opt) => {
                const balance = Number(profile?.balance ?? 0);
                const lowBalance = balance < opt.price;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleConsume(opt)}
                    disabled={consumingId === opt.id}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ServiceIcon
                        iconUrl={opt.service.icon}
                        name={opt.service.name}
                        size="sm"
                      />
                      <span className="font-medium truncate">{opt.service.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-mono font-semibold ${lowBalance ? 'text-destructive' : 'text-primary'}`}>
                        ${opt.price.toFixed(2)}
                      </span>
                      {lowBalance && (
                        <Badge variant="outline" className="text-[10px] border-destructive text-destructive">
                          {t('longTerm.insufficientBalance')}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
