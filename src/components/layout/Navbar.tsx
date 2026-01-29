import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const languages = [
  { code: 'cn', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export function Navbar() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  const navItems = [
    { label: t('nav.receiveSms'), href: '/receive-sms', isHighlighted: true },
    { label: t('nav.myNumbers'), href: '/user-center?tab=numbers' },
    { 
      label: t('nav.partners'), 
      href: '#',
      isDropdown: true,
      children: [
        { label: t('nav.affiliate'), href: '/affiliate' },
        { label: t('nav.supplier'), href: '/supplier' },
      ]
    },
    { label: t('nav.loyalty'), href: '/loyalty' },
    { label: t('nav.api'), href: '/api' },
    { label: t('nav.about'), href: '/about' },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const userId = profile?.id?.slice(0, 6) || '---';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - HEROSMS text style matching hero-sms.com */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-primary">HERO</span>
              <span className="text-foreground">SMS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => (
              item.isDropdown ? (
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger asChild>
                    <button className="px-4 py-2 rounded-full text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 flex items-center gap-1">
                      {item.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {item.children?.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link to={child.href} className="cursor-pointer">
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    item.isHighlighted 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'text-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-foreground hover:bg-muted flex items-center gap-2 px-3"
                >
                  <span className="text-lg">{currentLang.flag}</span>
                  <span className="hidden sm:inline text-sm">{currentLang.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px]">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu or Login Button */}
            {user ? (
              <>
                {/* User Info Display */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">ID: </span>
                    <span className="font-medium">{userId}</span>
                  </div>
                  <div className="text-sm text-primary font-medium">
                    ${profile?.balance?.toFixed(2) || '0.00'}
                  </div>
                </div>

                {/* Recharge Button */}
                <Link to="/recharge">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {t('nav.recharge')}
                  </Button>
                </Link>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]">
                    <div className="px-3 py-2 text-sm">
                      <div className="text-muted-foreground">{user.email}</div>
                      <div className="font-medium text-primary">${profile?.balance?.toFixed(2) || '0.00'}</div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/user-center?tab=profile" className="cursor-pointer">
                        {t('nav.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/user-center?tab=numbers" className="cursor-pointer">
                        {t('nav.activationHistory')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/user-center?tab=security" className="cursor-pointer">
                        {t('nav.security')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/user-center?tab=affiliate" className="cursor-pointer">
                        {t('nav.affiliateMenu')}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin/services" className="cursor-pointer flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            {t('nav.adminServices')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/settings" className="cursor-pointer flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            {t('nav.adminSettings')}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium px-6"
                >
                  {t('nav.login')}
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-foreground p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                item.isDropdown ? (
                  <div key={item.href} className="space-y-1">
                    <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                      {item.label}
                    </div>
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className="block px-8 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg"
                        onClick={() => setIsOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-4 py-3 rounded-lg text-sm font-medium ${
                      item.isHighlighted 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-foreground hover:bg-muted'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              {isAdmin && (
                <Link
                  to="/admin/settings"
                  className="px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  {t('nav.adminSettings')}
                </Link>
              )}
              {user && (
                <button
                  onClick={() => { handleSignOut(); setIsOpen(false); }}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-muted text-left flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
