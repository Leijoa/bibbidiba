content = """# 🤖 AI Agent 全域開發規範文件 (AGENTS.md) - Bibbidiba 專案

本專案為 Web 網頁前端開發的骰子構築 Roguelite 遊戲『Bibbidiba (Dice Joker)』。
製作人（阿雷）主要負責遊戲企劃、UI 介面設計與核心數值企劃。為了確保 AI Agent (如 JULES) 能夠高效率對接並避免破壞現有架構，執行任務前請**嚴格遵守以下開發規範**。

## ⚠️ 0. 語言絕對強制指令 (CRUCIAL LANGUAGE OVERRIDE)
**CRUCIAL:** You MUST communicate, explain, and write all pull request (PR) descriptions, commit messages, and plans entirely in **Traditional Chinese (繁體中文)**. Do not use English to reply to the user.
**絕對指令：** 包含計畫提案、進度回報、修改說明、PR 描述，**全部都必須使用繁體中文**。不准擅自切換回英文。

## 1. 專案架構與模組職責 (Architecture Separation)
本專案採用 Vanilla JS (無依賴大型前端框架)，請嚴格遵守以下 MVC 分離原則：
* `js/engine.js` (邏輯層)：專注於遊戲狀態機、戰鬥結算、擲骰隨機性與回合推進。禁止在此操作 DOM。
* `js/data.js` (資料層)：集中管理所有靜態數值（敵人屬性、骰面效果、商店價格、枷鎖屬性）。禁止將數值寫死在邏輯碼中。
* `js/ui.js` (表現層)：專注於 DOM 操作、事件監聽與動畫演出。必須透過呼叫 `engine` 的 API 來觸發遊戲邏輯，禁止直接修改底層變數。
* `css/style.css` (樣式層)：視覺排版。

## 2. 國際化 (i18n) 嚴格規範
本專案具備完整的多語系架構，**嚴禁在 UI 或邏輯程式碼中硬編碼 (Hardcode) 任何顯示文字**。
* 新增任何介面文字、道具名稱或骰面描述時，必須同步更新 `js/locales/` 目錄下的四個語系檔：`en.js`, `ja.js`, `zh-cn.js`, `zh-tw.js`。
* 可利用 `test_i18n.js` 或 `fix_i18n.js` 腳本來檢查語系檔的 Key 值是否對齊。

## 3. 任務執行與防錯原則 (Execution & Safety)
* **讀取現狀：** 每次執行任務前，請先掃描對應的 `.js` 檔案與 `CHANGELOG.md` 確認開發現況。
* **嚴禁猜測：** 若遇到未提供的腳本、缺少邏輯細節，嚴格禁止使用「通用解法」，禁止出現「可能、大概、或許」等猜測性詞彙。必須立刻暫停，並向製作人確認。
* **單點突破：** 每次修改請限縮範圍，嚴禁在一次任務中進行跨越 `engine.js`、`ui.js` 與 `data.js` 的無差別重構，避免引發合併衝突 (Merge Conflict)。
* **計畫先行：** 每次修改前，請先列出「預計修改項目與涉及檔案」，取得製作人同意後再開始寫碼。

## 4. 提交與紀錄 (Commits & Logs)
* 修改完成並確認無誤後，請務必更新 `CHANGELOG.md`，使用繁體中文紀錄本次的新增、修改或修復項目。
"""

file_path = "AGENTS_Bibbidiba.md"
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print(f"File generated successfully: {file_path}")