import os
import time
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Add parent directory to path to allow importing pages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pages.login_page import LoginPage
from pages.patient_dashboard import PatientDashboard

def run_e2e_test(base_url, image_path, screenshot_dir):
    os.makedirs(screenshot_dir, exist_ok=True)
    
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1280,800")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    results = {
        "success": False,
        "logs": [],
        "screenshot": None,
        "metrics": {}
    }
    
    def log(msg):
        print(f"[Selenium Test] {msg}")
        results["logs"].append(msg)
        
    try:
        log(f"Navigating to web app URL: {base_url}")
        driver.get(base_url)
        time.sleep(2)
        
        # Take initial screenshot
        driver.save_screenshot(os.path.join(screenshot_dir, "01_home_screen.png"))
        
        # 1. Click Patient Portal
        log("Clicking 'Patient Portal' button...")
        wait = WebDriverWait(driver, 10)
        patient_card = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Patient Portal')]")))
        patient_card.click()
        time.sleep(1)
        driver.save_screenshot(os.path.join(screenshot_dir, "02_patient_login.png"))
        
        # 2. Perform Login
        log("Entering login credentials...")
        login_page = LoginPage(driver)
        login_page.login("test@test.com", "12345")
        
        # Wait for dashboard loading
        log("Waiting for dashboard to load...")
        dashboard = PatientDashboard(driver)
        time.sleep(2)
        driver.save_screenshot(os.path.join(screenshot_dir, "03_patient_dashboard.png"))
        
        # 3. Perform Scan Upload
        log(f"Uploading scan image from path: {image_path}")
        dashboard.upload_scan(image_path)
        time.sleep(1)
        driver.save_screenshot(os.path.join(screenshot_dir, "04_scan_selected.png"))
        
        # 4. Trigger AI Analysis
        log("Clicking 'Analyze Scan'...")
        start_time = time.time()
        dashboard.click_analyze()
        
        # 5. Wait for Results
        log("Waiting for AI analysis result card...")
        dashboard.wait_for_results()
        duration = time.time() - start_time
        log(f"Analysis completed in {duration:.2f} seconds!")
        
        driver.save_screenshot(os.path.join(screenshot_dir, "05_analysis_result.png"))
        
        # Read text values
        status_text = driver.find_element(By.XPATH, "//p[contains(b, 'Status:') or contains(., 'Status:')]").text
        count_text = driver.find_element(By.XPATH, "//p[contains(b, 'Total Count:') or contains(., 'Total Count:')]").text
        
        log(f"AI Output: {status_text} | {count_text}")
        
        # 6. Logout
        log("Logging out...")
        settings_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Settings')]")))
        settings_tab.click()
        time.sleep(0.5)
        driver.save_screenshot(os.path.join(screenshot_dir, "06_settings.png"))
        
        logout_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Logout')]")))
        logout_btn.click()
        time.sleep(1)
        driver.save_screenshot(os.path.join(screenshot_dir, "07_logged_out.png"))
        
        results["success"] = True
        results["metrics"] = {
            "analysis_duration_sec": duration,
            "status": status_text,
            "count": count_text
        }
        
    except Exception as e:
        err_msg = f"E2E test step failed: {str(e)}"
        log(err_msg)
        try:
            screenshot_path = os.path.join(screenshot_dir, "failure_error.png")
            driver.save_screenshot(screenshot_path)
            results["screenshot"] = screenshot_path
        except Exception as se:
            log(f"Failed to capture screenshot on error: {str(se)}")
    finally:
        driver.quit()
        
    return results

if __name__ == "__main__":
    url = os.environ.get("BASE_URL", "http://localhost:5173/")
    img = "C:\\Users\\narra\\.gemini\\antigravity-ide\\brain\\6b2d2ef0-4281-46ea-84f8-9011ca32e66e\\sample_scan_1785901547800.png"
    scr = "automation/screenshots/"
    res = run_e2e_test(url, img, scr)
    if res["success"]:
        print("SUCCESS")
        sys.exit(0)
    else:
        print("FAIL")
        sys.exit(1)
