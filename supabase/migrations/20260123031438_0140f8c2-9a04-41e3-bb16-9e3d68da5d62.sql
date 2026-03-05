-- 刪除現有的 SELECT 政策
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

-- 建立新的 SELECT 政策：使用者可以查看自己的角色，管理員可以查看所有角色
CREATE POLICY "Users can view own roles or admins can view all"
ON user_roles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.is_admin()
);