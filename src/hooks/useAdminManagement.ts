import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminUser {
  id: string;
  user_id: string;
  role: "admin" | "super_admin";
  created_at: string;
  email: string | null;
  display_name: string | null;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Get all admin and super_admin roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .in("role", ["admin", "super_admin"])
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Get profile info for each user
      const userIds = roles?.map((r) => r.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Merge the data
      const adminUsers: AdminUser[] = (roles || []).map((role) => {
        const profile = profiles?.find((p) => p.id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role as "admin" | "super_admin",
          created_at: role.created_at,
          email: profile?.email || null,
          display_name: profile?.display_name || null,
        };
      });

      return adminUsers;
    },
  });
}

export function useAddAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      // First find the user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (profileError || !profile) {
        throw new Error("找不到此 Email 的使用者，請確認該使用者已註冊");
      }

      // Check if already has admin role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", profile.id)
        .single();

      if (existingRole) {
        if (existingRole.role === "super_admin") {
          throw new Error("此使用者已是最高管理者");
        }
        if (existingRole.role === "admin") {
          throw new Error("此使用者已是管理員");
        }
      }

      // Add admin role
      const { error: insertError } = await supabase.from("user_roles").insert({
        user_id: profile.id,
        role: "admin",
      });

      if (insertError) throw insertError;

      return { email: profile.email, display_name: profile.display_name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useRemoveAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
