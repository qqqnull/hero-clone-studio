import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Wallet, Link, Save, Loader2, ArrowLeft, Globe, Package, Users } from 'lucide-react';

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!data) {
        toast({
          title: '权限不足',
          description: '您没有访问管理后台的权限',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    };

    checkAdmin();
  }, [user, navigate, toast]);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!isAdmin) return;

      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .order('key');

        if (error) throw error;
        setSettings(data || []);
      } catch (err) {
        console.error('Error fetching settings:', err);
        toast({
          title: '加载失败',
          description: '无法加载系统设置',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAdmin, toast]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev =>
      prev.map(s => (s.key === key ? { ...s, value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const setting of settings) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: setting.value })
          .eq('key', setting.key);

        if (error) throw error;
      }

      toast({
        title: '保存成功',
        description: '系统设置已更新',
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: '保存失败',
        description: '无法保存系统设置',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getSettingIcon = (key: string) => {
    if (key.includes('address')) return <Wallet className="h-5 w-5" />;
    if (key.includes('link') || key.includes('url')) return <Globe className="h-5 w-5" />;
    return <Settings className="h-5 w-5" />;
  };

  const getSettingLabel = (key: string) => {
    const labels: Record<string, string> = {
      'payment_platform_id': '支付网关商户标识 (platform)',
      'payment_gateway_url': '支付网关域名',
      'support_link': '客服链接',
    };
    return labels[key] || key;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">系统设置</h1>
              <p className="text-muted-foreground">管理支付和系统配置</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    快捷管理
                  </CardTitle>
                  <CardDescription>
                    管理平台商品和服务
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    用户管理与充值记录
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/services')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    商品服务管理
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Gateway Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    支付网关设置
                  </CardTitle>
                  <CardDescription>
                    配置跳转到 payusdt.shop 的商户标识 (platform 参数)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings
                    .filter(s => ['payment_gateway_url', 'payment_platform_id'].includes(s.key))
                    .sort((a, b) => (a.key === 'payment_gateway_url' ? -1 : 1))
                    .map((setting) => (
                      <div key={setting.key}>
                        <label className="block text-sm font-medium mb-2">
                          {getSettingLabel(setting.key)}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-muted rounded-lg">
                            {getSettingIcon(setting.key)}
                          </div>
                          <Input
                            value={setting.value}
                            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                            placeholder={setting.key === 'payment_gateway_url' ? 'https://payusdt.buzz/' : 'herosms'}
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {setting.key === 'payment_gateway_url'
                            ? '支付页面跳转的域名 (含 https:// 与结尾 /)'
                            : '用户付款时跳转 {域名}/?platform={此值}&order_id=...&amount=...'}
                        </p>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Other Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    其他设置
                  </CardTitle>
                  <CardDescription>
                    配置客服链接等系统参数
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings
                    .filter(s => ['support_link'].includes(s.key))
                    .map((setting) => (
                      <div key={setting.key}>
                        <label className="block text-sm font-medium mb-2">
                          {getSettingLabel(setting.key)}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-muted rounded-lg">
                            {getSettingIcon(setting.key)}
                          </div>
                          <Input
                            value={setting.value}
                            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                            placeholder={setting.description || ''}
                            className="flex-1"
                          />
                        </div>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button
                className="w-full h-12"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存设置
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
