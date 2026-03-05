import { useState } from "react";
import { Shield, ShieldCheck, UserPlus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminUsers, useAddAdmin, useRemoveAdmin } from "@/hooks/useAdminManagement";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export function AdminManagement({ open, onOpenChange, currentUserId }: AdminManagementProps) {
  const { toast } = useToast();
  const { data: adminUsers, isLoading } = useAdminUsers();
  const addAdmin = useAddAdmin();
  const removeAdmin = useRemoveAdmin();

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; email: string | null } | null>(null);

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "請輸入 Email",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await addAdmin.mutateAsync(newAdminEmail);
      toast({
        title: "管理員已新增",
        description: `${result.display_name || result.email} 已成為管理員`,
      });
      setNewAdminEmail("");
    } catch (error) {
      toast({
        title: "新增失敗",
        description: error instanceof Error ? error.message : "無法新增管理員",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAdmin = async () => {
    if (!deleteTarget) return;

    try {
      await removeAdmin.mutateAsync(deleteTarget.userId);
      toast({
        title: "管理員已移除",
        description: `${deleteTarget.email || "使用者"} 的管理權限已移除`,
      });
    } catch (error) {
      toast({
        title: "移除失敗",
        description: "無法移除管理員",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              管理員管理
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add Admin Form */}
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="輸入使用者 Email 以新增管理員..."
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAdmin()}
                className="flex-1"
              />
              <Button onClick={handleAddAdmin} disabled={addAdmin.isPending}>
                {addAdmin.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">新增管理員</span>
              </Button>
            </div>

            {/* Admin List */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !adminUsers || adminUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>尚無管理員</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>使用者</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>新增日期</TableHead>
                    <TableHead className="w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {admin.display_name || "未設定名稱"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {admin.email || "無 Email"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin.role === "super_admin" ? (
                          <Badge variant="default" className="bg-primary hover:bg-primary/90">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            最高管理者
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Shield className="w-3 h-3 mr-1" />
                            管理員
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(admin.created_at)}
                      </TableCell>
                      <TableCell>
                        {admin.role !== "super_admin" && admin.user_id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setDeleteTarget({
                                userId: admin.user_id,
                                email: admin.email,
                              })
                            }
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <p className="text-xs text-muted-foreground">
              * 最高管理者無法被移除。管理員可以管理店家與菜單。
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要移除此管理員？</AlertDialogTitle>
            <AlertDialogDescription>
              將移除 {deleteTarget?.email || "此使用者"} 的管理員權限。此操作可以復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
