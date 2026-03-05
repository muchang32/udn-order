import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Store } from "@/types/database";

// Public stores query - uses stores_public view (excludes spreadsheet_url for security)
export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores_public")
        .select("id, name, brand_color, logo_url, google_sheet_url, max_price_per_item, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Store[];
    },
  });
}

// Admin stores query - uses base stores table (includes sensitive URLs)
export function useAdminStores() {
  return useQuery({
    queryKey: ["admin-stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, brand_color, logo_url, google_sheet_url, spreadsheet_url, max_price_per_item, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Store[];
    },
  });
}

// Public store query - uses stores_public view (excludes spreadsheet_url for security)
export function useStore(storeId: string | undefined) {
  return useQuery({
    queryKey: ["store", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores_public")
        .select("id, name, brand_color, logo_url, google_sheet_url, max_price_per_item, created_at, updated_at")
        .eq("id", storeId)
        .maybeSingle();

      if (error) throw error;
      return data as Store | null;
    },
  });
}

// Admin store query - uses base stores table (includes sensitive URLs)
export function useAdminStore(storeId: string | undefined) {
  return useQuery({
    queryKey: ["admin-store", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, brand_color, logo_url, google_sheet_url, spreadsheet_url, max_price_per_item, created_at, updated_at")
        .eq("id", storeId)
        .maybeSingle();

      if (error) throw error;
      return data as Store | null;
    },
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (store: Omit<Store, "id" | "created_at" | "updated_at" | "google_sheet_url" | "max_price_per_item"> & { max_price_per_item?: number | null }) => {
      const { data, error } = await supabase
        .from("stores")
        .insert(store)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...store }: Partial<Store> & { id: string }) => {
      const { data, error } = await supabase
        .from("stores")
        .update(store)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}
