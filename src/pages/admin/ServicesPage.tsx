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
        title: 'Load failed',
        description: 'Failed to load service list',
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
        title: 'Validation failed',
        description: 'Please fill in service name and code',
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
        toast({ title: 'Updated', description: 'Service updated' });
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
        toast({ title: 'Created', description: 'New service added' });
      }

      setDialogOpen(false);
      fetchServices();
    } catch (err) {
      console.error('Error saving service:', err);
      toast({
        title: 'Save failed',
        description: 'Failed to save service',
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
        title: service.is_active ? 'Disabled' : 'Enabled',
        description: `Service ${service.name}  ${service.is_active ? 'Disable' : 'Enable'}`,
      });
    } catch (err) {
      console.error('Error toggling service:', err);
      toast({
        title: 'Operation failed',
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

      toast({ title: 'Deleted', description: `Service ${deletingService.name} Deleted` });
      setDeleteDialogOpen(false);
      setDeletingService(null);
      fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete service',
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
                <h1 className="text-2xl font-bold">Service Management</h1>
                <p className="text-muted-foreground">Manage services supported by the platform</p>
              </div>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          {/* Search & Stats */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Input
                placeholder="Search service name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Total  <strong className="text-foreground">{services.length}</strong> 个Service
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
                      <TableHead className="w-[80px]">Icon</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="w-[100px]">Order</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          {service.icon?.startsWith('/') ? (
                            <img 
                              src={service.icon} 
                              alt={service.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '📱';
                              }}
                            />
                          ) : (
                            <span className="text-2xl">{service.icon || '📱'}</span>
                          )}
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
                              title="View prices"
                              onClick={() => navigate(`/admin/service-prices?service=${service.id}`)}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
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
                          No services found
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
            <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
            <DialogDescription>
              {editingService ? '修改Service信息' : 'Add a new service'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Icon</label>
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
              <div className="mt-2 flex gap-2">
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Or enter a custom icon / SVG path"
                  className="flex-1"
                />
                {formData.icon?.startsWith('/') && (
                  <div className="flex items-center px-3 bg-muted rounded-lg">
                    <img 
                      src={formData.icon} 
                      alt="Preview" 
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Supports emoji or SVG path (e.g.：/icons/services/telegram.svg）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Service name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g.：Telegram, WhatsApp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Service code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                placeholder="e.g.：tg, wa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order</label>
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
                  <span className="text-sm">Enable</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingService ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to deleteService "{deletingService?.name}" ? This action cannot be undone，Related price data will also be deleted。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
