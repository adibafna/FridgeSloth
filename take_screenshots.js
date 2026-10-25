const puppeteer = require('C:/Users/ZFXMIKEY/.gemini/antigravity/scratch/safebite-gemma/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join(__dirname, 'public', 'screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log('Launching Edge via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    defaultViewport: { width: 1360, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  await new Promise(r => setTimeout(r, 1500));

  // 1. Dashboard screenshot
  console.log('Capturing Screenshot 1: FridgeSloth Dashboard...');
  const fig1Path = path.join(outDir, 'fridgesloth_dashboard.png');
  await page.screenshot({ path: fig1Path });
  console.log(`Saved ${fig1Path}`);

  // 2. Select Sample Image and click generate
  console.log('Loading Midnight Leftovers sample photo...');
  await page.evaluate(() => {
    loadSampleImage('midnight');
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Clicking generate feast...');
  await page.click('#generateBtn');

  // Wait for result to appear
  console.log('Waiting for Gemma 3 local inference...');
  await page.waitForFunction(() => {
    const res = document.getElementById('resultContent');
    return res && res.style.display !== 'none' && res.innerText.length > 50;
  }, { timeout: 90000 });

  await new Promise(r => setTimeout(r, 1500));

  // 3. Result Screenshot
  console.log('Capturing Screenshot 2: Generated Sloth Feast & Grocery List...');
  const fig2Path = path.join(outDir, 'fridgesloth_result.png');
  await page.screenshot({ path: fig2Path });
  console.log(`Saved ${fig2Path}`);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
