import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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
    { label: t('footer.refund2'), href: '/refund' },
  ];

  return (
    <footer className="bg-[#2d3a5f] text-white py-12">
      <div className="container mx-auto px-4">
        {/* Main Links Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              <span className="text-primary">HERO</span>
              <span className="text-white/70">SMS</span>
            </span>
          </Link>

          {/* Main Navigation */}
          <nav className="flex flex-wrap gap-8">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-white/80 hover:text-white transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Legal Links Row */}
        <div className="flex flex-wrap gap-8 pt-6 border-t border-white/10">
          {legalLinks.map((link, index) => (
            <Link
              key={index}
              to={link.href}
              className="text-white/50 hover:text-white/80 transition-colors text-xs"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
