import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json(401, { error: "Missing auth token" });

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller via service client (works with new signing-keys JWTs)
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json(401, { error: "Invalid token" });

    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) return json(403, { error: "Forbidden: admin only" });

    const { action, payload } = await req.json();

    switch (action) {
      case "create_user": {
        const { email, password, makeAdmin } = payload || {};
        if (!email || !password) return json(400, { error: "email/password required" });
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (error) return json(400, { error: error.message });
        if (makeAdmin && data.user) {
          await admin.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
        }
        return json(200, { success: true, user: { id: data.user?.id, email: data.user?.email } });
      }

      case "update_password": {
        const { user_id, password } = payload || {};
        if (!user_id || !password) return json(400, { error: "user_id/password required" });
        const { error } = await admin.auth.admin.updateUserById(user_id, { password });
        if (error) return json(400, { error: error.message });
        return json(200, { success: true });
      }

      case "delete_user": {
        const { user_id } = payload || {};
        if (!user_id) return json(400, { error: "user_id required" });
        if (user_id === userData.user.id) return json(400, { error: "Cannot delete yourself" });
        const { error } = await admin.auth.admin.deleteUser(user_id);
        if (error) return json(400, { error: error.message });
        return json(200, { success: true });
      }

      case "ban_user": {
        const { user_id, duration } = payload || {};
        if (!user_id) return json(400, { error: "user_id required" });
        if (user_id === userData.user.id) return json(400, { error: "Cannot ban yourself" });
        // duration e.g. "876000h" (~100 years) for permanent ban
        const ban_duration = duration || "876000h";
        const { error } = await admin.auth.admin.updateUserById(user_id, { ban_duration } as never);
        if (error) return json(400, { error: error.message });
        return json(200, { success: true });
      }

      case "unban_user": {
        const { user_id } = payload || {};
        if (!user_id) return json(400, { error: "user_id required" });
        const { error } = await admin.auth.admin.updateUserById(user_id, { ban_duration: "none" } as never);
        if (error) return json(400, { error: error.message });
        return json(200, { success: true });
      }

      case "list_users": {
        // Returns auth users with banned_until info
        const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 });
        if (error) return json(400, { error: error.message });
        const users = data.users.map((u) => ({
          id: u.id,
          email: u.email,
          banned_until: (u as { banned_until?: string }).banned_until || null,
          last_sign_in_at: u.last_sign_in_at,
        }));
        return json(200, { users });
      }

      default:
        return json(400, { error: "Unknown action" });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json(500, { error: message });
  }
});
