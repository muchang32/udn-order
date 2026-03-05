import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MENU_PARSE_PROMPT = `你是一個專業精準的飲料店菜單資料輸入員。請務必「逐字逐句」掃描圖片，確保不遺漏任何一個品項，並將其轉換為標準的 JSON 格式。

輸出格式要求：
{
  "categories": [
    {
      "name": "分類名稱",
      "items": [
        { "name": "品項名稱", "price_m": 中杯價格, "price_l": 大杯價格, "is_special": false }
      ]
    }
  ],
  "options": {
    "sugar": ["正常糖", "少糖", "半糖", "微糖", "無糖"],   // 請確認圖片上是否有標示甜度選項，有的話請完全依照圖片標示擷取，若無則給予這組預設值
    "ice": ["正常冰", "少冰", "微冰", "去冰", "完全去冰", "溫", "熱"], // 請尋找圖片上的「溫度」或「冰量」選項。完全依照圖片擷取。若圖片完全沒有標示，才給予這組常見預設值（不含常溫）。
    "topping": [{"name": "珍珠", "price": 10}, {"name": "椰果", "price": 10}]
  }
}

解析嚴格規則（請務必遵守）：
1. 完整性：請確保每一行、每一列的飲料名稱都被抓出來，絕對不能漏掉任何飲品！如果是模糊的字，請根據常見手搖飲名稱進行合理推測。
2. 分類名稱 (極度重要)：請看清楚圖片上的原始分類名稱，有時候可能會是用垂直排版、或者是寫在圓圈內的特殊字體（例如：「品茗精選」、「手路調飲」、「鮮萃果香」）。**請務必「一字不漏、完全照抄」圖片上看到的字**，絕對、絕對不可以自己發明或替換成你認為比較通順的詞彙（例如把「品茗」改成「晶選」，把「手路」改成「手炒」等都是嚴格禁止的錯誤行為）。
3. 價格與尺寸認定 (極度重要)：
   - "35/40" 表示 M:35, L:40
   - "M:35 L:40" 表示 M:35, L:40
   - 當品項只有單一價格時，**請仔細往上看該區塊最上方的欄位標題（通常會標示 M 或 L）**。
   - 請根據該單一價格是「對齊在 M 欄位正下方」還是「對齊在 L 欄位正下方」來決定。如果是對齊 M，請寫在 price_m，price_l 給 null。如果是對齊 L，請寫在 price_l，price_m 給 null。
   - 只有在完全沒有 M / L 標題可以依靠對齊來判斷時，才可以預設寫在大杯 (price_l)，中杯 (price_m) 給 null。
   - 絕對不要自己推算或發明額外的金額！沒有的尺寸必須給 null (不要加引號)。
4. is_special 設為 true 的條件：只限基底茶類（如紅茶、綠茶、青茶、烏龍茶等純茶）。其他加奶或加料的飲料都是 false。
5. 選項預設值：
   - 「甜度(sugar)」與「溫度/冰量(ice)」請「務必優先尋找圖片上是否有明確標示」。
   - 例如圖片若寫了「正常冰/少冰/微冰/去冰/完全去冰/常溫/溫/熱」，請完全照抄。
   - **如果圖片上「完全沒有」標示冰塊溫度或甜度，才允許提供一組基本預設值**給sugar和ice。其中ice(溫度)的基本預設建議為："正常冰", "少冰", "微冰", "去冰", "完全去冰", "溫", "熱"（請不要自作主張加入常溫，除非圖片有寫）。
   - topping如無標示則給予空陣列 []。
6. 加料價格：如果菜單中沒有標明加料價格，金額預設為 0。

請深呼吸，仔細檢查：(1)分類名稱有沒有照抄 (2)單一價格有沒有乖乖對齊M/L欄位。最後只輸出完整的 JSON，不要有任何 Markdown tag 或其他文字說明。`;

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!rawApiKey) {
      throw new Error("Edge Function 尚未設定 GEMINI_API_KEY 環境變數");
    }
    
    // Check request JSON payload
    const { contents } = await req.json();
    if (!contents || !Array.isArray(contents)) {
      throw new Error("無效的請求格式: 缺少 contents 陣列");
    }

    // Insert the actual system prompt at the beginning of the text portion inside the first content part payload
    if (contents[0]?.parts?.[0]) {
       // Just appending the prompt string directly before whatever dynamic instruction is there
       contents[0].parts[0].text = MENU_PARSE_PROMPT + "\n\n" + contents[0].parts[0].text;
    }

    // Make the request to Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${rawApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Gemini API Error:", response.status, errorData);
      
      let errorMsg = `API 錯誤 (${response.status})`;
      if (response.status === 429) {
        errorMsg = "API 請求過於頻繁，請稍後再試。";
      } else if (response.status === 404) {
        errorMsg = `Google API 拒絕存取 (404): ${errorData?.error?.message || "找不到該模型"}`;
      } else if (response.status === 400) {
        errorMsg = `請求格式錯誤 (400): ${errorData?.error?.message || ""}`;
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(
        JSON.stringify({ success: false, error: "AI 回傳內容為空" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let parsedMenu = JSON.parse(text);

    // Validate and patch structure
    if (!parsedMenu.categories || !Array.isArray(parsedMenu.categories)) {
      throw new Error("解析結果缺少 categories");
    }

    if (!parsedMenu.options) {
      parsedMenu.options = {
        sugar: ["無糖", "微糖", "半糖", "少糖", "正常甜"],
        ice: ["正常冰", "少冰", "微冰", "去冰", "溫", "熱"],
        toppings: [
          { name: "珍珠", price: 0 },
        ],
      };
    }

    // Return the successful parsed JSON
    return new Response(
      JSON.stringify({ success: true, menu: parsedMenu }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (err: any) {
    console.error("Parse Function Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "伺服器內部錯誤" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
