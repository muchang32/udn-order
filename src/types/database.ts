// Database types for the multi-store ordering platform

export interface Store {
  id: string;
  name: string;
  brand_color: string;
  logo_url: string | null;
  google_sheet_url: string | null;
  spreadsheet_url?: string | null;
  max_price_per_item: number | null;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  store_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  price_m: number;
  price_l: number;
  description: string | null;
  is_special: boolean;
  created_at: string;
}

export interface MenuOption {
  id: string;
  store_id: string;
  option_type: 'sugar' | 'ice' | 'topping';
  name: string;
  price: number;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  item_name: string;
  size: 'M' | 'L';
  temperature: string;
  sweetness: string;
  topping: string | null;
  price: number;
  created_at: string;
}

// Menu import JSON format
export interface MenuImportJSON {
  categories: {
    name: string;
    items: {
      name: string;
      price_m: number | null;  // null if only L size available
      price_l: number | null;  // null if only M size available
      is_special?: boolean;
    }[];
  }[];
  options: {
    sugar: string[];
    ice: string[];
    toppings: {
      name: string;
      price: number;
    }[];
  };
}

// Extended types with relations
export interface MenuCategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

export interface StoreWithMenu extends Store {
  categories: MenuCategoryWithItems[];
  options: MenuOption[];
}
