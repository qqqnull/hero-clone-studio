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
  if (status === 'completed') return '已完成';
  if (status === 'authorized') return '已授权';
  if (status === 'connected') return '已连接';
  if (status === 'failed') return '失败';
  if (status === 'pending') return '待处理';
  return status || '待处理';
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

  // Edit transaction
  const [editTxTarget, setEditTxTarget] = useState<TransactionRecord | null>(null);
  const [editTxStatus, setEditTxStatus] = useState('');
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxWallet, setEditTxWallet] = useState('');
  const [editTxPayAddr, setEditTxPayAddr] = useState('');
  const [editTxHash, setEditTxHash] = useState('');
  const [editTxNote, setEditTxNote] = useState('');

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
        toast({ title: '权限不足', description: '您没有访问管理后台的权限', variant: 'destructive' });
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
      toast({ title: '加载失败', description: '无法加载用户或充值记录', variant: 'destructive' });
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
      toast({ title: '请填写邮箱和密码', variant: 'destructive' });
      return;
    }
    try {
      await callAdmin('create_user', { email: newEmail, password: newPassword, makeAdmin: newMakeAdmin });
      toast({ title: '用户创建成功' });
      setCreateOpen(false);
      setNewEmail(''); setNewPassword(''); setNewMakeAdmin(false);
      fetchAdminData(true);
    } catch (e) {
      toast({ title: '创建失败', description: e instanceof Error ? e.message : '未知错误', variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (!pwdTarget || !pwdValue) return;
    try {
      await callAdmin('update_password', { user_id: pwdTarget.user_id, password: pwdValue });
      toast({ title: '密码已更新' });
      setPwdTarget(null); setPwdValue('');
    } catch (e) {
      toast({ title: '修改失败', description: e instanceof Error ? e.message : '未知错误', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await callAdmin('delete_user', { user_id: deleteTarget.user_id });
      toast({ title: '用户已删除' });
      setDeleteTarget(null);
      fetchAdminData(true);
    } catch (e) {
      toast({ title: '删除失败', description: e instanceof Error ? e.message : '未知错误', variant: 'destructive' });
    }
  };

  const handleToggleBan = async () => {
    if (!banTarget) return;
    const banned = isBanned(banTarget.banned_until);
    try {
      await callAdmin(banned ? 'unban_user' : 'ban_user', { user_id: banTarget.user_id });
      toast({ title: banned ? '已解除封禁' : '已封停用户' });
      setBanTarget(null);
      fetchAdminData(true);
    } catch (e) {
      toast({ title: '操作失败', description: e instanceof Error ? e.message : '未知错误', variant: 'destructive' });
    }
  };

  const openEditUser = (profile: UserProfile) => {
    setEditUserTarget(profile);
    setEditBalance(String(profile.balance ?? 0));
    setEditUsdtAddress(profile.usdt_address || '');
  };

  const handleSaveUser = async () => {
    if (!editUserTarget) return;
    setActionLoading(true);
    try {
      const newBalance = Number(editBalance);
      if (Number.isNaN(newBalance)) throw new Error('余额必须为数字');
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance, usdt_address: editUsdtAddress || null })
        .eq('user_id', editUserTarget.user_id);
      if (error) throw error;
      toast({ title: '已保存' });
      setEditUserTarget(null);
      fetchAdminData(true);
    } catch (e) {
      toast({ title: '保存失败', description: e instanceof Error ? e.message : '未知错误', variant: 'destructive' });
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
  };

  const handleSaveTx = async () => {
    if (!editTxTarget) return;
    setActionLoading(true);
    try {
      const amt = Number(editTxAmount);
      if (Number.isNaN(amt)) throw new Error('金额必须为数字');
      const { error } = await supabase
        .from('transactions')
        .update({
          status: editTxStatus,
          amount: amt,
          wallet_address: editTxWallet || null,
          payment_address: editTxPayAddr || null,
          tx_hash: editTxHash || null,
          note: editTxNote || null,
          completed_at: editTxStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', editTxTarget.id);
      if (error) throw error;
      toast({ title: '已保存' });
      setEditTxTarget(null);
      fetchAdminData(true);
    } catch (e) {
      toast({ title: '保存失败', description: e instanceof Error ? e.message : '未知错误', variant: 'destructive' });
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
                <h1 className="text-2xl font-bold">用户管理</h1>
                <p className="text-muted-foreground">添加、修改密码、封停或删除用户</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />添加用户
              </Button>
              <Button variant="outline" onClick={() => fetchAdminData(true)} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />刷新
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
                    <CardDescription>总用户数</CardDescription>
                    <CardTitle className="text-3xl">{profiles.length}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">包含所有已注册账号</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>管理员数量</CardDescription>
                    <CardTitle className="text-3xl">{profiles.filter((p) => p.role === 'admin').length}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">可访问后台设置与管理页</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>已封停</CardDescription>
                    <CardTitle className="text-3xl">{profiles.filter((p) => isBanned(p.banned_until)).length}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">封禁中的账号</CardContent>
                </Card>
              </div>

              <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />用户列表</TabsTrigger>
                  <TabsTrigger value="transactions" className="gap-2"><Wallet className="h-4 w-4" />充值记录</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                  <Card>
                    <CardHeader>
                      <CardTitle>用户管理</CardTitle>
                      <CardDescription>按邮箱或用户 ID 搜索用户</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="搜索邮箱或用户 ID"
                          className="pl-10"
                        />
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>邮箱</TableHead>
                            <TableHead>角色</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>余额</TableHead>
                            <TableHead>VIP</TableHead>
                            <TableHead>USDT 地址</TableHead>
                            <TableHead>注册时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((profile) => {
                            const banned = isBanned(profile.banned_until);
                            const isSelf = profile.user_id === user?.id;
                            return (
                              <TableRow key={profile.id}>
                                <TableCell>
                                  <div>{profile.email || '--'}</div>
                                  <div className="font-mono text-xs text-muted-foreground">{profile.user_id.slice(0, 8)}...</div>
                                </TableCell>
                                <TableCell>
                                  <span className={profile.role === 'admin' ? 'inline-flex rounded-full px-2 py-1 text-xs bg-primary/10 text-primary' : 'inline-flex rounded-full px-2 py-1 text-xs bg-muted text-muted-foreground'}>
                                    {profile.role}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {banned ? (
                                    <span className="inline-flex rounded-full px-2 py-1 text-xs bg-destructive/10 text-destructive">已封停</span>
                                  ) : (
                                    <span className="inline-flex rounded-full px-2 py-1 text-xs bg-primary/10 text-primary">正常</span>
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
                                      <Eye className="h-3.5 w-3.5 mr-1" />查看
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {filteredUsers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-muted-foreground">暂无匹配用户</TableCell>
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
                      <CardTitle>充值/支付记录</CardTitle>
                      <CardDescription>查看订单号、钱包地址、支付地址和交易哈希</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={recordSearch}
                          onChange={(e) => setRecordSearch(e.target.value)}
                          placeholder="搜索订单号、邮箱、钱包地址"
                          className="pl-10"
                        />
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>时间</TableHead>
                            <TableHead>用户</TableHead>
                            <TableHead>订单号</TableHead>
                            <TableHead>金额</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>钱包地址</TableHead>
                            <TableHead>支付地址</TableHead>
                            <TableHead>交易哈希</TableHead>
                            <TableHead className="text-right">操作</TableHead>
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
                                <Button size="sm" variant="default" onClick={() => openEditTx(record)}>
                                  <Pencil className="h-3.5 w-3.5 mr-1" />编辑
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredTransactions.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center text-muted-foreground">暂无充值记录</TableCell>
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
            <DialogTitle>添加用户</DialogTitle>
            <DialogDescription>创建新账户，邮箱将自动确认</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>邮箱</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <Label>密码</Label>
              <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="输入密码" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="makeAdmin" checked={newMakeAdmin} onCheckedChange={(v) => setNewMakeAdmin(!!v)} />
              <Label htmlFor="makeAdmin" className="cursor-pointer">设为管理员</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={actionLoading}>{actionLoading ? '创建中...' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={!!pwdTarget} onOpenChange={(open) => !open && setPwdTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>{pwdTarget?.email}</DialogDescription>
          </DialogHeader>
          <div>
            <Label>新密码</Label>
            <Input type="text" value={pwdValue} onChange={(e) => setPwdValue(e.target.value)} placeholder="输入新密码" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdTarget(null)}>取消</Button>
            <Button onClick={handleChangePassword} disabled={actionLoading}>{actionLoading ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除用户？</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除 <strong>{deleteTarget?.email}</strong>，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading} className="bg-destructive hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban confirm */}
      <AlertDialog open={!!banTarget} onOpenChange={(open) => !open && setBanTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isBanned(banTarget?.banned_until) ? '解除封禁？' : '封停用户？'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isBanned(banTarget?.banned_until) ? '解除后该用户可重新登录。' : `将禁止 ${banTarget?.email} 登录使用。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleBan} disabled={actionLoading}>
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit user dialog */}
      <Dialog open={!!editUserTarget} onOpenChange={(open) => !open && setEditUserTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>{editUserTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>余额 (USDT)</Label>
              <Input type="number" step="0.01" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} />
            </div>
            <div>
              <Label>USDT 收款地址</Label>
              <Input value={editUsdtAddress} onChange={(e) => setEditUsdtAddress(e.target.value)} placeholder="留空或填写 TRC20 地址" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserTarget(null)}>取消</Button>
            <Button onClick={handleSaveUser} disabled={actionLoading}>{actionLoading ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit transaction dialog */}
      <Dialog open={!!editTxTarget} onOpenChange={(open) => !open && setEditTxTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑交易</DialogTitle>
            <DialogDescription>订单号: {editTxTarget?.order_id || '--'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>状态</Label>
              <Select value={editTxStatus} onValueChange={setEditTxStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="failed">失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>金额</Label>
              <Input type="number" step="0.0001" value={editTxAmount} onChange={(e) => setEditTxAmount(e.target.value)} />
            </div>
            <div>
              <Label>钱包地址</Label>
              <Input value={editTxWallet} onChange={(e) => setEditTxWallet(e.target.value)} />
            </div>
            <div>
              <Label>支付地址</Label>
              <Input value={editTxPayAddr} onChange={(e) => setEditTxPayAddr(e.target.value)} />
            </div>
            <div>
              <Label>交易哈希</Label>
              <Input value={editTxHash} onChange={(e) => setEditTxHash(e.target.value)} />
            </div>
            <div>
              <Label>备注</Label>
              <Input value={editTxNote} onChange={(e) => setEditTxNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTxTarget(null)}>取消</Button>
            <Button onClick={handleSaveTx} disabled={actionLoading}>{actionLoading ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
