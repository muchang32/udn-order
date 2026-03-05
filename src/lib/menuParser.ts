import { MenuImportJSON } from "@/types/database";

export interface ParseMenuResult {
  success: boolean;
  menu?: MenuImportJSON;
  error?: string;
}

import { supabase } from "@/integrations/supabase/client";

async function callGemini(contents: any[]): Promise<ParseMenuResult> {
  try {
    const { data, error } = await supabase.functions.invoke('parse-menu', {
      body: { contents }
    });

    if (error) {
       console.error("Supabase Edge Function Error:", error);
       return { success: false, error: `Edge Function 查詢失敗: ${error.message}` };
    }

    if (!data.success) {
       return { success: false, error: data.error || "Edge Function 解析失敗" };
    }

    return { success: true, menu: data.menu };
  } catch (err) {
    console.error("Gemini Parse Exception:", err);
    return { success: false, error: "呼叫後端服務時發生網路連線失敗" };
  }
}

/**
 * Parse menu from image using AI vision
 */
export async function parseMenuFromImage(imageBase64: string): Promise<ParseMenuResult> {
  // Extract base64 part
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const mimeType = imageBase64.includes(';') ? imageBase64.split(';')[0].split(':')[1] : 'image/jpeg';

  const contents = [
    {
      role: "user",
      parts: [
        { text: "請分析這張菜單圖片，提取所有飲品項目並轉換成標準 JSON 格式。" },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        }
      ]
    }
  ];

  return callGemini(contents);
}

/**
 * Parse menu from text using AI
 */
export async function parseMenuFromText(text: string): Promise<ParseMenuResult> {
  const contents = [
    {
      role: "user",
      parts: [
        { text: `請解析以下菜單文字並轉換成標準 JSON 格式：\n\n${text}` }
      ]
    }
  ];

  return callGemini(contents);
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
