import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Lock, Clock, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
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

export function LongTermNumbersTab() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

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

  const renewNow = async (sub: Subscription) => {
    // 前置余额检查：不足则提示并跳转充值页
    const balance = Number(profile?.balance ?? 0);
    if (balance < sub.monthly_fee) {
      toast({
        title: t('longTerm.insufficientBalance'),
        description: t('longTerm.pleaseRecharge'),
        variant: 'destructive',
      });
      navigate('/recharge');
      return;
    }

    const { error } = await supabase.rpc('lock_phone_subscription', {
      _phone_number: sub.phone_number,
      _country_id: sub.country_id,
      _monthly_fee: sub.monthly_fee,
    });
    if (error) {
      if (error.message?.includes('INSUFFICIENT_BALANCE')) {
        toast({
          title: t('longTerm.insufficientBalance'),
          description: t('longTerm.pleaseRecharge'),
          variant: 'destructive',
        });
        navigate('/recharge');
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
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => renewNow(sub)}>
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
    </div>
  );
}
