import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppSetting {
  id: string;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch all app settings
export function useAppSettings() {
  return useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");

      if (error) throw error;
      return data as AppSetting[];
    },
  });
}

// Fetch a specific setting by key
export function useAppSetting(key: string) {
  return useQuery({
    queryKey: ["app_settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", key)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as AppSetting | null;
    },
  });
}

// Update a setting
export function useUpdateAppSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string | null }) => {
      const { data, error } = await supabase
        .from("app_settings")
        .update({ value })
        .eq("key", key)
        .select()
        .single();

      if (error) throw error;
      return data as AppSetting;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
      queryClient.invalidateQueries({ queryKey: ["app_settings", data.key] });
    },
  });
}


