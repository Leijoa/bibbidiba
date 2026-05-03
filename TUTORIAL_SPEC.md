# Bibbidiba 新手教學系統 — 實作規格書

## 目標
新增一個可跳過的情境式新手引導系統，讓新玩家能在 2~3 分鐘內理解核心玩法，同時不強迫老玩家重複觀看。

---

## 一、入口按鈕

### 標題畫面新增兩個按鈕

1. **「🎓 新手教學」按鈕**
   - 位置：標題畫面現有按鈕列中，放在「開始新遊戲」下方
   - 點擊後：詢問確認視窗「進入新手引導局？骰子結果將被預先設定以利教學。(約 2 分鐘)」
   - 確認後：進入教學模式局

2. **「📖 玩法說明」按鈕**
   - 位置：與新手教學並排
   - 點擊後：開啟靜態說明頁（詳見第四節）
   - 此按鈕在遊戲中也可從設定或側邊選單進入

---

## 二、教學模式核心邏輯

### 狀態旗標（新增至 main.js）

```javascript
let tutorialMode = false;    // 是否處於教學模式
let tutorialStep = 0;        // 目前教學步驟索引（0-based）
let tutorialCompleted = false; // 是否已完成過教學（存入 localStorage）
```

### localStorage 記錄
```javascript
// 記錄玩家是否已看過教學，下次進入遊戲時不再自動提示
localStorage.setItem('bibbidiba_tutorial_done', 'true');
```

### 教學局設定
- 敵人：史萊姆（HP 1500），確保玩家一定打得過
- 初始重骰次數：3 次（正常值）
- **骰子結果強制預設**：每一步的骰子點數由劇本固定，不隨機

---

## 三、教學步驟劇本（共 7 步）

每個步驟包含：
- `step`：步驟編號
- `highlight`：要高亮的 DOM 元素 ID 或 class
- `text`：提示說明文字（需加入 i18n 四語系）
- `waitFor`：等待玩家做什麼動作才進入下一步
- `forceDice`：強制骰面數值（可選）

```javascript
const TUTORIAL_STEPS = [
  {
    step: 0,
    highlight: null,
    forceDice: [3, 3, 5, 2, 7, 1, 4, 6],
    text: 'tutorial.step0', // 「歡迎來到比比丟八！你有 8 顆骰子，目標是湊出牌型組合來造成傷害！」
    waitFor: 'any_click'
  },
  {
    step: 1,
    highlight: 'dice-container',
    forceDice: [3, 3, 5, 2, 7, 1, 4, 6],
    text: 'tutorial.step1', // 「這是你的 8 顆骰子。點擊骰子可以『鎖定』它，重骰時鎖定的骰子不會改變。試著點擊兩顆相同的 3！」
    waitFor: 'lock_two_dice' // 等玩家鎖定兩顆骰子
  },
  {
    step: 2,
    highlight: 'roll-btn',
    text: 'tutorial.step2', // 「很好！現在點『重骰』，重新投擲未鎖定的骰子。」
    waitFor: 'roll_action',
    forceDiceAfterRoll: [3, 3, 3, 6, 6, 1, 4, 2] // 重骰後強制出現三同+雙對
  },
  {
    step: 3,
    highlight: 'score-preview',
    text: 'tutorial.step3', // 「注意看！畫面自動偵測到『三同 x2.5』和『雙對子 x2.0』，倍率會相乘計算最終傷害！」
    waitFor: 'any_click'
  },
  {
    step: 4,
    highlight: 'attack-btn',
    text: 'tutorial.step4', // 「準備好了！點『攻擊』，用目前的骰面造成傷害吧！」
    waitFor: 'attack_action'
  },
  {
    step: 5,
    highlight: 'shop-container',
    text: 'tutorial.step5', // 「打倒敵人後會進入商店。從三件遺物中選一件，遺物會永久改變你的骰子規則！」
    waitFor: 'shop_select'
  },
  {
    step: 6,
    highlight: null,
    text: 'tutorial.step6', // 「教學完成！挑戰 10 關，最終面對創世神！祝你好運，骰子之神！」
    waitFor: 'any_click',
    onComplete: 'end_tutorial' // 結束教學，回到標題或直接開始正式遊戲
  }
];
```

