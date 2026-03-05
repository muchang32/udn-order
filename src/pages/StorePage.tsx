import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Pencil, Trash2, ExternalLink, X, AlertTriangle } from "lucide-react";
import { useStore } from "@/hooks/useStores";
import { useFullMenu } from "@/hooks/useMenu";
import { useOrders, useCreateOrder, useUpdateOrder, useDeleteOrder } from "@/hooks/useOrders";
import { Order } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Tab = "order" | "history";

const StorePage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const { toast } = useToast();

  const { data: store, isLoading: storeLoading } = useStore(storeId);
  const { data: menuData, isLoading: menuLoading } = useFullMenu(storeId);

  // Use Supabase as the single source of truth
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders, isFetching } = useOrders(storeId);

  const addOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const [activeTab, setActiveTab] = useState<Tab>("order");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [item, setItem] = useState("");
  const [size, setSize] = useState<"M" | "L">("M");
  const [temperature, setTemperature] = useState("");
  const [sweetness, setSweetness] = useState("");
  const [topping, setTopping] = useState("");
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isFormDisabled, setIsFormDisabled] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingOrder) {
      setName(editingOrder.customer_name);
      setItem(editingOrder.item_name);
      setSize(editingOrder.size);
      setTemperature(editingOrder.temperature);
      setSweetness(editingOrder.sweetness);
      setTopping(editingOrder.topping || "");
      setIsFormDisabled(false);
    }
  }, [editingOrder]);

  // Get menu options
  const sugarOptions = useMemo(() =>
    menuData?.options.filter(o => o.option_type === 'sugar') || [],
    [menuData]
  );

  const iceOptions = useMemo(() =>
    menuData?.options.filter(o => o.option_type === 'ice') || [],
    [menuData]
  );

  const toppingOptions = useMemo(() =>
    menuData?.options.filter(o => o.option_type === 'topping') || [],
    [menuData]
  );

  // Get selected item details
  const selectedItem = useMemo(() => {
    if (!item || !menuData?.categories) return null;
    for (const category of menuData.categories) {
      const found = category.items.find(i => i.name === item);
      if (found) return found;
    }
    return null;
  }, [item, menuData]);

  // Check if size is available (price > 0)
  const isSizeMAvailable = selectedItem ? selectedItem.price_m > 0 : true;
  const isSizeLAvailable = selectedItem ? selectedItem.price_l > 0 : true;

  // Auto-select available size when item changes
  useEffect(() => {
    if (selectedItem) {
      if (size === "M" && !isSizeMAvailable && isSizeLAvailable) {
        setSize("L");
      } else if (size === "L" && !isSizeLAvailable && isSizeMAvailable) {
        setSize("M");
      }
    }
  }, [selectedItem, isSizeMAvailable, isSizeLAvailable, size]);

  // Calculate price
  const calculatePrice = useMemo(() => {
    if (!selectedItem) return 0;
    const basePrice = size === "M" ? selectedItem.price_m : selectedItem.price_l;
    const toppingItem = toppingOptions.find(t => t.name === topping);
    const toppingPrice = toppingItem?.price || 0;
    return basePrice + toppingPrice;
  }, [selectedItem, size, topping, toppingOptions]);

  // Handle name blur for duplicate check
  const handleNameBlur = () => {
    if (!name.trim()) return;
    if (editingOrder && editingOrder.customer_name === name) return;

    const isDuplicate = orders.some(order => order.customer_name === name.trim());

    if (isDuplicate) {
      setShowDuplicateDialog(true);
      setIsFormDisabled(true);
    }
  };

  const handleClearName = () => {
    setName("");
    setIsFormDisabled(false);
  };

  const resetForm = () => {
    setName("");
    setItem("");
    setSize("M");
    setTemperature("");
    setSweetness("");
    setTopping("");
    setIsFormDisabled(false);
    setEditingOrder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !item || !temperature || !sweetness || !store?.name) {
      return;
    }

    // Price limit validation
    if (store.max_price_per_item && store.max_price_per_item > 0 && calculatePrice > store.max_price_per_item) {
      toast({
        title: "超過預算上限",
        description: `此商品金額 $${calculatePrice} 已超過預算上限 $${store.max_price_per_item}，無法加入訂單`,
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      store_id: store.id,
      customer_name: name.trim(),
      item_name: item,
      size: size as "M" | "L",
      temperature,
      sweetness,
      topping: topping || null,
      price: calculatePrice,
    };

    try {
      if (editingOrder && editingOrder.id) {
        await updateOrder.mutateAsync({
          id: editingOrder.id,
          ...orderData,
        });
        toast({
          title: "訂單已更新",
          description: `${name} 的訂單已成功更新`,
        });
      } else {
        await addOrder.mutateAsync(orderData);
        toast({
          title: "訂單已送出",
          description: `${name} 的訂單已成功送出`,
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "發生錯誤",
        description: "無法處理訂單，請稍後再試",
        variant: "destructive",
      });
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setActiveTab("order");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !storeId || !deleteTarget.id) return;

    try {
      await deleteOrder.mutateAsync({
        storeId,
        id: deleteTarget.id
      });
      toast({
        title: "訂單已刪除",
        description: `${deleteTarget.customer_name} 的訂單已成功刪除`,
      });
    } catch (error) {
      toast({
        title: "發生錯誤",
        description: "無法刪除訂單，請稍後再試",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const isFormValid = name.trim() && item && temperature && sweetness && !isFormDisabled;

  if (storeLoading || menuLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mx-auto mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">找不到店家</h2>
          <Link to="/" className="text-primary hover:underline">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首頁
          </Link>
          <h1 className="text-2xl font-bold text-foreground text-center">
            {store.name}點餐系統
          </h1>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-secondary/30 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("order")}
            className={`tab-button ${activeTab === "order" ? "tab-active" : "tab-inactive"}`}
          >
            點餐
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`tab-button ${activeTab === "history" ? "tab-active" : "tab-inactive"}`}
          >
            訂單紀錄
          </button>
        </div>

        {/* Content */}
        {activeTab === "order" ? (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                姓名<span className="required-star">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  disabled={isFormDisabled && !editingOrder}
                  className="form-field pr-10"
                  placeholder="請輸入姓名"
                />
                {name && (
                  <button
                    type="button"
                    onClick={handleClearName}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Item Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                品項<span className="required-star">*</span>
              </label>
              <select
                value={item}
                onChange={(e) => setItem(e.target.value)}
                disabled={isFormDisabled}
                className="form-field appearance-none cursor-pointer"
              >
                <option value="">請選擇品項</option>
                {menuData?.categories.map((category) => (
                  <optgroup key={category.id} label={category.name}>
                    {category.items.map((menuItem) => {
                      const hasMPrice = menuItem.price_m > 0;
                      const hasLPrice = menuItem.price_l > 0;
                      const priceDisplay = hasMPrice && hasLPrice
                        ? `M$${menuItem.price_m}/L$${menuItem.price_l}`
                        : hasMPrice
                          ? `M$${menuItem.price_m}`
                          : `L$${menuItem.price_l}`;
                      return (
                        <option key={menuItem.id} value={menuItem.name}>
                          {menuItem.name} ({priceDisplay})
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Size Toggle */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">容量</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSize("M")}
                  disabled={isFormDisabled || !isSizeMAvailable}
                  className={`btn-size ${size === "M" ? "btn-size-active" : "btn-size-inactive"} ${!isSizeMAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  M{!isSizeMAvailable && selectedItem ? "" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setSize("L")}
                  disabled={isFormDisabled || !isSizeLAvailable}
                  className={`btn-size ${size === "L" ? "btn-size-active" : "btn-size-inactive"} ${!isSizeLAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  L{!isSizeLAvailable && selectedItem ? "" : ""}
                </button>
              </div>
            </div>

            {/* Temperature Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                溫度<span className="required-star">*</span>
              </label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                disabled={isFormDisabled}
                className="form-field appearance-none cursor-pointer"
              >
                <option value="">請選擇溫度</option>
                {iceOptions.map((opt) => (
                  <option key={opt.id} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sweetness Select */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                甜度<span className="required-star">*</span>
              </label>
              <select
                value={sweetness}
                onChange={(e) => setSweetness(e.target.value)}
                disabled={isFormDisabled}
                className="form-field appearance-none cursor-pointer"
              >
                <option value="">請選擇甜度</option>
                {sugarOptions.map((opt) => (
                  <option key={opt.id} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topping Select */}
            {toppingOptions.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">加料</label>
                <select
                  value={topping}
                  onChange={(e) => setTopping(e.target.value)}
                  disabled={isFormDisabled}
                  className="form-field appearance-none cursor-pointer"
                >
                  <option value="">無</option>
                  {toppingOptions.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}{t.price > 0 ? ` (+$${t.price})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Current Price */}
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <span className="text-sm text-muted-foreground">目前金額</span>
              <p className="text-3xl font-bold text-primary mt-1">
                ${calculatePrice}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              {editingOrder && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-12 flex-1 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-secondary transition-all"
                >
                  取消修改
                </button>
              )}
              <button
                type="submit"
                disabled={!isFormValid || addOrder.isPending || updateOrder.isPending}
                className="btn-primary flex-1"
              >
                {addOrder.isPending || updateOrder.isPending ? "處理中..." : (editingOrder ? "更新訂單" : "送出訂單")}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Header with Refresh Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">訂單列表</h2>
              <button
                onClick={() => refetchOrders()}
                disabled={isFetching}
                className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                aria-label="重新整理"
              >
                <RefreshCw className={`w-5 h-5 ${isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Loading State */}
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : orders.length === 0 ? (
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
                          onClick={() => handleEditOrder(order)}
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
                    <p className="text-xs text-muted-foreground mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Google Sheets Link removed - sensitive URL only accessible via admin panel */}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-8 py-4 text-sm text-muted-foreground">
          © 2026 {store.name}點餐系統
        </footer>
      </div>

      {/* Duplicate Name Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive" />
              <span>重複姓名</span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{name}</span> 已經有訂單了，若需要修改或刪除品項，請至「訂單紀錄」頁面操作。
            </p>
          </div>
          <Button
            onClick={() => {
              setShowDuplicateDialog(false);
              setActiveTab("history");
            }}
            className="w-full h-12"
          >
            前往訂單紀錄
          </Button>
        </DialogContent>
      </Dialog>

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
};

export default StorePage;
