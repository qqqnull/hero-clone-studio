import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar, AnnouncementBar, Footer } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      return '请输入邮箱地址';
    }
    if (!emailRegex.test(value)) {
      return '请输入有效的邮箱地址';
    }
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return '请输入密码';
    }
    if (value.length < 6) {
      return '密码至少需要6个字符';
    }
    return '';
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      return '请确认密码';
    }
    if (value !== password) {
      return '两次输入的密码不一致';
    }
    return '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (!isLogin) {
      const confirmErr = validateConfirmPassword(confirmPassword);
      setConfirmPasswordError(confirmErr);
      if (emailErr || passwordErr || confirmErr) return;
    } else {
      if (emailErr || passwordErr) return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('邮箱或密码错误');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('登录成功');
        navigate('/');
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('该邮箱已被注册');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('注册成功');
        navigate('/');
      }
    }

    setLoading(false);
  };

  const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AnnouncementBar />
      <main className="flex-1 flex items-center justify-center py-16 bg-muted/30">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-center text-foreground mb-6">
              {isLogin ? t('auth.login.title') : t('auth.register.title')}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {isLogin ? t('auth.login.email') : t('auth.register.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    placeholder="email@example.com"
                    className={`${inputClassName} pl-10`}
                  />
                </div>
                {emailError && (
                  <p className="text-sm font-medium text-destructive">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {isLogin ? t('auth.login.password') : t('auth.register.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className={`${inputClassName} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm font-medium text-destructive">{passwordError}</p>
                )}
              </div>

              {/* Confirm Password Field (Register only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t('auth.register.confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmPasswordError('');
                      }}
                      className={`${inputClassName} pl-10`}
                    />
                  </div>
                  {confirmPasswordError && (
                    <p className="text-sm font-medium text-destructive">{confirmPasswordError}</p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-full" 
                disabled={loading}
              >
                {loading ? '处理中...' : (isLogin ? t('auth.login.submit') : t('auth.register.submit'))}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>
                  {t('auth.login.noAccount')}{' '}
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setEmailError('');
                      setPasswordError('');
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {t('auth.login.register')}
                  </button>
                </>
              ) : (
                <>
                  {t('auth.register.hasAccount')}{' '}
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setEmailError('');
                      setPasswordError('');
                      setConfirmPasswordError('');
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {t('auth.register.login')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
