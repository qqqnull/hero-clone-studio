import { useTranslation } from 'react-i18next';

export function AnnouncementBar() {
  const { t } = useTranslation();

  return (
    <div className="bg-announcement-gradient text-white py-3 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium">
            {t('announcement.text')}
          </span>
        </div>
      </div>
    </div>
  );
}
