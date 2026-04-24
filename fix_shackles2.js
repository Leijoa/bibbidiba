const fs = require('fs');

let mainContent = fs.readFileSync('js/main.js', 'utf8');

// Clean up the `window.hasShackle('id')` logic which was partially done incorrectly.
// Let's just use `grep` and sed to find every `stage.activeShackle` and replace it manually.
// Actually, `window.hasShackle(id)` is already defined.
// The issue was: `if (stage.activeShackle === 'vampire')` became `if (window.hasShackle('vampire')` which is a syntax error if not closed.
