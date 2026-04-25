const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // use developer hotkey 3345678 to unlock and give souls
    await page.keyboard.type('3345678');
    await page.waitForTimeout(500);
    // Dev modal pops up when typing 3345678, so we must dismiss it
    await page.click('#dev-relic-cancel');

    await page.click('#btn-new-game');
    await page.waitForTimeout(500);

    // add active shackle test in the game
    await page.evaluate(() => {
        // window.getStageActiveShackle comes from stage.activeShackle which we can't write to easily.
        // We'll mock the window function so UI updates.
        let originalGetStageActiveShackle = window.getStageActiveShackle;
        window.getStageActiveShackle = () => 'wither';
    });

    await page.evaluate(() => {
       const e = document.getElementById('enemy-name');
       e.innerHTML += `<span class="ml-2 bg-red-900/80 hover:bg-red-800 text-[10px] md:text-xs text-red-300 px-1.5 py-0.5 rounded cursor-pointer border border-red-500/50 shadow-sm transition-colors active:scale-95 flex-shrink-0">⛓️ 當前枷鎖</span>`;

       const recycleStatus = document.getElementById('recycle-status');
       recycleStatus.classList.remove('hidden');
       document.getElementById('recycle-val').innerText = '+5%';
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-shackle.png' });

    // open Rules Modal
    await page.click('#btn-rules');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-rules.png' });

    await browser.close();
})();
