import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw, Trash2, ListOrdered, Calculator, Users, Pencil, Check, X } from "lucide-react";
import { useStore } from "@/hooks/useStores";
import { useFullMenu } from "@/hooks/useMenu";
import { useOrders, useDeleteOrder, useClearOrders, useUpdateOrder } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Order } from "@/types/database";

const OrdersPage = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Auth Check
    const { user, isAdmin, isLoading: authLoading, isRoleLoading } = useAuth();

    const { data: store, isLoading: storeLoading } = useStore(storeId);
    const { data: menuData, isLoading: menuLoading } = useFullMenu(storeId);
    const { data: orders = [], isLoading: ordersLoading, refetch, isFetching } = useOrders(storeId);
    const deleteOrder = useDeleteOrder();
    const clearOrders = useClearOrders();
    const updateOrder = useUpdateOrder();

    const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
    const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

    // Inline editing states
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<Order>>({});

    // Menu options for editing
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

    const allItems = useMemo(() => {
        if (!menuData?.categories) return [];
        return menuData.categories.flatMap(cat => cat.items);
    }, [menuData]);

    // Handle Option Changes automatically calculating prices
    const handleItemChange = (itemName: string) => {
        const item = allItems.find(i => i.name === itemName);
        if (!item) return;

        let newSize = editValues.size;
        if (newSize === 'M' && item.price_m === 0 && item.price_l > 0) newSize = 'L';
        if (newSize === 'L' && item.price_l === 0 && item.price_m > 0) newSize = 'M';
        if (!newSize) newSize = item.price_m > 0 ? 'M' : 'L';

        const basePrice = newSize === 'M' ? item.price_m : item.price_l;
        const currentTopping = toppingOptions.find(t => t.name === editValues.topping);
        const toppingPrice = currentTopping?.price || 0;

        setEditValues({
            ...editValues,
            item_name: itemName,
            size: newSize,
            price: basePrice + toppingPrice
        });
    };

    const handleSizeChange = (newSize: "M" | "L") => {
        const item = allItems.find(i => i.name === editValues.item_name);
        if (!item) {
            setEditValues({ ...editValues, size: newSize });
            return;
        }

        const basePrice = newSize === 'M' ? item.price_m : item.price_l;
        const currentTopping = toppingOptions.find(t => t.name === editValues.topping);
        const toppingPrice = currentTopping?.price || 0;

        setEditValues({
            ...editValues,
            size: newSize,
            price: basePrice + toppingPrice
        });
    };

    const handleToppingChange = (newTopping: string) => {
        const toppingName = newTopping === "none" ? "" : newTopping;
        const item = allItems.find(i => i.name === editValues.item_name);

        let basePrice = editValues.price || 0;
        if (item && editValues.size) {
            basePrice = editValues.size === 'M' ? item.price_m : item.price_l;
        }

        const newToppingObj = toppingOptions.find(t => t.name === toppingName);
        const toppingPrice = newToppingObj?.price || 0;

        setEditValues({
            ...editValues,
            topping: toppingName,
            price: basePrice + toppingPrice
        });
    };

    useEffect(() => {
        if (!authLoading && !isRoleLoading) {
            if (!user) {
                navigate("/auth");
            } else if (!isAdmin) {
                toast({
                    title: "無權限",
                    description: "您沒有管理員權限",
                    variant: "destructive",
                });
                navigate("/");
            }
        }
    }, [user, isAdmin, authLoading, isRoleLoading, navigate, toast]);

    // Derived statistics
    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
        const totalDrinks = orders.length;

        // Group by item
        const itemSummary = orders.reduce((acc, order) => {
            const key = `${order.item_name} (${order.size})`;
            if (!acc[key]) {
                acc[key] = { count: 0, revenue: 0, name: order.item_name, size: order.size };
            }
            acc[key].count += 1;
            acc[key].revenue += order.price;
            return acc;
        }, {} as Record<string, { count: number; revenue: number; name: string; size: string }>);

        return {
            totalRevenue,
            totalDrinks,
            itemSummary: Object.values(itemSummary).sort((a, b) => b.count - a.count), // Sort by most popular
        };
    }, [orders]);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget || !storeId) return;

        try {
            await deleteOrder.mutateAsync({
                id: deleteTarget.id,
                storeId: storeId
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

    const handleClearAllConfirm = async () => {
        if (!storeId) return;

        try {
            await clearOrders.mutateAsync(storeId);
            toast({
                title: "清空成功",
                description: "該店家的所有訂單已成功移除",
            });
        } catch (error) {
            toast({
                title: "發生錯誤",
                description: "無法清空訂單，請稍後再試",
                variant: "destructive",
            });
        } finally {
            setIsClearAllDialogOpen(false);
        }
    };

    const startEdit = (order: Order) => {
        setEditingOrderId(order.id);
        setEditValues(order);
    };

    const cancelEdit = () => {
        setEditingOrderId(null);
        setEditValues({});
    };

    const saveEdit = async () => {
        if (!editingOrderId) return;
        try {
            await updateOrder.mutateAsync({
                id: editingOrderId,
                ...editValues
            });
            toast({
                title: "修改成功",
                description: "訂單資料已更新",
            });
            setEditingOrderId(null);
            setEditValues({});
        } catch (error) {
            toast({
                title: "發生錯誤",
                description: "無法修改訂單，請稍後再試",
                variant: "destructive",
            });
        }
    };

    const handleExportCSV = () => {
        if (orders.length === 0) {
            toast({ title: "沒有訂單可以匯出", variant: "destructive" });
            return;
        }

        const headers = ["訂購人", "品項", "容量", "溫度", "甜度", "加料", "金額", "訂購時間"];

        const csvContent = [
            headers.join(","),
            ...orders.map(order => [
                `"${order.customer_name}"`,
                `"${order.item_name}"`,
                order.size,
                order.temperature,
                order.sweetness,
                `"${order.topping || '無'}"`,
                order.price,
                `"${new Date(order.created_at).toLocaleString()}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${store?.name || 'store'}_orders_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (authLoading || isRoleLoading || storeLoading || ordersLoading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <header className="mb-8 border-b pb-6">
                    <div className="flex justify-between items-center mb-4">
                        <Link
                            to="/admin"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            返回管理後台
                        </Link>
                        <div className="flex gap-2">
                            <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isFetching}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                                重新整理
                            </Button>
                            <Button onClick={() => setIsClearAllDialogOpen(true)} variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="w-4 h-4 mr-2" />
                                清空訂單
                            </Button>
                            <Button onClick={handleExportCSV} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                匯出 CSV
                            </Button>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {store?.name} 訂單管理
                    </h1>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card rounded-xl border p-4 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <ListOrdered className="w-4 h-4" />
                            <span className="text-sm font-medium">總杯數</span>
                        </div>
                        <p className="text-3xl font-bold">{stats.totalDrinks}</p>
                    </div>
                    <div className="bg-card rounded-xl border p-4 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Calculator className="w-4 h-4" />
                            <span className="text-sm font-medium">總金額</span>
                        </div>
                        <p className="text-3xl font-bold text-primary">${stats.totalRevenue}</p>
                    </div>
                    <div className="bg-card rounded-xl border p-4 flex flex-col justify-center lg:col-span-2">
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">餐點統計</span>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto pr-2">
                            {stats.itemSummary.length > 0 ? (
                                stats.itemSummary.map((item, idx) => (
                                    <div key={idx} className="bg-secondary/50 px-2 py-1 rounded text-sm whitespace-nowrap">
                                        {item.name} {item.size} <span className="font-semibold text-primary">×{item.count}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">目前無統計資料</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-card rounded-xl border overflow-hidden">
                    <div className="p-4 border-b bg-muted/20">
                        <h2 className="font-semibold">所有訂單明細</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">訂購人</TableHead>
                                    <TableHead>品項</TableHead>
                                    <TableHead className="w-[80px]">容量</TableHead>
                                    <TableHead className="w-[100px]">溫度/甜度</TableHead>
                                    <TableHead>加料</TableHead>
                                    <TableHead className="w-[80px] text-right">金額</TableHead>
                                    <TableHead className="w-[150px]">時間</TableHead>
                                    <TableHead className="w-[80px] text-center">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            目前沒有任何訂單
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => {
                                        const isEditing = editingOrderId === order.id;
                                        return (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">
                                                    {isEditing ? (
                                                        <Input
                                                            value={editValues.customer_name || ""}
                                                            onChange={(e) => setEditValues({ ...editValues, customer_name: e.target.value })}
                                                            className="h-8 text-sm min-w-[80px]"
                                                        />
                                                    ) : order.customer_name}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <Select value={editValues.item_name || ""} onValueChange={handleItemChange}>
                                                            <SelectTrigger className="h-8 text-sm w-[120px]">
                                                                <SelectValue placeholder="選取品項" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {allItems.map(item => (
                                                                    <SelectItem key={item.name} value={item.name}>
                                                                        {item.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : order.item_name}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <Select value={editValues.size || ""} onValueChange={(val) => handleSizeChange(val as "M" | "L")}>
                                                            <SelectTrigger className="h-8 text-sm w-16">
                                                                <SelectValue placeholder="容量" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {(() => {
                                                                    const selectedItem = allItems.find(i => i.name === editValues.item_name);
                                                                    return (
                                                                        <>
                                                                            {(!selectedItem || selectedItem.price_m > 0) && <SelectItem value="M">M</SelectItem>}
                                                                            {(!selectedItem || selectedItem.price_l > 0) && <SelectItem value="L">L</SelectItem>}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : order.size}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <div className="space-y-1">
                                                            <Select value={editValues.temperature || ""} onValueChange={(val) => setEditValues({ ...editValues, temperature: val })}>
                                                                <SelectTrigger className="h-6 text-xs w-full">
                                                                    <SelectValue placeholder="溫度" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {iceOptions.map(opt => (
                                                                        <SelectItem key={opt.name} value={opt.name}>{opt.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Select value={editValues.sweetness || ""} onValueChange={(val) => setEditValues({ ...editValues, sweetness: val })}>
                                                                <SelectTrigger className="h-6 text-xs w-full">
                                                                    <SelectValue placeholder="甜度" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {sugarOptions.map(opt => (
                                                                        <SelectItem key={opt.name} value={opt.name}>{opt.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs space-y-1 block">
                                                            <div>{order.temperature}</div>
                                                            <div className="text-muted-foreground">{order.sweetness}</div>
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {isEditing ? (
                                                        <Select value={editValues.topping || "none"} onValueChange={handleToppingChange}>
                                                            <SelectTrigger className="h-8 text-xs min-w-[80px]">
                                                                <SelectValue placeholder="加料" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">無</SelectItem>
                                                                {toppingOptions.map(opt => (
                                                                    <SelectItem key={opt.name} value={opt.name}>{opt.name} (+${opt.price})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (order.topping || '-')}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {isEditing ? (
                                                        <span className="text-sm border rounded px-2 py-1 bg-muted/50 border-input block min-w-[60px] cursor-not-allowed">
                                                            ${editValues.price || 0}
                                                        </span>
                                                    ) : `$${order.price}`}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(order.created_at).toLocaleString(undefined, {
                                                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {isEditing ? (
                                                        <div className="flex gap-1 justify-center">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={saveEdit}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={cancelEdit}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-1 justify-center">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-secondary" onClick={() => startEdit(order)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => setDeleteTarget(order)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確認移除訂單</AlertDialogTitle>
                        <AlertDialogDescription>
                            確定要移除 <span className="font-semibold text-foreground">{deleteTarget?.customer_name}</span> 的訂單嗎？
                            此操作無法復原。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            移除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Clear All Confirmation Dialog */}
            <AlertDialog open={isClearAllDialogOpen} onOpenChange={setIsClearAllDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確認清空所有訂單？</AlertDialogTitle>
                        <AlertDialogDescription>
                            確定要刪除該店家的「所有」訂單紀錄嗎？
                            這將會清空所有歷史紀錄，且此操作無法復原。如果需要建議您先匯出 CSV。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearAllConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            確認清空
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default OrdersPage;
