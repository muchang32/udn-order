import { useNavigate } from "react-router-dom";
import { useStores } from "@/hooks/useStores";
import { useAuth } from "@/hooks/useAuth";
import { Store, Settings, Loader2, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreCard } from "@/components/StoreCard";

const HomePage = () => {
  const { data: stores, isLoading, error } = useStores();
  const { user, isAdmin, isLoading: authLoading, isRoleLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAdminClick = () => {
    if (user && isAdmin) {
      navigate("/admin");
    } else {
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const isAuthChecking = authLoading || isRoleLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">通用飲料店點餐平台</h1>
          <p className="text-muted-foreground">選擇店家開始點餐</p>
        </header>

        {/* Admin Link & User Actions */}
        <div className="flex justify-end gap-2 mb-6">
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>登出</span>
            </button>
          )}
          <button
            onClick={handleAdminClick}
            disabled={isAuthChecking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {isAuthChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            <span>管理後台</span>
          </button>
        </div>

        {/* Store Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">載入店家時發生錯誤</p>
          </div>
        ) : !stores || stores.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">尚無店家</h2>
            <p className="text-muted-foreground mb-4">
              請先至管理後台新增店家
            </p>
            <button
              onClick={handleAdminClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Settings className="w-4 h-4" />
              前往管理後台
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 py-4 text-sm text-muted-foreground">
          © 2026 想想 通用飲料店點餐平台
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
