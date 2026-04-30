const fs = require('fs');
let content = fs.readFileSync('CHANGELOG.md', 'utf8');

const entry = `
### 修復 (Fixes)
- **攻擊卡死修復**：修正了因為舊版存檔缺少 \`stats\` 屬性，導致點擊攻擊時拋出例外錯誤並使畫面永久凍結的嚴重問題。現在 \`loadMetaData\` 會自動修復並補全缺少的結構。
- **按鈕多次點擊防護**：強化了 \`fireAttack\` 函數的防呆檢查，並且重構 \`ui.js\` 以確保在所有行動裝置上能正確渲染 \`disabled="disabled"\` 屬性，防止玩家在不應該操作的時機點擊按鈕。
`;

content = content.replace('## [Unreleased]', '## [Unreleased]\n' + entry);
fs.writeFileSync('CHANGELOG.md', content);
