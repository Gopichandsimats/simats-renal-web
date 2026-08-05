from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class LoginPage:
    def __init__(self, driver):
        self.driver = driver
        self.email_input = (By.CSS_SELECTOR, "input[placeholder='Email']")
        self.password_input = (By.CSS_SELECTOR, "input[placeholder='Password']")
        self.login_button = (By.CSS_SELECTOR, "button.primary")
        
    def login(self, email, password):
        # Wait for elements
        wait = WebDriverWait(self.driver, 10)
        email_el = wait.until(EC.presence_of_element_located(self.email_input))
        pass_el = self.driver.find_element(*self.password_input)
        btn_el = self.driver.find_element(*self.login_button)
        
        email_el.clear()
        email_el.send_keys(email)
        pass_el.clear()
        pass_el.send_keys(password)
        btn_el.click()
