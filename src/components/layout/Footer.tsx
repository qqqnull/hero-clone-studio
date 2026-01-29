import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  const mainLinks = [
    { label: t('footer.about'), href: '/about' },
    { label: t('footer.contact'), href: '/contact' },
    { label: t('footer.rules'), href: '/rules' },
    { label: t('footer.api'), href: '/api' },
    { label: t('footer.affiliate'), href: '/affiliate' },
    { label: t('footer.loyalty'), href: '/loyalty' },
    { label: t('footer.supplier'), href: '/supplier' },
  ];

  const legalLinks = [
    { label: t('footer.terms'), href: '/terms' },
    { label: t('footer.privacy'), href: '/privacy' },
    { label: t('footer.refund'), href: '/refund' },
  ];

  return (
    <footer className="bg-[#1e2642] text-white">
      {/* Top Section with gradient border */}
      <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-primary">HERO</span>
              <span className="text-white">SMS</span>
            </span>
          </Link>

          {/* Main Navigation - Horizontal layout matching hero-sms.com */}
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-white/70 hover:text-white transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-6">
          {/* Bottom Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Legal Links */}
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-white/50 hover:text-white/80 transition-colors text-xs"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Help Section */}
            <div className="flex items-center gap-3">
              <span className="text-white/50 text-sm">{t('footer.needHelp')}</span>
              <a 
                href="mailto:support@hero-sms.com" 
                className="flex items-center gap-2 text-white hover:text-primary transition-colors text-sm font-medium"
              >
                <Mail className="w-4 h-4" />
                support@hero-sms.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
