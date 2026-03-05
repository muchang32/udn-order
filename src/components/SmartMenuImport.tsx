import { useState, useRef } from "react";
import { ImagePlus, FileText, Code, Upload, Loader2, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuImportJSON } from "@/types/database";
import { parseMenuFromImage, parseMenuFromText, fileToBase64 } from "@/lib/menuParser";
import { useToast } from "@/hooks/use-toast";

interface SmartMenuImportProps {
  onMenuParsed: (menu: MenuImportJSON) => void;
  isImporting: boolean;
}

const SAMPLE_JSON = `{
  "categories": [
    {
      "name": "找好茶",
      "items": [
        { "name": "阿薩姆紅茶", "price_m": 35, "price_l": 40 },
        { "name": "茉莉綠茶", "price_m": 35, "price_l": 40 }
      ]
    }
  ],
  "options": {
    "sugar": ["無糖", "微糖", "半糖", "少糖", "正常甜"],
    "ice": ["正常冰", "少冰", "微冰", "去冰", "溫", "熱"],
    "toppings": [
      { "name": "珍珠", "price": 0 },
      { "name": "布丁", "price": 15 }
    ]
  }
}`;

export function SmartMenuImport({ onMenuParsed, isImporting }: SmartMenuImportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image tab state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isParsingImage, setIsParsingImage] = useState(false);

  // Text tab state
  const [menuText, setMenuText] = useState("");
  const [isParsingText, setIsParsingText] = useState(false);

  // JSON tab state
  const [menuJson, setMenuJson] = useState("");
  const [jsonError, setJsonError] = useState("");

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "請選擇圖片檔案", variant: "destructive" });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "圖片大小不能超過 10MB", variant: "destructive" });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setSelectedImage(base64);
    } catch (err) {
      toast({ title: "無法讀取圖片", variant: "destructive" });
    }
  };

  const handleParseImage = async () => {
    if (!selectedImage) return;

    setIsParsingImage(true);
    try {
      const result = await parseMenuFromImage(selectedImage);
      if (result.success && result.menu) {
        toast({ title: "圖片解析成功！" });
        onMenuParsed(result.menu);
      } else {
        toast({ title: result.error || "圖片解析失敗", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "解析過程發生錯誤", variant: "destructive" });
    } finally {
      setIsParsingImage(false);
    }
  };

  const handleParseText = async () => {
    if (!menuText.trim()) {
      toast({ title: "請輸入菜單文字", variant: "destructive" });
      return;
    }

    setIsParsingText(true);
    try {
      const result = await parseMenuFromText(menuText);
      if (result.success && result.menu) {
        toast({ title: "文字解析成功！" });
        onMenuParsed(result.menu);
      } else {
        toast({ title: result.error || "文字解析失敗", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "解析過程發生錯誤", variant: "destructive" });
    } finally {
      setIsParsingText(false);
    }
  };

  const handleParseJson = () => {
    if (!menuJson.trim()) {
      setJsonError("請輸入 JSON 內容");
      return;
    }

    try {
      const parsed = JSON.parse(menuJson) as MenuImportJSON;

      // Validate structure
      if (!parsed.categories || !Array.isArray(parsed.categories)) {
        throw new Error("缺少 categories 陣列");
      }
      if (!parsed.options) {
        throw new Error("缺少 options 物件");
      }
      if (!parsed.options.sugar || !Array.isArray(parsed.options.sugar)) {
        throw new Error("缺少 options.sugar 陣列");
      }
      if (!parsed.options.ice || !Array.isArray(parsed.options.ice)) {
        throw new Error("缺少 options.ice 陣列");
      }
      if (!parsed.options.toppings || !Array.isArray(parsed.options.toppings)) {
        throw new Error("缺少 options.toppings 陣列");
      }

      setJsonError("");
      onMenuParsed(parsed);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "JSON 格式錯誤");
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Tabs defaultValue="image" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="image" className="gap-2">
          <ImagePlus className="w-4 h-4" />
          <span className="hidden sm:inline">圖片辨識</span>
          <span className="sm:hidden">圖片</span>
        </TabsTrigger>
        <TabsTrigger value="text" className="gap-2">
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">智能文字</span>
          <span className="sm:hidden">文字</span>
        </TabsTrigger>
        <TabsTrigger value="json" className="gap-2">
          <Code className="w-4 h-4" />
          JSON
        </TabsTrigger>
      </TabsList>

      {/* Image Tab */}
      <TabsContent value="image" className="space-y-4">
        <div className="text-sm text-muted-foreground">
          上傳菜單照片，AI 將自動辨識品項和價格
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {!selectedImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.add("border-primary", "bg-accent/50");
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.remove("border-primary", "bg-accent/50");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.remove("border-primary", "bg-accent/50");
              const file = e.dataTransfer.files?.[0];
              if (file) {
                // Validate file type
                if (!file.type.startsWith("image/")) {
                  toast({ title: "請選擇圖片檔案", variant: "destructive" });
                  return;
                }
                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                  toast({ title: "圖片大小不能超過 10MB", variant: "destructive" });
                  return;
                }
                fileToBase64(file).then(setSelectedImage).catch(() => {
                  toast({ title: "無法讀取圖片", variant: "destructive" });
                });
              }
            }}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium">點擊或拖放上傳菜單圖片</p>
            <p className="text-xs text-muted-foreground mt-1">支援 JPG、PNG（最大 10MB）</p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={selectedImage}
              alt="Selected menu"
              className="w-full max-h-64 object-contain rounded-lg border border-border"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={clearImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Button
          onClick={handleParseImage}
          disabled={!selectedImage || isParsingImage || isImporting}
          className="w-full"
        >
          {isParsingImage ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              AI 辨識中...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              開始辨識
            </>
          )}
        </Button>
      </TabsContent>

      {/* Text Tab */}
      <TabsContent value="text" className="space-y-4">
        <div className="text-sm text-muted-foreground">
          貼上任意格式的菜單文字（如 Excel 複製貼上），AI 將自動解析
        </div>

        <textarea
          value={menuText}
          onChange={(e) => setMenuText(e.target.value)}
          className="form-field min-h-[200px] font-mono text-sm"
          placeholder={`範例格式：
阿薩姆紅茶 M:35 L:40
珍珠奶茶 中杯50元 大杯60元
綠茶拿鐵 60/75

或 Excel 複製貼上：
品名    中杯    大杯
阿薩姆紅茶  35  40
珍珠奶茶    50  60`}
        />

        <Button
          onClick={handleParseText}
          disabled={!menuText.trim() || isParsingText || isImporting}
          className="w-full"
        >
          {isParsingText ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              AI 解析中...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              智能解析
            </>
          )}
        </Button>
      </TabsContent>

      {/* JSON Tab */}
      <TabsContent value="json" className="space-y-4">
        <div className="text-sm text-muted-foreground">
          直接貼上標準 JSON 格式（適合進階用戶）
        </div>

        <details className="bg-secondary/30 rounded-lg">
          <summary className="px-4 py-2 cursor-pointer text-sm font-medium hover:bg-secondary/50 rounded-lg">
            查看 JSON 格式範例
          </summary>
          <pre className="p-4 text-xs overflow-x-auto border-t border-border">
            {SAMPLE_JSON}
          </pre>
        </details>

        <textarea
          value={menuJson}
          onChange={(e) => {
            setMenuJson(e.target.value);
            setJsonError("");
          }}
          className="form-field min-h-[200px] font-mono text-sm"
          placeholder="貼上 JSON 格式的菜單資料..."
        />

        {jsonError && (
          <p className="text-sm text-destructive">{jsonError}</p>
        )}

        <Button
          onClick={handleParseJson}
          disabled={!menuJson.trim() || isImporting}
          className="w-full"
        >
          解析 JSON
        </Button>
      </TabsContent>
    </Tabs>
  );
}
