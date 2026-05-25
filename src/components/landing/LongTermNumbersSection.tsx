import { useTranslation } from 'react-i18next';
import { Lock, RefreshCw, Wallet, Shield } from 'lucide-react';

export function LongTermNumbersSection() {
  const { t } = useTranslation();

  const features = [
    { icon: Lock, key: 'lock' },
    { icon: Wallet, key: 'fee' },
    { icon: RefreshCw, key: 'renew' },
    { icon: Shield, key: 'grace' },
  ] as const;

  return (
    <section className="py-16 lg:py-20 relative overflow-hidden">
      {/* Purple gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#735AE7] via-[#8B6FF0] to-[#5B47C7]" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_35%)]" />

      <div className="relative container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs font-semibold tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5" />
            {t('longTerm.badge')}
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {t('longTerm.title')}
          </h2>
          <p className="text-white/85 text-base lg:text-lg leading-relaxed">
            {t('longTerm.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {features.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 hover:bg-white/15 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1.5">
                {t(`longTerm.features.${key}.title`)}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {t(`longTerm.features.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-3xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 lg:p-6">
          <div className="text-white/90 text-sm leading-relaxed space-y-2">
            <p>• <strong>{t('longTerm.rule1Title')}：</strong>{t('longTerm.rule1')}</p>
            <p>• <strong>{t('longTerm.rule2Title')}：</strong>{t('longTerm.rule2')}</p>
            <p>• <strong>{t('longTerm.rule3Title')}：</strong>{t('longTerm.rule3')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
