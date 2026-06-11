import { createClient } from "@supabase/supabase-js";

import { sharedAuthStorage } from "@/lib/shared-auth-storage";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase =
  createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage: sharedAuthStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
