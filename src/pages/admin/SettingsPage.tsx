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
          title: 'Permission denied',
          description: 'You don't have permission to access the admin panel',
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
          title: 'Load failed',
          description: 'Failed to load system settings',
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
        title: 'Saved successfully',
        description: 'System settings updated',
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: 'Save failed',
        description: 'Failed to save system settings',
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
      'payment_platform_id': 'Payment gateway merchant ID (platform)',
      'payment_gateway_url': 'Payment gateway domain',
      'support_link': 'Support Link',
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
              <h1 className="text-2xl font-bold">System Settings</h1>
              <p className="text-muted-foreground">Manage payment and system configuration</p>
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
                    Quick Management
                  </CardTitle>
                  <CardDescription>
                    Manage platform services and products
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    User management and recharge records
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/services')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Service Management
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Gateway Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Payment Gateway Settings
                  </CardTitle>
                  <CardDescription>
                    Merchant identifier (platform parameter) used when redirecting to payusdt.shop
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
                            ? 'Domain used for payment page redirect (include https:// and trailing /)'
                            : 'Used when the user is redirected to pay {Domain}/?platform={Current value}&order_id=...&amount=...'}
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
                    Other Settings
                  </CardTitle>
                  <CardDescription>
                    Configure support link and other system parameters
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
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
