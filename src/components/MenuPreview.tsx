import { useState } from "react";
import { MenuImportJSON } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MenuPreviewProps {
  menu: MenuImportJSON;
  onMenuChange?: (menu: MenuImportJSON) => void;
  editable?: boolean;
}

export function MenuPreview({ menu, onMenuChange, editable = true }: MenuPreviewProps) {
  const [editingItem, setEditingItem] = useState<{ catIndex: number; itemIndex: number } | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingOption, setEditingOption] = useState<{ type: 'sugar' | 'ice' | 'topping'; index: number } | null>(null);
  const [editValues, setEditValues] = useState<{
    name?: string;
    price_m?: string;
    price_l?: string;
    catName?: string;
    optionName?: string;
    optionPrice?: string;
  }>({});

  const totalItems = menu.categories.reduce((sum, cat) => sum + cat.items.length, 0);

  const updateMenu = (newMenu: MenuImportJSON) => {
    onMenuChange?.(newMenu);
  };

  // Category actions
  const startEditCategory = (catIndex: number) => {
    setEditingCategory(catIndex);
    setEditValues({ catName: menu.categories[catIndex].name });
  };

  const saveEditCategory = () => {
    if (editingCategory === null || !editValues.catName?.trim()) return;
    const newMenu = { ...menu };
    newMenu.categories = [...menu.categories];
    newMenu.categories[editingCategory] = {
      ...newMenu.categories[editingCategory],
      name: editValues.catName.trim(),
    };
    updateMenu(newMenu);
    setEditingCategory(null);
    setEditValues({});
  };

  const deleteCategory = (catIndex: number) => {
    const newMenu = { ...menu };
    newMenu.categories = menu.categories.filter((_, i) => i !== catIndex);
    updateMenu(newMenu);
  };

  const addCategory = () => {
    const newMenu = { ...menu };
    newMenu.categories = [...menu.categories, { name: "新分類", items: [] }];
    updateMenu(newMenu);
  };

  // Item actions
  const startEditItem = (catIndex: number, itemIndex: number) => {
    const item = menu.categories[catIndex].items[itemIndex];
    setEditingItem({ catIndex, itemIndex });
    setEditValues({
      name: item.name,
      price_m: item.price_m?.toString() ?? "",
      price_l: item.price_l?.toString() ?? "",
    });
  };

  const saveEditItem = () => {
    if (!editingItem || !editValues.name?.trim()) return;
    const { catIndex, itemIndex } = editingItem;

    const priceM = editValues.price_m?.trim() ? parseFloat(editValues.price_m) : null;
    const priceL = editValues.price_l?.trim() ? parseFloat(editValues.price_l) : null;

    // At least one price must be valid
    if (priceM === null && priceL === null) return;

    const newMenu = { ...menu };
    newMenu.categories = [...menu.categories];
    newMenu.categories[catIndex] = {
      ...newMenu.categories[catIndex],
      items: [...newMenu.categories[catIndex].items],
    };
    newMenu.categories[catIndex].items[itemIndex] = {
      ...newMenu.categories[catIndex].items[itemIndex],
      name: editValues.name.trim(),
      price_m: priceM,
      price_l: priceL,
    };
    updateMenu(newMenu);
    setEditingItem(null);
    setEditValues({});
  };

  const deleteItem = (catIndex: number, itemIndex: number) => {
    const newMenu = { ...menu };
    newMenu.categories = [...menu.categories];
    newMenu.categories[catIndex] = {
      ...newMenu.categories[catIndex],
      items: menu.categories[catIndex].items.filter((_, i) => i !== itemIndex),
    };
    updateMenu(newMenu);
  };

  const addItem = (catIndex: number) => {
    const newMenu = { ...menu };
    newMenu.categories = [...menu.categories];
    newMenu.categories[catIndex] = {
      ...newMenu.categories[catIndex],
      items: [...menu.categories[catIndex].items, { name: "新品項", price_m: null, price_l: 50 }],
    };
    updateMenu(newMenu);
  };

  // Option actions
  const startEditOption = (type: 'sugar' | 'ice' | 'topping', index: number) => {
    setEditingOption({ type, index });
    if (type === 'topping') {
      const topping = menu.options.toppings[index];
      setEditValues({ optionName: topping.name, optionPrice: topping.price.toString() });
    } else {
      setEditValues({ optionName: menu.options[type][index] });
    }
  };

  const saveEditOption = () => {
    if (!editingOption || !editValues.optionName?.trim()) return;
    const { type, index } = editingOption;

    const newMenu = { ...menu, options: { ...menu.options } };

    if (type === 'topping') {
      newMenu.options.toppings = [...menu.options.toppings];
      newMenu.options.toppings[index] = {
        name: editValues.optionName.trim(),
        price: parseFloat(editValues.optionPrice || "0") || 0,
      };
    } else {
      newMenu.options[type] = [...menu.options[type]];
      newMenu.options[type][index] = editValues.optionName.trim();
    }

    updateMenu(newMenu);
    setEditingOption(null);
    setEditValues({});
  };

  const deleteOption = (type: 'sugar' | 'ice' | 'topping', index: number) => {
    const newMenu = { ...menu, options: { ...menu.options } };

    if (type === 'topping') {
      newMenu.options.toppings = menu.options.toppings.filter((_, i) => i !== index);
    } else {
      newMenu.options[type] = menu.options[type].filter((_, i) => i !== index);
    }

    updateMenu(newMenu);
  };

  const addOption = (type: 'sugar' | 'ice' | 'topping') => {
    const newMenu = { ...menu, options: { ...menu.options } };

    if (type === 'topping') {
      newMenu.options.toppings = [...menu.options.toppings, { name: "新加料", price: 10 }];
    } else {
      newMenu.options[type] = [...menu.options[type], "新選項"];
    }

    updateMenu(newMenu);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditingCategory(null);
    setEditingOption(null);
    setEditValues({});
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) {
      return <span className="block text-center text-muted-foreground">-</span>;
    }
    return `$${price}`;
  };

  const renderOptionTag = (type: 'sugar' | 'ice', value: string, index: number) => {
    const isEditing = editingOption?.type === type && editingOption?.index === index;
    const tagId = `${type}-${index}`;

    return (
      <div
        key={index}
        data-tag-id={tagId}
        className="relative bg-card rounded-md border text-sm flex items-center justify-center group overflow-hidden min-h-[32px] min-w-[76px]"
      >
        {isEditing ? (
          <div className="flex flex-row items-center gap-1 px-1">
            <Input
              value={editValues.optionName || ""}
              onChange={(e) => setEditValues({ ...editValues, optionName: e.target.value })}
              className="h-6 w-16 text-xs px-1"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEditOption}>
              <Check className="w-3.5 h-3.5 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
              <X className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        ) : (
          <>
            <span className="px-3 py-1.5 transition-opacity duration-200 group-hover:opacity-20">{value}</span>
            {editable && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-background/60 backdrop-blur-[2px] transition-all duration-200">
                <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full shadow hover:bg-primary hover:text-primary-foreground" onClick={() => startEditOption(type, index)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="destructive" className="h-6 w-6 rounded-full shadow" onClick={() => deleteOption(type, index)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderToppingTag = (topping: { name: string; price: number }, index: number) => {
    const isEditing = editingOption?.type === 'topping' && editingOption?.index === index;
    const tagId = `topping-${index}`;

    return (
      <div
        key={index}
        data-tag-id={tagId}
        className="relative bg-card rounded-md border text-sm flex items-center justify-center group overflow-hidden min-h-[32px] min-w-[80px]"
      >
        {isEditing ? (
          <div className="flex flex-row items-center gap-1 px-1">
            <Input
              value={editValues.optionName || ""}
              onChange={(e) => setEditValues({ ...editValues, optionName: e.target.value })}
              className="h-6 w-16 text-xs px-1"
              placeholder="名稱"
              autoFocus
            />
            <Input
              value={editValues.optionPrice || ""}
              onChange={(e) => setEditValues({ ...editValues, optionPrice: e.target.value })}
              className="h-6 w-12 text-xs px-1"
              placeholder="價格"
              type="number"
            />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEditOption}>
              <Check className="w-3.5 h-3.5 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
              <X className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        ) : (
          <>
            <span className="px-3 py-1.5 transition-opacity duration-200 group-hover:opacity-20">
              {topping.name}{topping.price > 0 ? ` (+$${topping.price})` : ""}
            </span>
            {editable && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-background/60 backdrop-blur-[2px] transition-all duration-200">
                <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full shadow hover:bg-primary hover:text-primary-foreground" onClick={() => startEditOption('topping', index)}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="destructive" className="h-6 w-6 rounded-full shadow" onClick={() => deleteOption('topping', index)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">預覽確認</h3>
        {editable && (
          <span className="text-xs text-muted-foreground">點擊項目可編輯</span>
        )}
      </div>

      {/* Categories Summary */}
      <div className="bg-secondary/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">
            分類 ({menu.categories.length} 個) · 共 {totalItems} 個品項
          </h4>
          {editable && (
            <Button size="sm" variant="outline" onClick={addCategory}>
              <Plus className="w-3 h-3 mr-1" />
              新增分類
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {menu.categories.map((cat, i) => {
            const tagId = `category-${i}`;
            return (
              <div
                key={i}
                data-tag-id={tagId}
                className="relative bg-card rounded-md border text-sm flex items-center justify-center group overflow-hidden min-h-[32px] min-w-[80px]"
              >
                {editingCategory === i ? (
                  <div className="flex flex-row items-center gap-1 px-1">
                    <Input
                      value={editValues.catName || ""}
                      onChange={(e) => setEditValues({ ...editValues, catName: e.target.value })}
                      className="h-6 w-16 text-xs px-1"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEditCategory}>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="px-3 py-1.5 transition-opacity duration-200 group-hover:opacity-20">{cat.name} ({cat.items.length})</span>
                    {editable && (
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-background/60 backdrop-blur-[2px] transition-all duration-200">
                        <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full shadow hover:bg-primary hover:text-primary-foreground" onClick={() => startEditCategory(i)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-6 w-6 rounded-full shadow" onClick={() => deleteCategory(i)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-secondary/30 rounded-lg p-4 overflow-x-auto">
        <h4 className="text-sm font-medium mb-2">品項明細</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>分類</TableHead>
              <TableHead>品項</TableHead>
              <TableHead className="text-right">M 價格</TableHead>
              <TableHead className="text-right">L 價格</TableHead>
              {editable && <TableHead className="w-20"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {menu.categories.flatMap((cat, catIndex) => [
              ...cat.items.map((item, itemIndex) => {
                const isEditing = editingItem?.catIndex === catIndex && editingItem?.itemIndex === itemIndex;
                return (
                  <TableRow key={`${cat.name}-${itemIndex}`}>
                    <TableCell className="text-muted-foreground">{cat.name}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editValues.name || ""}
                          onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                          className="h-7 w-full"
                          autoFocus
                        />
                      ) : (
                        item.name
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          value={editValues.price_m || ""}
                          onChange={(e) => setEditValues({ ...editValues, price_m: e.target.value })}
                          className="h-7 w-16 text-right ml-auto"
                          placeholder="-"
                        />
                      ) : (
                        formatPrice(item.price_m)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          value={editValues.price_l || ""}
                          onChange={(e) => setEditValues({ ...editValues, price_l: e.target.value })}
                          className="h-7 w-16 text-right ml-auto"
                          placeholder="-"
                        />
                      ) : (
                        formatPrice(item.price_l)
                      )}
                    </TableCell>
                    {editable && (
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEditItem}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEditItem(catIndex, itemIndex)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteItem(catIndex, itemIndex)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              }),
              // Add item button row
              editable && (
                <TableRow key={`add-item-${catIndex}`} className="hover:bg-transparent">
                  <TableCell className="text-muted-foreground">{cat.name}</TableCell>
                  <TableCell colSpan={editable ? 4 : 3}>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addItem(catIndex)}>
                      <Plus className="w-3 h-3 mr-1" />
                      新增品項
                    </Button>
                  </TableCell>
                </TableRow>
              ),
            ])}
          </TableBody>
        </Table>
      </div>

      {/* Options Preview - Now Editable */}
      <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
        <h4 className="text-sm font-medium">選項設定</h4>

        {/* Sugar Options */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">甜度</p>
            {editable && (
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addOption('sugar')}>
                <Plus className="w-3 h-3 mr-1" />
                新增
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {menu.options.sugar.length > 0
              ? menu.options.sugar.map((s, i) => renderOptionTag('sugar', s, i))
              : <span className="text-sm text-muted-foreground">無</span>
            }
          </div>
        </div>

        {/* Ice Options */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">溫度</p>
            {editable && (
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addOption('ice')}>
                <Plus className="w-3 h-3 mr-1" />
                新增
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {menu.options.ice.length > 0
              ? menu.options.ice.map((s, i) => renderOptionTag('ice', s, i))
              : <span className="text-sm text-muted-foreground">無</span>
            }
          </div>
        </div>

        {/* Topping Options */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">加料</p>
            {editable && (
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addOption('topping')}>
                <Plus className="w-3 h-3 mr-1" />
                新增
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {menu.options.toppings.length > 0
              ? menu.options.toppings.map((t, i) => renderToppingTag(t, i))
              : <span className="text-sm text-muted-foreground">無</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
}