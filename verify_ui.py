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

    # Switch to Database Panel
    print("Switching to Database Panel...")
    buttons = page.locator(".ant-layout-sider-children .ant-btn")
    buttons.nth(1).click()

    expect(page.get_by_text("DATABASE MANAGER", exact=True)).to_be_visible()
    print("Database Panel visible.")
    page.screenshot(path="/home/jules/verification/2_database.png")

    # Switch to Settings Panel
    print("Switching to Settings Panel...")
    settings_btn = page.locator("aside").first.locator(".anticon-setting").locator("..")
    settings_btn.click()

    expect(page.locator(".ant-layout-sider-children").get_by_text("SETTINGS")).to_be_visible()
    print("Settings Panel visible.")
    page.screenshot(path="/home/jules/verification/3_settings.png")

    # Switch to Wizards
    print("Switching to Wizards Panel...")
    wizards_btn = page.locator("aside").first.locator(".anticon-experiment").locator("..")
    wizards_btn.click()

    expect(page.get_by_text("Latex Generators")).to_be_visible()
    print("Wizards Panel visible.")

    # Open Preamble Wizard
    print("Opening Preamble Wizard...")
    page.get_by_text("Quick Preamble").click()

    # Check for Wizard Modal
    # The error says there are multiple "Preamble Wizard" texts (tab, banner, main).
    # We want to check the Modal title specifically.
    # Antd modal title class: .ant-modal-title
    expect(page.locator(".ant-modal-title").get_by_text("Preamble Wizard")).to_be_visible()
    print("Preamble Wizard Modal visible.")
    page.screenshot(path="/home/jules/verification/4_wizard.png")

    # Close modal
    page.get_by_role("button", name="Cancel").click()

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
            page.screenshot(path="/home/jules/verification/error_retry_5.png")
        finally:
            browser.close()
