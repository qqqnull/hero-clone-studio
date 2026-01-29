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
import { 
  Search, Plus, Edit2, Trash2, Save, X, Loader2, ArrowLeft, 
  Package, RefreshCw, ChevronDown, ChevronUp 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

interface Service {
  id: string;
  name: string;
  code: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminServicesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  // Check admin
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
        .maybeSingle();

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

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      toast({
        title: '加载失败',
        description: '无法加载服务列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchServices();
    }
  }, [isAdmin]);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingService(null);
    setFormData({
      name: '',
      code: '',
      icon: '📱',
      sort_order: services.length + 1,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      code: service.code,
      icon: service.icon,
      sort_order: service.sort_order,
      is_active: service.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast({
        title: '验证失败',
        description: '请填写服务名称和代码',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        // Update
        const { error } = await supabase
          .from('services')
          .update({
            name: formData.name,
            code: formData.code,
            icon: formData.icon,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          })
          .eq('id', editingService.id);

        if (error) throw error;
        toast({ title: '更新成功', description: '服务已更新' });
      } else {
        // Create
        const { error } = await supabase
          .from('services')
          .insert({
            name: formData.name,
            code: formData.code,
            icon: formData.icon,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast({ title: '创建成功', description: '新服务已添加' });
      }

      setDialogOpen(false);
      fetchServices();
    } catch (err) {
      console.error('Error saving service:', err);
      toast({
        title: '保存失败',
        description: '无法保存服务',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      
      setServices(prev => 
        prev.map(s => s.id === service.id ? { ...s, is_active: !s.is_active } : s)
      );
      toast({ 
        title: service.is_active ? '已禁用' : '已启用',
        description: `服务 ${service.name} 已${service.is_active ? '禁用' : '启用'}`,
      });
    } catch (err) {
      console.error('Error toggling service:', err);
      toast({
        title: '操作失败',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;

    try {
      // First delete related service_prices
      await supabase
        .from('service_prices')
        .delete()
        .eq('service_id', deletingService.id);

      // Then delete the service
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', deletingService.id);

      if (error) throw error;

      toast({ title: '删除成功', description: `服务 ${deletingService.name} 已删除` });
      setDeleteDialogOpen(false);
      setDeletingService(null);
      fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      toast({
        title: '删除失败',
        description: '无法删除服务',
        variant: 'destructive',
      });
    }
  };

  const commonIcons = ['📱', '💬', '📷', '👤', '𝕏', '🎵', '🎮', '💚', '🟢', '👻', '🟣', '🔵', '💛', '💙', '🔥', '🐝', '💜', '❤️', '💕', '💖', '🔴', '🍎', '💻', '📦', '🟠', '🛒', '⚫', '🩷', '🏠', '🤖', '🧠', '🎨', '📝', '💼', '📌', '❓', '📧', '📕', '☕'];

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/settings')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">商品服务管理</h1>
                <p className="text-muted-foreground">管理平台支持的服务商品</p>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              添加服务
            </Button>
          </div>

          {/* Search & Stats */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Input
                placeholder="搜索服务名称或代码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                共 <strong className="text-foreground">{services.length}</strong> 个服务
              </div>
              <Button variant="outline" size="icon" onClick={fetchServices}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Services Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">图标</TableHead>
                      <TableHead>名称</TableHead>
                      <TableHead>代码</TableHead>
                      <TableHead className="w-[100px]">排序</TableHead>
                      <TableHead className="w-[100px]">状态</TableHead>
                      <TableHead className="w-[120px] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <span className="text-2xl">{service.icon}</span>
                        </TableCell>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="text-muted-foreground">{service.code}</TableCell>
                        <TableCell>{service.sort_order}</TableCell>
                        <TableCell>
                          <Switch
                            checked={service.is_active}
                            onCheckedChange={() => handleToggleActive(service)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(service)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingService(service);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredServices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          未找到服务
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? '编辑服务' : '添加服务'}</DialogTitle>
            <DialogDescription>
              {editingService ? '修改服务信息' : '添加一个新的服务商品'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">图标</label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg max-h-[120px] overflow-y-auto">
                {commonIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`text-2xl p-1 rounded hover:bg-background transition-colors ${
                      formData.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : ''
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="或输入自定义图标/emoji"
                className="mt-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">服务名称</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="如：Telegram, WhatsApp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">服务代码</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                placeholder="如：tg, wa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">排序</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <span className="text-sm">启用</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingService ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除服务 "{deletingService?.name}" 吗？此操作不可恢复，相关的价格数据也将被删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
