import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function ChatWidget() {
  const [telegramUrl, setTelegramUrl] = useState<string>('https://t.me/herosms_support');

  useEffect(() => {
    const fetchSupportLink = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'support_link')
          .maybeSingle();

        if (data?.value) {
          setTelegramUrl(data.value);
        }
      } catch (e) {
        console.error('Error fetching support link:', e);
      }
    };
    fetchSupportLink();
  }, []);

  useEffect(() => {
    if (document.getElementById('lovable-chat-widget')) return;

    const s = document.createElement('script');
    s.id = 'lovable-chat-widget';
    s.src = 'https://clgfrowsysmiwbxyccag.supabase.co/storage/v1/object/public/widget/chat-widget.js';
    s.onload = () => {
      if ((window as any).LovableChat) {
        (window as any).LovableChat.init({
          site: 'HEROSMS',
          primaryColor: '#10b981',
          position: 'bottom-left',
          title: '在线客服',
          telegramUrl: telegramUrl,
          telegramLabel: 'Telegram 客服',
          chatLabel: '在线客服'
        });
      }
    };
    document.body.appendChild(s);

    return () => {
      // Widget is meant to persist; no cleanup needed
    };
  }, [telegramUrl]);

  return null;
}
