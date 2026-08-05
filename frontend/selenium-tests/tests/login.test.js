import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';

describe('SIMATS Renal Calculi Patient Login E2E', function () {
  this.timeout(30000); // 30 seconds timeout
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should successfully log in to the patient portal', async function () {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173/';
    console.log(`Navigating to: ${baseUrl}`);
    await driver.get(baseUrl);

    // 1. Click Patient Portal Button
    console.log("Locating Patient Portal card button...");
    const patientBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Patient Portal')]")),
      10000
    );
    await driver.wait(until.elementIsVisible(patientBtn), 5000);
    await patientBtn.click();

    // 2. Login Input
    console.log("Entering login email and password...");
    const emailInput = await driver.wait(
      until.elementLocated(By.css("input[placeholder='Email']")),
      5000
    );
    await emailInput.sendKeys('test@test.com');

    const passwordInput = await driver.findElement(By.css("input[placeholder='Password']"));
    await passwordInput.sendKeys('12345');

    const submitBtn = await driver.findElement(By.css("button.primary"));
    await submitBtn.click();

    // 3. Assert Dashboard loads
    console.log("Waiting for dashboard element...");
    const analysisBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(., 'Analyze Scan') or contains(text(), 'Analyze Scan')]")),
      10000
    );
    
    assert.ok(analysisBtn, 'Patient dashboard button failed to render after login.');
    console.log("E2E Login Test Passed Successfully!");
  });
});
