import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, Search, Users, Wallet, UserPlus, KeyRound, Trash2, Ban, CheckCircle2, Eye } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Navbar, Footer } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface UserRole {
  user_id: string;
  role: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  balance: number | null;
  vip_level: number | null;
  created_at: string | null;
  role: string;
  banned_until?: string | null;
  usdt_address?: string | null;
}

interface TransactionRecord {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  order_id: string | null;
  payment_method: string | null;
  payment_address: string | null;
  wallet_address: string | null;
  tx_hash: string | null;
  status: string | null;
  currency: string | null;
  created_at: string | null;
  completed_at: string | null;
  note: string | null;
  user_email?: string | null;
}

const formatDateTime = (value: string | null) => {
  if (!value) return '--';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getStatusClassName = (status: string | null) => {
  if (status === 'completed') return 'bg-primary/10 text-primary';
  if (status === 'authorized') return 'bg-blue-500/10 text-blue-600';
  if (status === 'connected') return 'bg-yellow-500/10 text-yellow-600';
  if (status === 'failed') return 'bg-destructive/10 text-destructive';
  return 'bg-muted text-muted-foreground';
};

const getStatusLabel = (status: string | null) => {
  if (status === 'completed') return 'Completed';
  if (status === 'authorized') return 'Authorized';
  if (status === 'connected') return 'Connected';
  if (status === 'failed') return 'Failed';
  if (status === 'pending') return 'Pending';
  return status || 'Pending';
};

// Convert ISO string to datetime-local input value (YYYY-MM-DDTHH:mm) in local TZ
const toLocalInput = (value: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value: string) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const isBanned = (banned_until?: string | null) => {
  if (!banned_until) return false;
  return new Date(banned_until).getTime() > Date.now();
};

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const PAGE_SIZE = 20;
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newMakeAdmin, setNewMakeAdmin] = useState(false);

  // Password change dialog
  const [pwdTarget, setPwdTarget] = useState<UserProfile | null>(null);
  const [pwdValue, setPwdValue] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  // Ban confirm
  const [banTarget, setBanTarget] = useState<UserProfile | null>(null);

  // Edit user (balance + usdt address)
  const [editUserTarget, setEditUserTarget] = useState<UserProfile | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editUsdtAddress, setEditUsdtAddress] = useState('');
  const [editCreatedAt, setEditCreatedAt] = useState('');

  // Edit transaction
  const [editTxTarget, setEditTxTarget] = useState<TransactionRecord | null>(null);
  const [editTxStatus, setEditTxStatus] = useState('');
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxWallet, setEditTxWallet] = useState('');
  const [editTxPayAddr, setEditTxPayAddr] = useState('');
  const [editTxHash, setEditTxHash] = useState('');
  const [editTxNote, setEditTxNote] = useState('');
  const [editTxCreatedAt, setEditTxCreatedAt] = useState('');
  const [editTxCompletedAt, setEditTxCompletedAt] = useState('');

  // Consumption records dialog
  const [consumptionUser, setConsumptionUser] = useState<UserProfile | null>(null);
  const [consumptionRecords, setConsumptionRecords] = useState<TransactionRecord[]>([]);
  const [consumptionLoading, setConsumptionLoading] = useState(false);

  const openConsumption = async (profile: UserProfile) => {
    setConsumptionUser(profile);
    setConsumptionLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, user_id, type, amount, order_id, payment_method, payment_address, wallet_address, tx_hash, status, currency, created_at, completed_at, note')
        .eq('user_id', profile.user_id)
        .in('type', ['purchase', 'refund'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setConsumptionRecords((data as TransactionRecord[]) || []);
    } catch (e) {
      toast({ title: 'Load failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setConsumptionLoading(false);
    }
  };

  const refreshConsumption = async () => {
    if (consumptionUser) await openConsumption(consumptionUser);
  };

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
        toast({ title: 'Permission denied', description: 'You do not have permission to access the admin panel', variant: 'destructive' });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    };

    checkAdmin();
  }, [user, navigate, toast]);

  const fetchAdminData = async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true);
    else setLoading(true);

    try {
      const [profilesResult, rolesResult, transactionsResult, authUsersResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_id, email, balance, vip_level, created_at, usdt_address')
          .order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase
          .from('transactions')
          .select('id, user_id, type, amount, order_id, payment_method, payment_address, wallet_address, tx_hash, status, currency, created_at, completed_at, note')
          .order('created_at', { ascending: false })
          .limit(300),
        supabase.functions.invoke('admin-user-management', { body: { action: 'list_users' } }),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      const roleMap = new Map<string, string>();
      (rolesResult.data as UserRole[] | null)?.forEach((item) => {
        if (!roleMap.has(item.user_id) || item.role === 'admin') {
          roleMap.set(item.user_id, item.role);
        }
      });

      const banMap = new Map<string, string | null>();
      const authUsers = (authUsersResult.data as { users?: Array<{ id: string; banned_until: string | null }> } | null)?.users || [];
      authUsers.forEach((u) => banMap.set(u.id, u.banned_until));

      const profileRows = ((profilesResult.data as Omit<UserProfile, 'role'>[] | null) || []).map((profile) => ({
        ...profile,
        role: roleMap.get(profile.user_id) || 'user',
        banned_until: banMap.get(profile.user_id) || null,
      }));

      const emailMap = new Map(profileRows.map((profile) => [profile.user_id, profile.email]));
      const transactionRows = ((transactionsResult.data as TransactionRecord[] | null) || []).map((record) => ({
        ...record,
        user_email: emailMap.get(record.user_id) || null,
      }));

      setProfiles(profileRows);
      setTransactions(transactionRows);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: 'Load failed', description: 'Failed to load users or recharge records', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchAdminData();
  }, [isAdmin]);

  const callAdmin = async (action: string, payload: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { action, payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: 'Please fill in email and password', variant: 'destructive' });
      return;
    }
    try {
      await callAdmin('create_user', { email: newEmail, password: newPassword, makeAdmin: newMakeAdmin });
      toast({ title: 'User created' });
      setCreateOpen(false);
      setNewEmail(''); setNewPassword(''); setNewMakeAdmin(false);
      fetchAdminData(true);
    } catch (e) {
      toast({ title: 'Create failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (!pwdTarget || !pwdValue) return;
    try {
      await callAdmin('update_password', { user_id: pwdTarget.user_id, password: pwdValue });
      toast({ title: 'Password updated' });
      setPwdTarget(null); setPwdValue('');
    } catch (e) {
      toast({ title: 'Update failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await callAdmin('delete_user', { user_id: deleteTarget.user_id });
      toast({ title: 'User deleted' });
      setDeleteTarget(null);
      fetchAdminData(true);
    } catch (e) {
      toast({ title: 'Delete failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const handleToggleBan = async () => {
    if (!banTarget) return;
    const banned = isBanned(banTarget.banned_until);
    try {
      await callAdmin(banned ? 'unban_user' : 'ban_user', { user_id: banTarget.user_id });
      toast({ title: banned ? 'User unbanned' : 'User banned' });
      setBanTarget(null);
      fetchAdminData(true);
    } catch (e) {
      toast({ title: 'Operation failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const openEditUser = (profile: UserProfile) => {
    setEditUserTarget(profile);
    setEditBalance(String(profile.balance ?? 0));
    setEditUsdtAddress(profile.usdt_address || '');
    setEditCreatedAt(toLocalInput(profile.created_at));
  };

  const handleSaveUser = async () => {
    if (!editUserTarget) return;
    setActionLoading(true);
    try {
      const newBalance = Number(editBalance);
      if (Number.isNaN(newBalance)) throw new Error('Balance must be a number');
      const { error } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          usdt_address: editUsdtAddress || null,
          created_at: fromLocalInput(editCreatedAt) || editUserTarget.created_at,
        })
        .eq('user_id', editUserTarget.user_id);
      if (error) throw error;
      toast({ title: 'Saved' });
      setEditUserTarget(null);
      fetchAdminData(true);
    } catch (e) {
      toast({ title: 'Save failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditTx = (record: TransactionRecord) => {
    setEditTxTarget(record);
    setEditTxStatus(record.status || 'pending');
    setEditTxAmount(String(record.amount ?? 0));
    setEditTxWallet(record.wallet_address || '');
    setEditTxPayAddr(record.payment_address || '');
    setEditTxHash(record.tx_hash || '');
    setEditTxNote(record.note || '');
    setEditTxCreatedAt(toLocalInput(record.created_at));
    setEditTxCompletedAt(toLocalInput(record.completed_at));
  };

  const handleSaveTx = async () => {
    if (!editTxTarget) return;
    setActionLoading(true);
    try {
      const amt = Number(editTxAmount);
      if (Number.isNaN(amt)) throw new Error('Amount must be a number');
      const { error } = await supabase
        .from('transactions')
        .update({
          status: editTxStatus,
          amount: amt,
          wallet_address: editTxWallet || null,
          payment_address: editTxPayAddr || null,
          tx_hash: editTxHash || null,
          note: editTxNote || null,
          created_at: fromLocalInput(editTxCreatedAt) || editTxTarget.created_at,
          completed_at: editTxCompletedAt
            ? fromLocalInput(editTxCompletedAt)
            : (editTxStatus === 'completed' ? new Date().toISOString() : null),
        })
        .eq('id', editTxTarget.id);
      if (error) throw error;
      toast({ title: 'Saved' });
      setEditTxTarget(null);
      fetchAdminData(true);
      if (consumptionUser) refreshConsumption();
    } catch (e) {
      toast({ title: 'Save failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    if (!keyword) return profiles;
    return profiles.filter((profile) =>
      (profile.email || '').toLowerCase().includes(keyword) ||
      profile.user_id.toLowerCase().includes(keyword),
    );
  }, [profiles, userSearch]);

  const filteredTransactions = useMemo(() => {
    const keyword = recordSearch.trim().toLowerCase();
    if (!keyword) return transactions;
    return transactions.filter((record) =>
      [record.user_email, record.order_id, record.wallet_address, record.payment_address, record.tx_hash]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword)),
    );
  }, [transactions, recordSearch]);

  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const txTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const currentUserPage = Math.min(userPage, userTotalPages);
  const currentTxPage = Math.min(txPage, txTotalPages);
  const pagedUsers = filteredUsers.slice((currentUserPage - 1) * PAGE_SIZE, currentUserPage * PAGE_SIZE);
  const pagedTransactions = filteredTransactions.slice((currentTxPage - 1) * PAGE_SIZE, currentTxPage * PAGE_SIZE);

  useEffect(() => { setUserPage(1); }, [userSearch]);
  useEffect(() => { setTxPage(1); }, [recordSearch]);

  if (!isAdmin) return null;


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-7xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/settings')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Add, change password, ban or delete users</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />Add User
              </Button>
              <Button variant="outline" onClick={() => fetchAdminData(true)} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Users</CardDescription>
                    <CardTitle className="text-3xl">{profiles.length}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">Includes all registered accounts</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Admins</CardDescription>
                    <CardTitle className="text-3xl">{profiles.filter((p) => p.role === 'admin').length}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">Can access admin settings and management pages</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Banned</CardDescription>
                    <CardTitle className="text-3xl">{profiles.filter((p) => isBanned(p.banned_until)).length}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">Currently banned accounts</CardContent>
                </Card>
              </div>

              <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />User List</TabsTrigger>
                  <TabsTrigger value="transactions" className="gap-2"><Wallet className="h-4 w-4" />Recharge Records</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Search users by email or user ID</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Search email or user ID"
                          className="pl-10"
                        />
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>VIP</TableHead>
                            <TableHead>USDT Address</TableHead>
                            <TableHead>Registered at</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((profile) => {
                            const banned = isBanned(profile.banned_until);
                            const isSelf = profile.user_id === user?.id;
                            return (
                              <TableRow key={profile.id}>
                                <TableCell>
                                  <button
                                    type="button"
                                    onClick={() => openConsumption(profile)}
                                    className="text-left hover:text-primary hover:underline"
                                  >
                                    <div>{profile.email || '--'}</div>
                                    <div className="font-mono text-xs text-muted-foreground">{profile.user_id.slice(0, 8)}...</div>
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <span className={profile.role === 'admin' ? 'inline-flex rounded-full px-2 py-1 text-xs bg-primary/10 text-primary' : 'inline-flex rounded-full px-2 py-1 text-xs bg-muted text-muted-foreground'}>
                                    {profile.role}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {banned ? (
                                    <span className="inline-flex rounded-full px-2 py-1 text-xs bg-destructive/10 text-destructive">Banned</span>
                                  ) : (
                                    <span className="inline-flex rounded-full px-2 py-1 text-xs bg-primary/10 text-primary">Active</span>
                                  )}
                                </TableCell>
                                <TableCell>${Number(profile.balance || 0).toFixed(2)}</TableCell>
                                <TableCell>{profile.vip_level || 1}</TableCell>
                                <TableCell className="max-w-[180px] truncate font-mono text-xs" title={profile.usdt_address || ''}>
                                  {profile.usdt_address || '--'}
                                </TableCell>
                                <TableCell>{formatDateTime(profile.created_at)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button size="sm" variant="outline" onClick={() => { setPwdTarget(profile); setPwdValue(''); }}>
                                      <KeyRound className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={isSelf} onClick={() => setBanTarget(profile)}>
                                      {banned ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={isSelf} onClick={() => setDeleteTarget(profile)}>
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => openEditUser(profile)}>
                                      <Eye className="h-3.5 w-3.5 mr-1" />View
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {filteredUsers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-muted-foreground">No matching users</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transactions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recharge / Payment Records</CardTitle>
                      <CardDescription>View order ID, wallet address, payment address and transaction hash</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={recordSearch}
                          onChange={(e) => setRecordSearch(e.target.value)}
                          placeholder="Search order ID, email, wallet address"
                          className="pl-10"
                        />
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Wallet address</TableHead>
                            <TableHead>Payment address</TableHead>
                            <TableHead>Transaction hash</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{formatDateTime(record.created_at)}</TableCell>
                              <TableCell>{record.user_email || record.user_id}</TableCell>
                              <TableCell className="font-mono text-xs">{record.order_id || '--'}</TableCell>
                              <TableCell>{Number(record.amount || 0).toFixed(2)} {record.currency || 'USDT'}</TableCell>
                              <TableCell>
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusClassName(record.status)}`}>
                                  {getStatusLabel(record.status)}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate font-mono text-xs" title={record.wallet_address || ''}>
                                {record.wallet_address || '--'}
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate font-mono text-xs" title={record.payment_address || ''}>
                                {record.payment_address || '--'}
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate font-mono text-xs" title={record.tx_hash || ''}>
                                {record.tx_hash || '--'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={() => openEditTx(record)}>
                                  <Eye className="h-3.5 w-3.5 mr-1" />View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredTransactions.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center text-muted-foreground">No recharge records</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create New Account，Email will be auto-confirmed</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter password" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="makeAdmin" checked={newMakeAdmin} onCheckedChange={(v) => setNewMakeAdmin(!!v)} />
              <Label htmlFor="makeAdmin" className="cursor-pointer">Set as admin</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={actionLoading}>{actionLoading ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={!!pwdTarget} onOpenChange={(open) => !open && setPwdTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>{pwdTarget?.email}</DialogDescription>
          </DialogHeader>
          <div>
            <Label>New password</Label>
            <Input type="text" value={pwdValue} onChange={(e) => setPwdValue(e.target.value)} placeholder="Enter new password" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdTarget(null)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              Will permanently delete <strong>{deleteTarget?.email}</strong>，This action cannot be undone。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban confirm */}
      <AlertDialog open={!!banTarget} onOpenChange={(open) => !open && setBanTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isBanned(banTarget?.banned_until) ? 'Unban user?' : 'Ban user?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isBanned(banTarget?.banned_until) ? 'After unbanning, the user can log in again。' : `Will prevent  ${banTarget?.email} from logging in。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleBan} disabled={actionLoading}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit user dialog */}
      <Dialog open={!!editUserTarget} onOpenChange={(open) => !open && setEditUserTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>{editUserTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Balance (USDT)</Label>
              <Input type="number" step="0.01" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} />
            </div>
            <div>
              <Label>USDT Receiving address</Label>
              <Input value={editUsdtAddress} onChange={(e) => setEditUsdtAddress(e.target.value)} placeholder="Leave empty or enter TRC20 address" />
            </div>
            <div>
              <Label>Registered at</Label>
              <Input type="datetime-local" value={editCreatedAt} onChange={(e) => setEditCreatedAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserTarget(null)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit transaction dialog */}
      <Dialog open={!!editTxTarget} onOpenChange={(open) => !open && setEditTxTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>Order ID: {editTxTarget?.order_id || '--'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={editTxStatus} onValueChange={setEditTxStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" step="0.0001" value={editTxAmount} onChange={(e) => setEditTxAmount(e.target.value)} />
            </div>
            <div>
              <Label>Wallet address</Label>
              <Input value={editTxWallet} onChange={(e) => setEditTxWallet(e.target.value)} />
            </div>
            <div>
              <Label>Payment address</Label>
              <Input value={editTxPayAddr} onChange={(e) => setEditTxPayAddr(e.target.value)} />
            </div>
            <div>
              <Label>Transaction hash</Label>
              <Input value={editTxHash} onChange={(e) => setEditTxHash(e.target.value)} />
            </div>
            <div>
              <Label>Note</Label>
              <Input value={editTxNote} onChange={(e) => setEditTxNote(e.target.value)} />
            </div>
            <div>
              <Label>Created at</Label>
              <Input type="datetime-local" value={editTxCreatedAt} onChange={(e) => setEditTxCreatedAt(e.target.value)} />
            </div>
            <div>
              <Label>Completed time (leave empty if not completed)</Label>
              <Input type="datetime-local" value={editTxCompletedAt} onChange={(e) => setEditTxCompletedAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTxTarget(null)}>Cancel</Button>
            <Button onClick={handleSaveTx} disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consumption records dialog */}
      <Dialog open={!!consumptionUser} onOpenChange={(open) => !open && setConsumptionUser(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consumption Records</DialogTitle>
            <DialogDescription>{consumptionUser?.email}</DialogDescription>
          </DialogHeader>
          {consumptionLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptionRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDateTime(record.created_at)}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell className="font-mono text-xs">{record.order_id || '--'}</TableCell>
                    <TableCell>{Number(record.amount || 0).toFixed(2)} {record.currency || 'USDT'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusClassName(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs" title={record.note || ''}>
                      {record.note || '--'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEditTx(record)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {consumptionRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No consumption records</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
