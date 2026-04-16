import asyncio
from playwright.async_api import async_playwright
import http.server
import socketserver
import threading

PORT = 8004

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # log console messages
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser error: {err}"))

        await page.goto(f"http://localhost:{PORT}/index.html")

        # Click start new game
        await page.get_by_text("開始新遊戲").click()
        await page.wait_for_timeout(2000)

        # Open devtools console style to trigger the specific relic
        await page.evaluate("""
            window.showRelicInfo('pongo');
        """)

        await page.wait_for_timeout(1000)

        # Take screenshot
        await page.screenshot(path="/home/jules/verification/screenshots/toast_test13.png", full_page=True)

        await browser.close()

asyncio.run(main())
