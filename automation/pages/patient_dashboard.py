from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class PatientDashboard:
    def __init__(self, driver):
        self.driver = driver
        self.file_input = (By.CSS_SELECTOR, "input[type='file']")
        self.analyze_button = (By.XPATH, "//button[contains(text(), 'Analyze Scan') or contains(text(), 'Analyzing')]")
        self.result_header = (By.XPATH, "//h2[contains(text(), 'Analysis Result')]")
        
    def upload_scan(self, file_path):
        wait = WebDriverWait(self.driver, 10)
        file_el = wait.until(EC.presence_of_element_located(self.file_input))
        file_el.send_keys(file_path)
        
    def click_analyze(self):
        btn = self.driver.find_element(*self.analyze_button)
        btn.click()
        
    def wait_for_results(self):
        wait = WebDriverWait(self.driver, 15)
        return wait.until(EC.presence_of_element_located(self.result_header))
