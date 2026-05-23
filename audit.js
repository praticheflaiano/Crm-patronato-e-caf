import { chromium } from 'playwright';

const pages = [
  { url: 'http://localhost:3000/login', name: 'login' },
  { url: 'http://localhost:3000/access', name: 'access' },
  { url: 'http://localhost:3000/', name: 'home' },
  { url: 'http://localhost:3000/cases', name: 'cases' },
  { url: 'http://localhost:3000/contacts', name: 'contacts' },
  { url: 'http://localhost:3000/chat', name: 'chat' },
  { url: 'http://localhost:3000/invalidita-civile', name: 'invalidita-civile' },
  { url: 'http://localhost:3000/medico/dashboard', name: 'medico-dashboard' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  
  const errors = [];
  
  for (const page of pages) {
    const p = await context.newPage();
    const consoleErrors = [];
    
    p.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    p.on('pageerror', err => {
      errors.push({ page: page.name, error: err.message });
    });
    
    try {
      console.log(`Navigating to ${page.name}...`);
      const response = await p.goto(page.url, { waitUntil: 'networkidle', timeout: 30000 });
      await p.waitForTimeout(1000);
      
      await p.screenshot({ path: `/tmp/screenshot_${page.name}.png` });
      
      console.log(`  Status: ${response?.status() || 'unknown'}`);
      if (consoleErrors.length > 0) {
        console.log(`  Console errors: ${consoleErrors.join(', ')}`);
      }
      console.log(`  Screenshot saved: /tmp/screenshot_${page.name}.png`);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
      errors.push({ page: page.name, error: e.message });
    }
    
    await p.close();
  }
  
  await browser.close();
  
  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(`${e.page}: ${e.error}`));
  } else {
    console.log('\n=== ALL PAGES LOADED ===');
  }
})();