import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function FloatingSupportButton() {
  const [supportLink, setSupportLink] = useState<string>('https://t.me/herosms_support');

  useEffect(() => {
    const fetchSupportLink = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'support_link')
          .maybeSingle();

        if (data?.value) {
          setSupportLink(data.value);
        }
      } catch (e) {
        console.error('Error fetching support link:', e);
      }
    };
    fetchSupportLink();
  }, []);

  return (
    <a
      href={supportLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
      title="联系客服"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute right-full mr-3 bg-foreground text-background text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        联系客服
      </span>
    </a>
  );
}