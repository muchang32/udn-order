import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, LogOut, Store as StoreIcon, Settings, Save, Check, ArrowLeft as BackIcon, Users, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStores, useCreateStore, useUpdateStore, useDeleteStore } from "@/hooks/useStores";
import { useImportMenu } from "@/hooks/useMenu";

import { Store, MenuImportJSON } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { UserManagement } from "@/components/UserManagement";
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
import { SmartMenuImport } from "@/components/SmartMenuImport";
import { MenuPreview } from "@/components/MenuPreview";
import { MenuEditor } from "@/components/MenuEditor";
import { AdminStoreCard } from "@/components/AdminStoreCard";


const AdminPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isSuperAdmin, isLoading: authLoading, isRoleLoading, signOut } = useAuth();

  const { data: stores, isLoading: storesLoading } = useAdminStores();
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();
  const deleteStore = useDeleteStore();
  const importMenu = useImportMenu();



  const [showUserManagementDialog, setShowUserManagementDialog] = useState(false);

  // Store form state
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeName, setStoreName] = useState("");
  const [brandColor, setBrandColor] = useState("#D4AF37");
  const [logoUrl, setLogoUrl] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);

  // Budget limit state
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetStore, setBudgetStore] = useState<Store | null>(null);
  const [budgetValue, setBudgetValue] = useState("");

  // Menu import state
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [selectedStoreForMenu, setSelectedStoreForMenu] = useState<Store | null>(null);
  const [parsedMenu, setParsedMenu] = useState<MenuImportJSON | null>(null);

  // Menu edit state
  const [showMenuEditDialog, setShowMenuEditDialog] = useState(false);
  const [selectedStoreForEdit, setSelectedStoreForEdit] = useState<Store | null>(null);

  // Check authentication on mount - wait for role loading to complete
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



  const handleOpenStoreDialog = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setStoreName(store.name);
      setBrandColor(store.brand_color);
      setLogoUrl(store.logo_url || "");
    } else {
      setEditingStore(null);
      setStoreName("");
      setBrandColor("#D4AF37");
      setLogoUrl("");
    }
    setShowStoreDialog(true);
  };

  const handleSaveStore = async () => {
    if (!storeName.trim()) {
      toast({
        title: "請輸入店家名稱",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingStore) {
        await updateStore.mutateAsync({
          id: editingStore.id,
          name: storeName.trim(),
          brand_color: brandColor,
          logo_url: logoUrl.trim() || null,
        });
        toast({
          title: "店家已更新",
          description: `${storeName} 的資料已成功更新`,
        });
      } else {
        await createStore.mutateAsync({
          name: storeName.trim(),
          brand_color: brandColor,
          logo_url: logoUrl.trim() || null,
        });
        toast({
          title: "店家已新增",
          description: `${storeName} 已成功建立`,
        });
      }
      setShowStoreDialog(false);
    } catch (error) {
      toast({
        title: "發生錯誤",
        description: "無法儲存店家資料",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStore = async () => {
    if (!deleteTarget) return;

    try {
      await deleteStore.mutateAsync(deleteTarget.id);
      toast({
        title: "店家已刪除",
        description: `${deleteTarget.name} 已成功刪除`,
      });
    } catch (error) {
      toast({
        title: "發生錯誤",
        description: "無法刪除店家",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleOpenMenuDialog = (store: Store) => {
    setSelectedStoreForMenu(store);
    setParsedMenu(null);
    setShowMenuDialog(true);
  };

  const handleMenuParsed = (menu: MenuImportJSON) => {
    setParsedMenu(menu);
  };

  const handleOpenMenuEditDialog = (store: Store) => {
    setSelectedStoreForEdit(store);
    setShowMenuEditDialog(true);
  };

  const handleBackToImport = () => {
    setParsedMenu(null);
  };

  const handleImportMenu = async () => {
    if (!selectedStoreForMenu || !parsedMenu) return;

    try {
      await importMenu.mutateAsync({
        storeId: selectedStoreForMenu.id,
        menuData: parsedMenu,
      });
      toast({
        title: "菜單已導入",
        description: `${selectedStoreForMenu.name} 的菜單已成功更新`,
      });
      setShowMenuDialog(false);
    } catch (error) {
      toast({
        title: "導入失敗",
        description: "無法導入菜單資料",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Show loading while checking auth or role
  if (authLoading || isRoleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首頁
            </Link>
            <div className="flex gap-2">
              {isSuperAdmin && (
                <Button onClick={() => setShowUserManagementDialog(true)} variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  使用者
                </Button>
              )}
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                登出
              </Button>
            </div>
          </div>
          <h1 className="text-2xl font-bold">管理後台</h1>
          <p className="text-muted-foreground">管理店家與菜單</p>
        </header>

        {/* Add Store Button */}
        <div className="flex justify-end mb-6">
          <Button onClick={() => handleOpenStoreDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            新增店家
          </Button>
        </div>

        {/* Store List */}
        {storesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : !stores || stores.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <StoreIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">尚無店家</h2>
            <p className="text-muted-foreground">點擊「新增店家」開始建立</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stores.map((store) => (
              <AdminStoreCard
                key={store.id}
                store={store}
                onImportMenu={handleOpenMenuDialog}
                onEditMenu={handleOpenMenuEditDialog}
                onEditStore={handleOpenStoreDialog}
                onDeleteStore={setDeleteTarget}
                onBudgetLimit={(s) => {
                  setBudgetStore(s);
                  setBudgetValue(s.max_price_per_item?.toString() || "");
                  setShowBudgetDialog(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Store Dialog */}
      <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStore ? "編輯店家" : "新增店家"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                店家名稱<span className="required-star">*</span>
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="form-field"
                placeholder="例：50嵐"
              />
            </div>


            <div className="space-y-2">
              <label className="block text-sm font-medium">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="form-field"
                placeholder="https://example.com/logo.png"
              />
            </div>


          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowStoreDialog(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveStore}
              disabled={createStore.isPending || updateStore.isPending}
              className="flex-1"
            >
              {editingStore ? "更新" : "建立"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Import Dialog */}
      <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {parsedMenu && (
                <Button variant="ghost" size="icon" onClick={handleBackToImport} className="h-8 w-8">
                  <BackIcon className="w-4 h-4" />
                </Button>
              )}
              菜單導入精靈 - {selectedStoreForMenu?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {!parsedMenu ? (
              <SmartMenuImport
                onMenuParsed={handleMenuParsed}
                isImporting={importMenu.isPending}
              />
            ) : (
              <div className="space-y-4">
                <MenuPreview menu={parsedMenu} onMenuChange={setParsedMenu} editable={true} />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBackToImport}
                    className="flex-1"
                  >
                    返回修改
                  </Button>
                  <Button
                    onClick={handleImportMenu}
                    disabled={importMenu.isPending}
                    className="flex-1"
                  >
                    {importMenu.isPending ? "導入中..." : "儲存至資料庫"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>



      {/* User Management Dialog */}
      {user && (
        <UserManagement
          open={showUserManagementDialog}
          onOpenChange={setShowUserManagementDialog}
          currentUserId={user.id}
        />
      )}

      {/* Menu Edit Dialog */}
      <Dialog open={showMenuEditDialog} onOpenChange={setShowMenuEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              編輯菜單 - {selectedStoreForEdit?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {selectedStoreForEdit && (
              <MenuEditor
                storeId={selectedStoreForEdit.id}
                storeName={selectedStoreForEdit.name}
                onClose={() => setShowMenuEditDialog(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Store Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除 <span className="font-semibold">{deleteTarget?.name}</span> 嗎？
              此操作會同時刪除該店家的所有菜單和訂單資料，且無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStore}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Budget Limit Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              預算限制 - {budgetStore?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                單品金額上限
              </label>
              <input
                type="number"
                min="0"
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                className="form-field"
                placeholder="留空表示不限制"
              />
              <p className="text-xs text-muted-foreground">
                設定後，點餐金額超過此上限時會顯示警告並阻止送出。留空或設為 0 表示不限制。
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBudgetDialog(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                if (!budgetStore) return;
                const val = budgetValue.trim() ? parseInt(budgetValue) : null;
                try {
                  await updateStore.mutateAsync({
                    id: budgetStore.id,
                    max_price_per_item: val && val > 0 ? val : null,
                  });
                  toast({ title: "預算限制已更新" });
                  setShowBudgetDialog(false);
                } catch {
                  toast({ title: "更新失敗", variant: "destructive" });
                }
              }}
              disabled={updateStore.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
