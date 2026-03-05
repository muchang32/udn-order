import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session) {
        // Check if user has admin or super_admin role
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .in("role", ["admin", "super_admin"])
          .maybeSingle();

        if (error) {
          // Query error (possibly RLS issue or invalid session), clear session and let user re-login
          await supabase.auth.signOut();
        } else if (roles) {
          navigate("/admin");
        } else {
          toast({
            title: "無權限",
            description: "您沒有管理員權限，請聯繫管理員",
            variant: "destructive",
          });
          await supabase.auth.signOut();
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Defer Supabase calls with setTimeout to avoid deadlock
        setTimeout(async () => {
          // Check admin or super_admin role
          const { data: roles, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .in("role", ["admin", "super_admin"])
            .maybeSingle();

          if (error) {
            await supabase.auth.signOut();
          } else if (roles) {
            toast({
              title: "登入成功",
              description: "歡迎進入管理後台",
            });
            navigate("/admin");
          } else {
            toast({
              title: "無權限",
              description: "您沒有管理員權限，請聯繫管理員",
              variant: "destructive",
            });
            await supabase.auth.signOut();
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
        }
      });

      if (error) {
        throw error;
      }

      // The onAuthStateChange listener will handle navigation
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "登入失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">管理後台登入</h1>
          <p className="text-muted-foreground mt-2">
            使用 Google 帳號登入管理後台
          </p>
        </div>

        <Button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-12 text-base"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          使用 Google 帳號登入
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          只有管理員才能登入後台
        </p>

        <div className="text-center">
          <a
            href="/"
            className="text-sm text-primary hover:underline"
          >
            返回首頁
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
