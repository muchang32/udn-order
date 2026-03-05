import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MenuCategory, MenuItem, MenuOption, MenuCategoryWithItems, MenuImportJSON } from "@/types/database";

export function useMenuCategories(storeId: string | undefined) {
  return useQuery({
    queryKey: ["menu-categories", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as MenuCategory[];
    },
  });
}

export function useMenuItems(categoryIds: string[]) {
  return useQuery({
    queryKey: ["menu-items", categoryIds],
    enabled: categoryIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .in("category_id", categoryIds);

      if (error) throw error;
      return data as MenuItem[];
    },
  });
}

export function useMenuOptions(storeId: string | undefined) {
  return useQuery({
    queryKey: ["menu-options", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_options")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as MenuOption[];
    },
  });
}

export function useFullMenu(storeId: string | undefined) {
  return useQuery({
    queryKey: ["full-menu", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      // Fetch categories
      const { data: categories, error: catError } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true });

      if (catError) throw catError;

      if (!categories || categories.length === 0) {
        return { categories: [], options: [] };
      }

      // Fetch items for all categories
      const categoryIds = categories.map((c) => c.id);
      const { data: items, error: itemError } = await supabase
        .from("menu_items")
        .select("*")
        .in("category_id", categoryIds);

      if (itemError) throw itemError;

      // Fetch options
      const { data: options, error: optError } = await supabase
        .from("menu_options")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true });

      if (optError) throw optError;

      // Combine categories with items
      const categoriesWithItems: MenuCategoryWithItems[] = categories.map((cat) => ({
        ...cat,
        items: (items || []).filter((item) => item.category_id === cat.id),
      }));

      return {
        categories: categoriesWithItems,
        options: (options || []) as MenuOption[],
      };
    },
  });
}

export function useImportMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storeId,
      menuData,
    }: {
      storeId: string;
      menuData: MenuImportJSON;
    }) => {
      // Clear existing menu data for this store
      await supabase.from("menu_options").delete().eq("store_id", storeId);
      
      const { data: existingCategories } = await supabase
        .from("menu_categories")
        .select("id")
        .eq("store_id", storeId);
      
      if (existingCategories && existingCategories.length > 0) {
        const categoryIds = existingCategories.map((c) => c.id);
        await supabase.from("menu_items").delete().in("category_id", categoryIds);
        await supabase.from("menu_categories").delete().eq("store_id", storeId);
      }

      // Insert new categories
      for (let i = 0; i < menuData.categories.length; i++) {
        const category = menuData.categories[i];
        
        const { data: newCategory, error: catError } = await supabase
          .from("menu_categories")
          .insert({
            store_id: storeId,
            name: category.name,
            sort_order: i,
          })
          .select()
          .single();

        if (catError) throw catError;

        // Insert items for this category
        if (category.items.length > 0) {
          const items = category.items.map((item) => ({
            category_id: newCategory.id,
            name: item.name,
            // Handle nullable prices - default to 0 if null
            price_m: item.price_m ?? 0,
            price_l: item.price_l ?? 0,
            is_special: item.is_special || false,
          }));

          const { error: itemError } = await supabase
            .from("menu_items")
            .insert(items);

          if (itemError) throw itemError;
        }
      }

      // Insert sugar options
      if (menuData.options.sugar.length > 0) {
        const sugarOptions = menuData.options.sugar.map((name, index) => ({
          store_id: storeId,
          option_type: "sugar" as const,
          name,
          price: 0,
          sort_order: index,
        }));

        const { error: sugarError } = await supabase
          .from("menu_options")
          .insert(sugarOptions);

        if (sugarError) throw sugarError;
      }

      // Insert ice options
      if (menuData.options.ice.length > 0) {
        const iceOptions = menuData.options.ice.map((name, index) => ({
          store_id: storeId,
          option_type: "ice" as const,
          name,
          price: 0,
          sort_order: index,
        }));

        const { error: iceError } = await supabase
          .from("menu_options")
          .insert(iceOptions);

        if (iceError) throw iceError;
      }

      // Insert topping options
      if (menuData.options.toppings.length > 0) {
        const toppingOptions = menuData.options.toppings.map((topping, index) => ({
          store_id: storeId,
          option_type: "topping" as const,
          name: topping.name,
          price: topping.price,
          sort_order: index,
        }));

        const { error: toppingError } = await supabase
          .from("menu_options")
          .insert(toppingOptions);

        if (toppingError) throw toppingError;
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["full-menu", variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ["menu-categories", variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ["menu-options", variables.storeId] });
    },
  });
}
