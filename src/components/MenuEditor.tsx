import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuPreview } from "@/components/MenuPreview";
import { useFullMenu, useImportMenu } from "@/hooks/useMenu";
import { useToast } from "@/hooks/use-toast";
import { MenuImportJSON } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";

interface MenuEditorProps {
  storeId: string;
  storeName: string;
  onClose: () => void;
}

/**
 * Convert database menu format to MenuImportJSON format for editing
 */
function convertToImportFormat(menuData: {
  categories: Array<{
    id: string;
    name: string;
    items: Array<{
      name: string;
      price_m: number;
      price_l: number;
      is_special: boolean;
    }>;
  }>;
  options: Array<{
    option_type: string;
    name: string;
    price: number;
  }>;
}): MenuImportJSON {
  return {
    categories: menuData.categories.map((cat) => ({
      name: cat.name,
      items: cat.items.map((item) => ({
        name: item.name,
        price_m: item.price_m || null,
        price_l: item.price_l || null,
        is_special: item.is_special,
      })),
    })),
    options: {
      sugar: menuData.options
        .filter((o) => o.option_type === "sugar")
        .map((o) => o.name),
      ice: menuData.options
        .filter((o) => o.option_type === "ice")
        .map((o) => o.name),
      toppings: menuData.options
        .filter((o) => o.option_type === "topping")
        .map((o) => ({
          name: o.name,
          price: o.price,
        })),
    },
  };
}

export function MenuEditor({ storeId, storeName, onClose }: MenuEditorProps) {
  const { toast } = useToast();
  const { data: menuData, isLoading } = useFullMenu(storeId);
  const importMenu = useImportMenu();

  const [editableMenu, setEditableMenu] = useState<MenuImportJSON | null>(null);

  // Convert database format to editable format when data loads
  useEffect(() => {
    if (menuData && menuData.categories.length > 0) {
      setEditableMenu(convertToImportFormat(menuData));
    }
  }, [menuData]);

  const handleSave = async () => {
    if (!editableMenu) return;

    try {
      await importMenu.mutateAsync({
        storeId,
        menuData: editableMenu,
      });
      toast({
        title: "菜單已更新",
        description: `${storeName} 的菜單已成功儲存`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "儲存失敗",
        description: "無法儲存菜單資料",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!menuData || menuData.categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">此店家尚未設定菜單</p>
        <Button variant="outline" onClick={onClose}>
          返回
        </Button>
      </div>
    );
  }

  if (!editableMenu) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MenuPreview
        menu={editableMenu}
        onMenuChange={setEditableMenu}
        editable={true}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          取消
        </Button>
        <Button
          onClick={handleSave}
          disabled={importMenu.isPending}
          className="flex-1"
        >
          {importMenu.isPending ? "儲存中..." : "儲存變更"}
        </Button>
      </div>
    </div>
  );
}
