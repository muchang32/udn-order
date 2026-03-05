import { useState } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  User,
  Trash2,
  Loader2,
  ChevronDown,
  UserPlus,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  useAllUsers,
  useUpdateUserRole,
  useDeleteUser,
} from "@/hooks/useUserManagement";
import { useAddAdmin } from "@/hooks/useAdminManagement";
import { Skeleton } from "@/components/ui/skeleton";

interface UserManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export function UserManagement({
  open,
  onOpenChange,
  currentUserId,
}: UserManagementProps) {
  const { toast } = useToast();
  const { data: users, isLoading } = useAllUsers();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const addAdmin = useAddAdmin();

  const [newUserEmail, setNewUserEmail] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    userId: string;
    email: string | null;
  } | null>(null);

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "請輸入 Email",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await addAdmin.mutateAsync(newUserEmail);
      toast({
        title: "使用者已新增為管理員",
        description: `${result.display_name || result.email} 已成為管理員`,
      });
      setNewUserEmail("");
    } catch (error) {
      toast({
        title: "新增失敗",
        description: error instanceof Error ? error.message : "無法新增使用者",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "admin" | "user") => {
    try {
      await updateRole.mutateAsync({ userId, newRole });
      toast({
        title: "角色已更新",
        description: `使用者角色已更改為 ${newRole === "admin" ? "管理員" : "一般使用者"}`,
      });
    } catch (error) {
      toast({
        title: "更新失敗",
        description: error instanceof Error ? error.message : "無法更新角色",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    try {
      await deleteUser.mutateAsync(deleteTarget.userId);
      toast({
        title: "使用者已刪除",
        description: `${deleteTarget.email || "使用者"} 的帳號已移除`,
      });
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: error instanceof Error ? error.message : "無法刪除使用者",
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

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "super_admin":
        return (
          <Badge variant="default" className="bg-primary hover:bg-primary/90">
            <ShieldCheck className="w-3 h-3 mr-1" />
            最高管理者
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="secondary">
            <Shield className="w-3 h-3 mr-1" />
            管理員
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <User className="w-3 h-3 mr-1" />
            一般使用者
          </Badge>
        );
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return "?";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              使用者管理
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add User Form */}
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="輸入 Email 新增使用者..."
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
                className="flex-1"
              />
              <Button onClick={handleAddUser} disabled={addAdmin.isPending}>
                {addAdmin.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">新增使用者</span>
              </Button>
            </div>

            {/* User List */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>尚無使用者</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>使用者</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>註冊日期</TableHead>
                    <TableHead className="w-[120px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {getInitials(user.display_name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.display_name || "未設定名稱"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email || "無 Email"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* Role dropdown - disabled for super_admin and self */}
                          {user.role !== "super_admin" &&
                            user.id !== currentUserId && (
                              <>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={updateRole.isPending}
                                    >
                                      {updateRole.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          角色
                                          <ChevronDown className="w-3 h-3 ml-1" />
                                        </>
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleUpdateRole(user.id, "admin")
                                      }
                                      disabled={user.role === "admin"}
                                    >
                                      <Shield className="w-4 h-4 mr-2" />
                                      設為管理員
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleUpdateRole(user.id, "user")
                                      }
                                      disabled={
                                        user.role === "user" || !user.role
                                      }
                                    >
                                      <User className="w-4 h-4 mr-2" />
                                      設為一般使用者
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setDeleteTarget({
                                      userId: user.id,
                                      email: user.email,
                                    })
                                  }
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          {user.id === currentUserId && (
                            <span className="text-xs text-muted-foreground">
                              (你自己)
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>* 最高管理者無法被更改或刪除</p>
              <p>* 管理員可以管理店家與菜單</p>
              <p>* 一般使用者只能瀏覽，無法進入後台</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此使用者？</AlertDialogTitle>
            <AlertDialogDescription>
              將刪除 {deleteTarget?.email || "此使用者"}{" "}
              的帳號。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
