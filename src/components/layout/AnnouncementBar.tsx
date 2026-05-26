import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function AnnouncementBar() {
  const { t } = useTranslation();
  const messages = [t('announcement.text'), t('announcement.gift')];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % messages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="bg-announcement-gradient text-white py-3 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center min-h-[1.25rem]">
          <span
            key={idx}
            className="text-sm font-medium text-center animate-in fade-in slide-in-from-bottom-1 duration-500"
          >
            {messages[idx]}
          </span>
        </div>
      </div>
    </div>
  );
}
