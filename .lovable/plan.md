

## 統一 AdminStoreCard 按鈕高度

目前「導入菜單」和「編輯菜單」使用 `size="sm"`，而「預算限制」、「編輯」、「刪除」使用 `size="icon"`，導致高度不一致。

### 修改內容

**檔案：`src/components/AdminStoreCard.tsx`**

將「導入菜單」和「編輯菜單」兩個按鈕的 `size` 從 `"sm"` 改為 `"icon"`，並將文字標籤移除（改用 `title` 屬性提示），使所有按鈕統一為正方形圖示按鈕。

或者，若希望保留文字標籤，則為這兩個按鈕加上明確的高度 class（如 `h-9`）來對齊 `size="icon"` 的高度。

### 建議方案：保留文字 + 統一高度

在「導入菜單」和「編輯菜單」的 Button 上加入 `className="h-9"` 使其與 icon 按鈕同高（shadcn `size="icon"` 預設為 `h-9 w-9`）。

