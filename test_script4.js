const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');

    await page.click('#btn-new-game');
    await page.waitForTimeout(500);

    await page.evaluate(() => {
        const overlay = document.getElementById('shop-overlay');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-shop.png' });

    await browser.close();
})();
