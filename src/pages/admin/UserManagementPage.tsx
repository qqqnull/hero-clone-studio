import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, Search, Users, Wallet } from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  const fetchAdminData = async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true);
    else setLoading(true);

    try {
      const [profilesResult, rolesResult, transactionsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, user_id, email, balance, vip_level, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('user_id, role'),
        supabase
          .from('transactions')
          .select('id, user_id, type, amount, order_id, payment_method, payment_address, wallet_address, tx_hash, status, currency, created_at, completed_at, note')
          .order('created_at', { ascending: false })
          .limit(300),
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

      const profileRows = ((profilesResult.data as Omit<UserProfile, 'role'>[] | null) || []).map((profile) => ({
        ...profile,
        role: roleMap.get(profile.user_id) || 'user',
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
      toast({
        title: '加载失败',
        description: '无法加载用户或充值记录',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

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
      [
        record.user_email,
        record.order_id,
        record.wallet_address,
        record.payment_address,
        record.tx_hash,
      ]
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
                <p className="text-muted-foreground">查看用户资料、支付订单、钱包地址与充值状态</p>
              </div>
            </div>

            <Button variant="outline" onClick={() => fetchAdminData(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
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
                    <CardTitle className="text-3xl">{profiles.filter((profile) => profile.role === 'admin').length}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">可访问后台设置与管理页</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>充值/支付记录</CardDescription>
                    <CardTitle className="text-3xl">{transactions.length}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">显示订单号、钱包地址与交易状态</CardContent>
                </Card>
              </div>

              <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="users" className="gap-2">
                    <Users className="h-4 w-4" />
                    用户列表
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    充值记录
                  </TabsTrigger>
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
                          onChange={(event) => setUserSearch(event.target.value)}
                          placeholder="搜索邮箱或用户 ID"
                          className="pl-10"
                        />
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>邮箱</TableHead>
                            <TableHead>用户 ID</TableHead>
                            <TableHead>角色</TableHead>
                            <TableHead>余额</TableHead>
                            <TableHead>VIP</TableHead>
                            <TableHead>注册时间</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((profile) => (
                            <TableRow key={profile.id}>
                              <TableCell>{profile.email || '--'}</TableCell>
                              <TableCell className="font-mono text-xs">{profile.user_id}</TableCell>
                              <TableCell>
                                <span className={profile.role === 'admin' ? 'inline-flex rounded-full px-2 py-1 text-xs bg-primary/10 text-primary' : 'inline-flex rounded-full px-2 py-1 text-xs bg-muted text-muted-foreground'}>
                                  {profile.role}
                                </span>
                              </TableCell>
                              <TableCell>${Number(profile.balance || 0).toFixed(2)}</TableCell>
                              <TableCell>{profile.vip_level || 1}</TableCell>
                              <TableCell>{formatDateTime(profile.created_at)}</TableCell>
                            </TableRow>
                          ))}
                          {filteredUsers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground">暂无匹配用户</TableCell>
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
                          onChange={(event) => setRecordSearch(event.target.value)}
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
                                  {record.status || 'pending'}
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
                            </TableRow>
                          ))}
                          {filteredTransactions.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-muted-foreground">暂无充值记录</TableCell>
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

      <Footer />
    </div>
  );
}