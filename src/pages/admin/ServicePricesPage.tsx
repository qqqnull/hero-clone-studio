import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, Plus, Edit2, Trash2, Save, X, Loader2, ArrowLeft, 
  DollarSign, RefreshCw, Globe, Package
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ServiceIcon } from '@/components/ServiceIcon';

interface Service {
  id: string;
  name: string;
  code: string;
  icon: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
  flag: string;
}

interface ServicePrice {
  id: string;
  service_id: string;
  country_id: string;
  price: number;
  stock: number;
  is_active: boolean;
  service: Service;
  country: Country;
}

export default function AdminServicePricesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ServicePrice | null>(null);
  const [formData, setFormData] = useState({
    service_id: '',
    country_id: '',
    price: 0,
    stock: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPrice, setDeletingPrice] = useState<ServicePrice | null>(null);

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
          description: 'You do not have permission to access the admin panel',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    };

    checkAdmin();
  }, [user, navigate, toast]);

  // Fetch data
  useEffect(() => {
    if (isAdmin) {
      fetchServices();
      fetchCountries();
      
      const serviceId = searchParams.get('service');
      if (serviceId) {
        setSelectedService(serviceId);
      }
    }
  }, [isAdmin, searchParams]);

  useEffect(() => {
    if (isAdmin) {
      fetchPrices();
    }
  }, [isAdmin, selectedService, selectedCountry]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('id, name, code, icon')
      .eq('is_active', true)
      .order('sort_order');
    if (data) setServices(data);
  };

  const fetchCountries = async () => {
    const { data } = await supabase
      .from('countries')
      .select('id, name, code, flag')
      .eq('is_active', true)
      .order('sort_order');
    if (data) setCountries(data);
  };

  const fetchPrices = async () => {
    setLoading(true);
    let query = supabase
      .from('service_prices')
      .select(`
        *,
        service:services(id, name, code, icon),
        country:countries(id, name, code, flag)
      `)
      .order('price', { ascending: true });

    if (selectedService !== 'all') {
      query = query.eq('service_id', selectedService);
    }
    if (selectedCountry !== 'all') {
      query = query.eq('country_id', selectedCountry);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      console.error('Error fetching prices:', error);
      toast({
        title: 'Load failed',
        description: 'Failed to load price list',
        variant: 'destructive',
      });
    } else {
      setPrices(data as ServicePrice[] || []);
    }
    setLoading(false);
  };

  const filteredPrices = prices.filter(p => 
    p.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.country?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingPrice(null);
    setFormData({
      service_id: selectedService !== 'all' ? selectedService : '',
      country_id: selectedCountry !== 'all' ? selectedCountry : '',
      price: 1.5,
      stock: 100,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (price: ServicePrice) => {
    setEditingPrice(price);
    setFormData({
      service_id: price.service_id,
      country_id: price.country_id,
      price: price.price,
      stock: price.stock,
      is_active: price.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.service_id || !formData.country_id) {
      toast({
        title: 'Validation failed',
        description: 'Please select service and country',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingPrice) {
        const { error } = await supabase
          .from('service_prices')
          .update({
            price: formData.price,
            stock: formData.stock,
            is_active: formData.is_active,
          })
          .eq('id', editingPrice.id);

        if (error) throw error;
        toast({ title: 'Updated', description: 'Price updated' });
      } else {
        // Check if already exists
        const { data: existing } = await supabase
          .from('service_prices')
          .select('id')
          .eq('service_id', formData.service_id)
          .eq('country_id', formData.country_id)
          .maybeSingle();

        if (existing) {
          toast({
            title: 'Already exists',
            description: 'This service-country combination already has a price configured',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }

        const { error } = await supabase
          .from('service_prices')
          .insert({
            service_id: formData.service_id,
            country_id: formData.country_id,
            price: formData.price,
            stock: formData.stock,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast({ title: 'Created', description: 'New price added' });
      }

      setDialogOpen(false);
      fetchPrices();
    } catch (err) {
      console.error('Error saving price:', err);
      toast({
        title: 'Save failed',
        description: 'Failed to save price',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (price: ServicePrice) => {
    try {
      const { error } = await supabase
        .from('service_prices')
        .update({ is_active: !price.is_active })
        .eq('id', price.id);

      if (error) throw error;
      
      setPrices(prev => 
        prev.map(p => p.id === price.id ? { ...p, is_active: !p.is_active } : p)
      );
      toast({ 
        title: price.is_active ? 'Disabled' : 'Enabled',
        description: `${price.service?.name} - ${price.country?.name}  ${price.is_active ? 'Disable' : 'Enable'}`,
      });
    } catch (err) {
      console.error('Error toggling price:', err);
      toast({
        title: 'Operation failed',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingPrice) return;

    try {
      const { error } = await supabase
        .from('service_prices')
        .delete()
        .eq('id', deletingPrice.id);

      if (error) throw error;

      toast({ 
        title: 'Deleted', 
        description: `${deletingPrice.service?.name} - ${deletingPrice.country?.name} Price deleted` 
      });
      setDeleteDialogOpen(false);
      setDeletingPrice(null);
      fetchPrices();
    } catch (err) {
      console.error('Error deleting price:', err);
      toast({
        title: 'Delete failed',
        variant: 'destructive',
      });
    }
  };

  // Batch add prices for a service to all countries
  const handleBatchAdd = async () => {
    if (selectedService === 'all') {
      toast({
        title: 'Please select a service',
        description: 'Select a service before batch adding',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Get existing country_ids for this service
      const { data: existing } = await supabase
        .from('service_prices')
        .select('country_id')
        .eq('service_id', selectedService);

      const existingCountryIds = new Set(existing?.map(e => e.country_id) || []);
      
      // Filter countries that don't have prices yet
      const newCountries = countries.filter(c => !existingCountryIds.has(c.id));

      if (newCountries.length === 0) {
        toast({
          title: 'Nothing to add',
          description: 'All countries are already configured for this service',
        });
        setSaving(false);
        return;
      }

      // Create prices for new countries
      const newPrices = newCountries.map(country => ({
        service_id: selectedService,
        country_id: country.id,
        price: Math.round((0.8 + Math.random() * 4.7) * 100) / 100,
        stock: Math.floor(100 + Math.random() * 900),
        is_active: true,
      }));

      const { error } = await supabase
        .from('service_prices')
        .insert(newPrices);

      if (error) throw error;

      toast({
        title: 'Batch add successful',
        description: `Added prices for  ${newCountries.length}  countries`,
      });
      fetchPrices();
    } catch (err) {
      console.error('Error batch adding:', err);
      toast({
        title: 'Batch add failed',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/services')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Service Price Management</h1>
                <p className="text-muted-foreground">Manage prices and stock for each service across countries</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedService !== 'all' && (
                <Button variant="outline" onClick={handleBatchAdd} disabled={saving}>
                  <Globe className="h-4 w-4 mr-2" />
                  Batch add countries
                </Button>
              )}
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Price
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Input
                placeholder="Search service or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                Total  <strong className="text-foreground">{filteredPrices.length}</strong>  items
              </div>
              <Button variant="outline" size="icon" onClick={fetchPrices}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Prices Table */}
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
                      <TableHead>Service</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrices.map((price) => (
                      <TableRow key={price.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ServiceIcon 
                              icon={price.service?.icon} 
                              name={price.service?.name || ''} 
                              size="sm" 
                            />
                            <span className="font-medium">{price.service?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{price.country?.flag}</span>
                            <span>{price.country?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${price.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {price.stock.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={price.is_active}
                            onCheckedChange={() => handleToggleActive(price)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(price)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setDeletingPrice(price);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPrices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {selectedService === 'all' && selectedCountry === 'all' 
                            ? 'Select a service or country to filter data' 
                            : 'No price data found'}
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
            <DialogTitle>{editingPrice ? 'Edit Price' : 'Add Price'}</DialogTitle>
            <DialogDescription>
              {editingPrice ? 'Edit service price information' : 'Add country price for service'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Service</label>
              <Select 
                value={formData.service_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, service_id: v }))}
                disabled={!!editingPrice}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <Select 
                value={formData.country_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, country_id: v }))}
                disabled={!!editingPrice}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <span className="text-sm">Enable</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
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
              Are you sure you want to delete {deletingPrice?.service?.name} - {deletingPrice?.country?.name} 's price configuration? This action cannot be undone。
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
