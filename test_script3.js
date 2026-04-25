const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');

    // use developer hotkey 3345678 to unlock and give souls
    await page.keyboard.type('3345678');
    await page.waitForTimeout(500);
    // Dev modal pops up when typing 3345678, so we must dismiss it
    await page.click('#dev-relic-cancel');

    // open Collection Modal
    await page.click('#btn-collection');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-collection.png' });

    await browser.close();
})();
