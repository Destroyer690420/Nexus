import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
      );
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// Backward-compatible export (lazy proxy)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
