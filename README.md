# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 如何將此專案部署至 GitHub Pages

此專案已經包含了一組自動部署的 GitHub Actions 腳本（位於 `.github/workflows/deploy.yml`）。只要跟著以下步驟設定，您的專案就能在每次推送到 `main` 分支時，自動更新並發布到 GitHub Pages。

### 步驟 1：在 GitHub 設定環境變數 (Secrets)
雖然 Gemini API 在這版系統中已經移至安全的後端，但前端依舊需要知道您的 Supabase 連線資訊。請至您的 GitHub Repository 進行設定：
1. 進入 Repository 頁面，點擊 **Settings** (設定)。
2. 展開左側選單的 **Secrets and variables**，並點擊 **Actions**。
3. 點擊綠色的 **New repository secret** 按鈕，依序加入以下四個 Secrets（數值請對應您的 `.env.example` 或實際開發環境）：
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_GEMINI_API_KEY` （若您的專案前端還有殘留對此變數的檢查，保險起見請一併建立）

### 步驟 2：開啟 GitHub Pages 的 Actions 權限
1. 同樣在 **Settings** 頁面。
2. 點開左側選單的 **Pages**。
3. 在 **Build and deployment** 區塊中，將 **Source** 下拉選單改為 **GitHub Actions**。

### 步驟 3：推送程式碼
將程式碼 Push 到 GitHub 的 `main` 分支（或 master，依您的預設而定）。
完成後，點擊網頁上方的 **Actions** 標籤頁，您應該會看到 `Deploy to GitHub Pages` 正在執行。等待它變成綠色勾勾後，您的網站便成功上線了！

---

## 關於安全性的叮嚀
這是一個建立在 Vite 上的純前端網頁。部署在 GitHub Pages 時：
- `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_PUBLISHABLE_KEY` (Anon Key) **會被公開打包在原始碼中**，這是完全正常且標準的做法。
- 此系統依賴 **Supabase 的 RLS (Row Level Security)** 保護您的資料。請務必至您的 Supabase 後台為每一張資料表設定存取規則，避免有心人士利用公開的 Anon Key 惡意刪除資料。
- 掌管 AI 支出的 **Gemini API 金鑰（`GEMINI_API_KEY`）** 已被移至後端（Supabase Edge Functions），因此不會在前端外洩給大眾。
