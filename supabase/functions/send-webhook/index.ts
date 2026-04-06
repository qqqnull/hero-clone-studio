import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

const getConfiguredWebhookUrl = async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing backend credentials for webhook lookup');
    return '';
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'webhook_url')
    .maybeSingle();

  if (error) {
    console.error('Failed to load configured webhook URL:', error);
    return '';
  }

  return data?.value?.trim() ?? '';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const payload = body?.payload;

    if (!payload || typeof payload !== 'object') {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid payload' }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const webhookUrl = typeof body?.webhook_url === 'string' && body.webhook_url.trim()
      ? body.webhook_url.trim()
      : await getConfiguredWebhookUrl();

    if (!webhookUrl) {
      console.log('No webhook URL configured');
      return new Response(
        JSON.stringify({ success: true, message: 'No webhook configured' }),
        { headers: jsonHeaders }
      );
    }

    console.log('Sending webhook to:', webhookUrl);
    console.log('Payload:', JSON.stringify(payload));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let result;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = { message: await response.text() };
    }

    console.log('Webhook response status:', response.status);
    console.log('Webhook response:', result);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Webhook failed with status ${response.status}`,
          response: result 
        }),
        { 
          status: 200, // Return 200 to client even if webhook failed
          headers: jsonHeaders 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent successfully',
        response: result 
      }),
      { headers: jsonHeaders }
    );

  } catch (error) {
    console.error('Error sending webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 200, // Return 200 to prevent client-side errors
        headers: jsonHeaders 
      }
    );
  }
});
