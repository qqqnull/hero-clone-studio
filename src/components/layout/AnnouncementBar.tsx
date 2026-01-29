import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';

export function AnnouncementBar() {
  const { t } = useTranslation();

  return (
    <div className="bg-announcement-gradient text-white py-2 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-2 text-sm font-medium">
          <Megaphone className="w-4 h-4 animate-pulse" />
          <span className="animate-marquee whitespace-nowrap">
            {t('announcement.text')}
          </span>
        </div>
      </div>
    </div>
  );
}