---

## 四、UI 呈現方式

### 教學提示框（Tutorial Tooltip）
- **遮罩層**：半透明黑色遮罩覆蓋整個畫面（opacity 0.6）
- **高亮元素**：目標 DOM 元素透過 `z-index` 提升，穿透遮罩顯示
- **說明泡泡**：
  - 白色圓角卡片，位置自動吸附在高亮元素附近
  - 包含：說明文字 + 步驟指示（如「1 / 7」）+ 跳過按鈕
  - 動畫：fade-in 進場
- **跳過按鈕**：每一步都有「跳過教學」選項，點後直接結束教學進入正式遊戲

### CSS 類別（新增至 style.css）
```css
.tutorial-overlay { /* 半透明遮罩 */ }
.tutorial-highlight { /* 高亮元素的特殊邊框 */ }
.tutorial-tooltip { /* 說明泡泡卡片 */ }
.tutorial-tooltip-arrow { /* 指向高亮元素的箭頭 */ }
```

---

## 五、多語系文字（四個語系檔皆需新增）

### zh-tw.js 新增內容
```javascript
tutorial: {
  btn_start: '🎓 新手教學',
  btn_rules: '📖 玩法說明',
  confirm_title: '進入新手引導局？',
  confirm_desc: '骰子結果將被預先設定以利教學，約需 2 分鐘。',
  confirm_yes: '開始教學',
  confirm_no: '跳過，直接遊戲',
  skip: '跳過教學',
  complete_title: '教學完成！',
  complete_desc: '現在你已經了解基本玩法，祝你骰運亨通！',
  complete_btn: '開始正式挑戰',
  step_indicator: '{0} / {1}',
  step0: '歡迎來到比比丟八！你有 8 顆骰子，目標是湊出牌型來造成傷害擊敗敵人！',
  step1: '點擊骰子可以「鎖定」它。鎖定後重骰時這顆骰子不會改變。試著鎖定兩顆一樣的骰子！',
  step2: '很好！現在點「重骰」，重新投擲未鎖定的骰子。',
  step3: '系統自動偵測到牌型！各區的倍率會相乘，湊出越好的牌型傷害越高！',
  step4: '點「攻擊」，用目前的骰面造成傷害！',
  step5: '打倒敵人後進入商店，從三件遺物中選一件。遺物會永久改變你的遊戲規則！',
  step6: '教學完成！挑戰 10 關，最終面對創世神。祝你好運，骰子之神！',
}
```

（zh-cn / en / ja 同樣新增對應翻譯）

---

## 六、玩法說明頁（靜態）

點「📖 玩法說明」後開啟一個 Modal，內容分頁：

| 分頁 | 內容 |
|------|------|
| 基本玩法 | 骰子、重骰、鎖定、攻擊的說明 |
| 牌型表 | 現有的牌型表（已實作，直接複用） |
| 遺物說明 | 遺物稀有度與融合機制說明 |
| 枷鎖說明 | 枷鎖的輕重分類說明 |
| 靈魂奉獻 | 局外成長系統說明 |

---

## 七、實作優先順序

1. **Phase 1（最小可行）**：標題畫面新增兩個按鈕 + 靜態玩法說明頁
2. **Phase 2**：教學模式的遮罩 + 提示框 UI 框架
3. **Phase 3**：完整 7 步劇本邏輯 + 強制骰面控制
4. **Phase 4**：四語系文字補全 + localStorage 記錄

---

## 給 Claude Code 的執行指令

```
請依照 TUTORIAL_SPEC.md 的規格，實作新手教學系統。

請按照以下順序進行：
1. 先在標題畫面新增「🎓 新手教學」和「📖 玩法說明」兩個按鈕
2. 實作靜態的玩法說明 Modal（複用現有牌型表的程式碼）
3. 在 main.js 新增 tutorialMode、tutorialStep 狀態旗標
4. 實作教學遮罩和提示框的 UI（style.css + ui.js）
5. 實作完整的 7 步教學劇本邏輯
6. 補全四個語系檔的 tutorial 文字

每完成一個階段請告訴我，讓我確認後再繼續。
```
