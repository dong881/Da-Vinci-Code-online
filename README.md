# Da-Vinci-Code-online

達文西密碼線上版 - 多人線上桌遊

## 遊戲簡介

這是一個完全遵循達文西密碼桌遊規則的線上多人遊戲。玩家可以通過創建或加入房間的方式與其他玩家連線對戰。

## 遊戲規則

達文西密碼是一個推理解謎遊戲：

- 每位玩家擁有黑色和白色的數字牌（0-11）
- 玩家的牌必須按照數字大小由左至右排列，但數字面朝自己，對手看不到
- 玩家輪流猜測對手的牌上的數字
- **猜對了**：該牌被翻開，猜測者可以抽一張新牌並繼續猜測
- **猜錯了**：猜測者自己的一張牌會被翻開，回合結束
- **勝利條件**：最後還有未被翻開牌的玩家獲勝

## 功能特點

✅ 完整的達文西密碼遊戲規則實現  
✅ 基於 WebRTC 的 P2P 連線（無需伺服器）  
✅ 房間系統 - 支援創建和加入房間  
✅ 多人遊戲支援（2-4 人）  
✅ 即時遊戲狀態同步  
✅ 繁體中文界面  
✅ 響應式設計，支援行動裝置  

## 如何遊玩

### 線上遊玩

訪問 GitHub Pages 部署的網站：`https://dong881.github.io/Da-Vinci-Code-online/`

### 本地運行

1. 克隆此儲存庫：
```bash
git clone https://github.com/dong881/Da-Vinci-Code-online.git
cd Da-Vinci-Code-online
```

2. 使用任何 HTTP 伺服器運行，例如：
```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js (需要先安裝 http-server)
npx http-server
```

3. 在瀏覽器中打開 `http://localhost:8000`

## 遊戲流程

1. **進入大廳**
   - 輸入玩家名稱
   - 選擇「創建房間」成為房主，或輸入房間 ID「加入房間」

2. **等待室**
   - 房主可以看到房間 ID，分享給其他玩家
   - 等待至少 2 名玩家加入
   - 房主點擊「開始遊戲」

3. **遊戲進行**
   - 查看自己的牌（按順序排列）
   - 輪到你時，點擊對手的隱藏牌進行猜測
   - 輸入你猜測的數字（0-11）
   - 根據結果繼續遊戲或等待下一回合

4. **遊戲結束**
   - 當只剩一名玩家有未翻開的牌時遊戲結束
   - 查看最終排名

## 技術架構

- **前端**：純 HTML、CSS、JavaScript
- **網路連線**：PeerJS (WebRTC P2P)
- **部署**：GitHub Pages + GitHub Actions
- **無需後端伺服器**：利用 PeerJS 的公共信令伺服器

## 專案結構

```
Da-Vinci-Code-online/
├── index.html          # 主頁面
├── styles.css          # 樣式表
├── game.js             # 遊戲邏輯
├── app.js              # 應用程式主邏輯和網路處理
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions 部署設定
└── README.md           # 專案說明
```

## 開發

### 修改遊戲

- `game.js`：修改遊戲規則和邏輯
- `app.js`：修改網路連線和 UI 互動
- `styles.css`：修改視覺樣式
- `index.html`：修改頁面結構

### 部署

本專案使用 GitHub Actions 自動部署到 GitHub Pages：

1. 推送程式碼到 `main` 或 `master` 分支
2. GitHub Actions 會自動構建並部署
3. 幾分鐘後即可在 GitHub Pages URL 上訪問

需要在 GitHub 儲存庫設定中啟用 GitHub Pages（Settings > Pages > Source: GitHub Actions）

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！