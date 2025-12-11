const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

(async () => {
  const TARGET_URL = 'http://localhost:5176/#/otn/view/userSecurity_bindTel.html';
  const REFERENCE_IMAGE_PATH = path.join(__dirname, 'reference_bind_tel.png');
  const OUTPUT_IMAGE_PATH = path.join(__dirname, 'current_bind_tel.png');
  const DIFF_IMAGE_PATH = path.join(__dirname, 'diff_bind_tel.png');

  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'], defaultViewport: { width: 1280, height: 1000 } });
    const page = await browser.newPage();
    await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.bind-tel-container');
    await page.screenshot({ path: OUTPUT_IMAGE_PATH, fullPage: true });

    if (fs.existsSync(REFERENCE_IMAGE_PATH)) {
      const img1 = PNG.sync.read(fs.readFileSync(REFERENCE_IMAGE_PATH));
      const img2 = PNG.sync.read(fs.readFileSync(OUTPUT_IMAGE_PATH));
      const { width, height } = img1;
      const diff = new PNG({ width, height });
      const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
      const totalPixels = width * height;
      const mismatchPercentage = (numDiffPixels / totalPixels) * 100;
      fs.writeFileSync(DIFF_IMAGE_PATH, PNG.sync.write(diff));
      console.log(mismatchPercentage.toFixed(2) + '%');
      if (mismatchPercentage >= 5) process.exit(2);
    }

    await browser.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
