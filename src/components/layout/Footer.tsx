import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import logoImage from '@/assets/logo.png';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src={logoImage} alt="HEROSMS" className="h-8 w-auto brightness-0 invert" />
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-base mb-4">{t('footer.links.title')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/60 hover:text-white transition-colors text-sm">
                  {t('footer.links.home')}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-white/60 hover:text-white transition-colors text-sm">
                  {t('footer.links.pricing')}
                </Link>
              </li>
              <li>
                <Link to="/api" className="text-white/60 hover:text-white transition-colors text-sm">
                  {t('footer.links.api')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/60 hover:text-white transition-colors text-sm">
                  {t('footer.links.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-base mb-4">{t('footer.legal.title')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-white/60 hover:text-white transition-colors text-sm">
                  {t('footer.legal.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/60 hover:text-white transition-colors text-sm">
                  {t('footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-white/60 hover:text-white transition-colors text-sm">
                  {t('footer.legal.refund')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-base mb-4">{t('footer.contact.title')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-white/60 text-sm">
                <Mail className="w-4 h-4" />
                <span>{t('footer.contact.email')}</span>
              </li>
              <li className="flex items-center space-x-2 text-white/60 text-sm">
                <Send className="w-4 h-4" />
                <span>{t('footer.contact.telegram')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/40 text-sm">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}
