import { chromium, devices } from 'playwright'

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000'
const PAGES = [
  '/access',
  '/login',
  '/',
  '/cases',
  '/contacts',
  '/contacts/new',
  '/cases/new',
  '/chat',
]

// iPhone SE viewport
const iphoneSE = {
  viewport: { width: 375, height: 667 },
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext(iphoneSE)
  const page = await context.newPage()

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  // Try to login (only if creds provided)
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    try {
      console.log('Attempting login via /access ...')
      await page.goto(`${BASE}/access`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.fill('input[name=email]', ADMIN_EMAIL)
      await page.fill('input[name=password]', ADMIN_PASSWORD)
      await Promise.all([
        page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {}),
        page.click('button[type=submit]'),
      ])
      await page.waitForTimeout(1500)
      console.log('Login completed, URL:', page.url())
    } catch (e) {
      console.warn('Login failed:', e.message)
    }
  } else {
    console.log('No ADMIN_EMAIL/PASSWORD given — testing unauthenticated only')
  }

  const reports = []
  for (const path of PAGES) {
    const url = BASE + path
    console.log(`\n[TEST] ${url}`)
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(800)
      const status = resp ? resp.status() : 'N/A'
      const finalUrl = page.url()

      // Measure
      const metrics = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth
        const winW = window.innerWidth
        const overflowing = []
        const els = Array.from(document.querySelectorAll('*'))
        for (const el of els) {
          const r = el.getBoundingClientRect()
          if (r.width > winW + 2 && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
            overflowing.push({
              tag: el.tagName,
              cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : '',
              width: Math.round(r.width),
              id: el.id || null,
            })
          }
        }
        // Detect tiny tap targets (buttons/links)
        const tiny = []
        const targets = Array.from(document.querySelectorAll('button, a, [role=button], input[type=submit]'))
        for (const el of targets) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 && r.height === 0) continue
          if (r.width < 36 || r.height < 36) {
            tiny.push({
              tag: el.tagName,
              text: (el.innerText || el.value || '').slice(0, 30),
              w: Math.round(r.width),
              h: Math.round(r.height),
            })
          }
        }
        // Detect tiny fonts
        const tinyFonts = []
        const textEls = Array.from(document.querySelectorAll('p, span, label, button, a, td, th, h1, h2, h3, h4, h5, li, div'))
        for (const el of textEls) {
          if (!el.innerText || el.innerText.trim().length < 3) continue
          const cs = window.getComputedStyle(el)
          const fs = parseFloat(cs.fontSize)
          if (fs < 11) {
            tinyFonts.push({ tag: el.tagName, fs, text: el.innerText.slice(0, 30) })
          }
        }
        // Horizontal scroll required?
        const hScroll = docW > winW + 1
        return { docW, winW, hScroll, overflowing: overflowing.slice(0, 15), tiny: tiny.slice(0, 12), tinyFonts: tinyFonts.slice(0, 10) }
      })

      const shotName = path === '/' ? 'root' : path.replace(/^\//, '').replace(/\//g, '_')
      const shotPath = `/tmp/mobile-audit/screenshots/${shotName}.png`
      await page.screenshot({ path: shotPath, fullPage: true })

      const report = {
        path,
        url,
        status,
        finalUrl,
        ...metrics,
        screenshot: shotPath,
      }
      reports.push(report)
      console.log(JSON.stringify(report, null, 2))
    } catch (e) {
      console.error(`Error on ${url}:`, e.message)
      reports.push({ path, url, error: e.message })
    }
  }

  console.log('\n\n=== FINAL JSON REPORT ===')
  console.log(JSON.stringify(reports, null, 2))

  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
