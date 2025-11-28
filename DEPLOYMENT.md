# 單字填空練習應用 - Vercel 部署指南

## 快速開始

### 1. 準備工作

確保您已經：
- 創建了 GitHub 帳戶並將此專案推送到 GitHub
- 創建了 Vercel 帳戶 (https://vercel.com)
- 獲得了 DeepSeek API Key (https://platform.deepseek.com)

### 2. 連接 Vercel

1. 訪問 https://vercel.com/dashboard
2. 點擊 "Add New..." → "Project"
3. 導入您的 GitHub 倉庫
4. 選擇專案並點擊 "Import"

### 3. 配置環境變數

在 Vercel 項目設置中，添加以下環境變數：

**必需環境變數：**
- `DEEPSEEK_API_KEY` - 您的 DeepSeek API 密鑰
- `DATABASE_URL` - 數據庫連接字符串（如果使用數據庫功能）
- `JWT_SECRET` - 用於會話加密的密鑰

**可選環境變數（系統自動注入）：**
- `VITE_APP_ID` - Manus OAuth 應用 ID
- `OAUTH_SERVER_URL` - Manus OAuth 服務器 URL
- `VITE_OAUTH_PORTAL_URL` - Manus OAuth 門戶 URL
- `OWNER_OPEN_ID` - 所有者 OpenID
- `OWNER_NAME` - 所有者名稱
- `BUILT_IN_FORGE_API_URL` - Manus 內置 API URL
- `BUILT_IN_FORGE_API_KEY` - Manus 內置 API 密鑰
- `VITE_FRONTEND_FORGE_API_KEY` - 前端 Forge API 密鑰
- `VITE_FRONTEND_FORGE_API_URL` - 前端 Forge API URL

### 4. 部署

1. 在 Vercel 項目設置中配置環境變數後
2. 點擊 "Deploy" 按鈕
3. 等待部署完成（通常需要 2-5 分鐘）
4. 部署完成後，您將獲得一個公開的 URL

## 項目結構

```
word-fill-practice-js/
├── client/              # React 前端應用
│   ├── src/
│   │   ├── pages/       # 頁面組件
│   │   ├── components/  # 可重用組件
│   │   ├── lib/         # 工具函數和 tRPC 客戶端
│   │   └── App.tsx      # 主應用組件
│   └── public/          # 靜態資源
├── server/              # Express 後端服務
│   ├── routers.ts       # tRPC 路由定義
│   ├── db.ts            # 數據庫查詢助手
│   └── _core/           # 核心基礎設施
├── drizzle/             # 數據庫架構和遷移
├── package.json         # 項目依賴
├── vercel.json          # Vercel 配置
└── README.md            # 項目說明
```

## 功能特性

### 核心功能
- ✅ AI 智能生成填空練習句子（使用 DeepSeek API）
- ✅ 支持單個或批量單字練習
- ✅ 三個難度級別（簡單、中等、困難）
- ✅ 答案自動檢查和成績統計
- ✅ 單字導入/導出功能
- ✅ 響應式設計，支持移動端
- ✅ 本地備用方案（API 不可用時使用）

### 技術棧
- **前端**：React 19 + TypeScript + Tailwind CSS 4
- **後端**：Express 4 + tRPC 11 + Node.js
- **數據庫**：MySQL/TiDB（可選）
- **AI 服務**：DeepSeek API
- **部署**：Vercel

## 使用方法

1. **添加單字**：在輸入框中輸入英語單字，按 Enter 或點擊「添加」
2. **選擇難度**：從下拉菜單選擇練習難度（簡單/中等/困難）
3. **生成練習題**：點擊「生成練習題」按鈕
4. **填寫答案**：在每個句子的空白處填入正確的單字
5. **檢查答案**：點擊「檢查答案」查看成績
6. **導出/導入**：使用導出按鈕保存單字列表，導入按鈕加載之前保存的列表

## 故障排除

### API 連接失敗
- 檢查 `DEEPSEEK_API_KEY` 是否正確配置
- 確認 API Key 有足夠的配額
- 檢查網絡連接

### 部署失敗
- 檢查 `package.json` 中的依賴是否正確
- 確保所有環境變數都已配置
- 查看 Vercel 部署日誌了解詳細錯誤信息

### 性能問題
- 句子生成可能需要 2-5 秒（取決於 API 響應時間）
- 使用本地備用方案可以立即生成句子（但質量較低）

## 開發指南

### 本地開發
```bash
# 安裝依賴
pnpm install

# 啟動開發服務器
pnpm run dev

# 運行測試
pnpm test

# 構建生產版本
pnpm run build

# 啟動生產服務器
pnpm start
```

### 添加新功能
1. 在 `server/routers.ts` 中添加新的 tRPC 路由
2. 在 `client/src/pages/` 中創建相應的 UI 組件
3. 編寫測試用例確保功能正常
4. 提交代碼並部署到 Vercel

## 支持和反饋

如有問題或建議，請提交 GitHub Issue 或聯繫開發團隊。

## 許可證

MIT License
