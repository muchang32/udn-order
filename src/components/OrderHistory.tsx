import { RefreshCw, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Order } from "@/types/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface OrderHistoryProps {
  orders: Order[];
  onRefresh: () => void;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  spreadsheetUrl?: string | null;
}

export function OrderHistory({
  orders,
  onRefresh,
  onEdit,
  onDelete,
  isLoading,
  spreadsheetUrl,
}: OrderHistoryProps) {
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">訂單列表</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
          aria-label="重新整理"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Order Cards */}
      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>目前沒有訂單</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <div
              key={order.id}
              className="order-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                  <p className="text-primary font-bold text-xl">${order.price}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(order)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="修改"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(order)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    aria-label="刪除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {order.item_name}·{order.size}·{order.temperature}·{order.sweetness}·{order.topping || "無"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Google Sheets Link */}
      {spreadsheetUrl && (
        <a
          href={spreadsheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 text-primary hover:text-primary/80 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Google Sheets</span>
        </a>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除 <span className="font-semibold">{deleteTarget?.customer_name}</span> 的訂單嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
