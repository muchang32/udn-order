import { Store as StoreIcon, Upload, FileEdit, Pencil, Trash2, DollarSign, ListOrdered } from "lucide-react";
import { Link } from "react-router-dom";
import { useLogoColor } from "@/hooks/useLogoColor";
import { Button } from "@/components/ui/button";
import { Store } from "@/types/database";

interface AdminStoreCardProps {
  store: Store;
  onImportMenu: (store: Store) => void;
  onEditMenu: (store: Store) => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (store: Store) => void;
  onBudgetLimit: (store: Store) => void;
}

export function AdminStoreCard({
  store,
  onImportMenu,
  onEditMenu,
  onEditStore,
  onDeleteStore,
  onBudgetLimit,
}: AdminStoreCardProps) {
  const logoColor = useLogoColor(store.logo_url);

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: logoColor }}
      >
        {store.logo_url ? (
          <img
            src={store.logo_url}
            alt={store.name}
            className="w-12 h-12 object-contain"
            crossOrigin="anonymous"
          />
        ) : (
          <StoreIcon className="w-8 h-8 text-white/90" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg truncate">{store.name}</h3>
        {store.max_price_per_item && (
          <p className="text-xs text-muted-foreground">預算上限：${store.max_price_per_item}</p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          variant="default"
          size="sm"
          className="h-10 px-4"
          asChild
        >
          <Link to={`/admin/store/${store.id}/orders`}>
            <ListOrdered className="w-4 h-4 mr-1" />
            查看訂單
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-10"
          onClick={() => onImportMenu(store)}
        >
          <Upload className="w-4 h-4 mr-1" />
          導入菜單
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-10"
          onClick={() => onEditMenu(store)}
        >
          <FileEdit className="w-4 h-4 mr-1" />
          編輯菜單
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onBudgetLimit(store)}
          title="預算限制"
        >
          <DollarSign className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEditStore(store)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => onDeleteStore(store)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
