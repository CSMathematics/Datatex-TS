from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_app(page: Page):
    print("Navigating to app...")
    page.goto("http://localhost:5173/")

    # Wait for the app to load mock data
    print("Waiting for mock data...")
    expect(page.get_by_text("Demo")).to_be_visible(timeout=10000)

    print("App loaded. Taking initial screenshot.")
    page.screenshot(path="/home/jules/verification/1_explorer.png")

    # Switch to Wizards
    print("Switching to Wizards Panel...")
    wizards_btn = page.locator("aside").first.locator(".anticon-experiment").locator("..")
    wizards_btn.click()

    expect(page.get_by_text("Latex Generators")).to_be_visible()
    print("Wizards Panel visible.")

    # Open Preamble Wizard
    print("Opening Preamble Wizard...")
    page.get_by_text("Quick Preamble").click()

    # Check for Preamble Wizard Tab content (it's not a modal anymore)
    # The view is inside a Card.
    expect(page.locator(".ant-card-head-title").get_by_text("Preamble Wizard")).to_be_visible()
    print("Preamble Wizard Tab visible.")
    page.screenshot(path="/home/jules/verification/4_preamble_tab.png")

    # Open Table Wizard
    print("Opening Table Wizard...")
    page.get_by_text("Table Wizard").click()

    # Check for Table Wizard Tab content
    expect(page.locator(".ant-card-head-title").get_by_text("Table Wizard")).to_be_visible()
    print("Table Wizard Tab visible.")
    page.screenshot(path="/home/jules/verification/5_table_tab.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1200, "height": 800})
        try:
            verify_app(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/error_retry_6.png")
        finally:
            browser.close()
