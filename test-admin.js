const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText)
  );

  console.log('Navigating to /admin...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });

  // wait a bit for splash screen to disappear
  await new Promise(r => setTimeout(r, 4000));
  
  await browser.close();
})();
