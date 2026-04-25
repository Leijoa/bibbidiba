const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');

    // wait for title screen hidden
    await page.click('#btn-new-game');

    // We can try to take a screenshot of the main game area
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshot-ingame.png' });

    await browser.close();
})();
