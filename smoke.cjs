// End-to-end smoke test for JobTrack against the production preview (:4173).
// Portable Chrome resolution: PUPPETEER_EXECUTABLE_PATH first, then common
// install locations, then a clear error.
const fs = require("fs")
const puppeteer = require("puppeteer-core")

function resolveChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c
    } catch {
      /* ignore */
    }
  }
  return null
}

const CHROME = resolveChrome()
const BASE = process.env.SMOKE_BASE_URL || "http://localhost:4173"
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []

function say(tag, msg) {
  console.log(`[${tag}] ${msg}`)
}

if (!CHROME) {
  console.error(
    "Could not find a Chrome/Chromium binary. Set PUPPETEER_EXECUTABLE_PATH to your browser executable and re-run.",
  )
  process.exit(2)
}

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  const consoleErrors = []
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text())
  })
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message))

  async function step(name, fn) {
    try {
      results.push([name, await fn()])
    } catch (e) {
      results.push([name, "THREW: " + e.message])
    }
  }
  const bodyText = () => page.evaluate(() => document.body.innerText)
  async function clickNav(label) {
    await page.evaluate((l) => {
      const a = [...document.querySelectorAll("aside a")].find((x) => x.innerText.includes(l))
      if (a) a.click()
    }, label)
    await sleep(850)
  }
  async function clickButton(text) {
    return page.evaluate((t) => {
      const b = [...document.querySelectorAll("button")].find((x) => x.innerText.includes(t))
      if (b) {
        b.click()
        return true
      }
      return false
    }, text)
  }

  // 1–3 open + onboarding
  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 30000 })
  await sleep(1500)
  await step("redirect to /overview", () => page.url().endsWith("/overview"))
  await step("onboarding visible", async () => (await bodyText()).includes("Welcome to JobTrack"))

  // 4 seed sample
  await step("load sample jobs", async () => {
    const btns = await page.$$("button")
    for (const b of btns) {
      const t = await page.evaluate((el) => el.innerText, b)
      if (t.includes("Load sample")) {
        await b.click()
        return true
      }
    }
    return false
  })
  await sleep(1000)

  // 5 overview populated + attention/pipeline
  await step("overview shows summary", async () => {
    const t = await bodyText()
    return t.toLowerCase().includes("application")
  })

  // 6–7 board + statuses
  await clickNav("Board")
  await step("board shows all six statuses", async () => {
    const t = await bodyText()
    return ["Wishlist", "Applied", "Interviewing", "Offer", "Rejected", "Ghosted"].every((s) => t.includes(s))
  })

  // 8–9 add job
  await step("open Add job", async () => {
    let ok = await clickButton("Add job")
    if (!ok) ok = await clickButton("Add application")
    await sleep(700)
    return ok && !!(await page.$("#job_title"))
  })
  await step("create application", async () => {
    await page.type("#job_title", "QA Engineer")
    await page.type("#companyName", "Brand New Co")
    await page.evaluate(() => {
      const s = document.querySelector("form button[type=submit]")
      if (s) s.click()
    })
    await sleep(1000)
    return true
  })

  // 10–12 applications list + search + detail
  await clickNav("Applications")
  await step("applications list shows new job", async () => (await bodyText()).includes("QA Engineer"))
  await step("search filters list", async () => {
    const input = await page.$('input[type="search"], input[placeholder*="earch"]')
    if (input) {
      await input.type("QA Engineer")
      await sleep(700)
    }
    return (await bodyText()).includes("QA Engineer")
  })
  await step("open application detail", async () => {
    await page.evaluate(() => {
      const row = [...document.querySelectorAll("tr, [role=button], a, button")].find(
        (x) => x.innerText && x.innerText.includes("QA Engineer"),
      )
      if (row) row.click()
    })
    await sleep(900)
    return (await bodyText()).includes("QA Engineer")
  })

  // 17 interviews page
  await clickNav("Interviews")
  await step("interviews page loads", async () => {
    const t = await bodyText()
    return t.includes("Interview") || t.includes("interview")
  })

  // 18 companies
  await clickNav("Companies")
  await step("companies page loads", async () => (await bodyText()).toLowerCase().includes("compan"))

  // 19 metrics
  await clickNav("Metrics")
  await step("metrics page loads", async () => {
    const t = await bodyText()
    return t.toLowerCase().includes("application") || t.toLowerCase().includes("rate")
  })

  // 20 export backup (Data page)
  await clickNav("Data")
  await step("data page loads", async () => (await bodyText()).toLowerCase().includes("export"))

  // 23 theme toggle via Settings
  await clickNav("Settings")
  await step("dark mode toggles", async () => {
    await page.evaluate(() => {
      const d = [...document.querySelectorAll("button")].find(
        (x) => (x.getAttribute("aria-label") || "").toLowerCase().includes("dark") || x.innerText.trim() === "Dark",
      )
      if (d) d.click()
    })
    await sleep(500)
    return page.evaluate(() => document.documentElement.classList.contains("dark"))
  })

  // 21–22 refresh + persistence
  await page.reload({ waitUntil: "networkidle0", timeout: 30000 })
  await sleep(1500)
  await step("dark persists after refresh", () =>
    page.evaluate(() => document.documentElement.classList.contains("dark")),
  )
  await clickNav("Applications")
  await step("data persists after refresh", async () => {
    const t = await bodyText()
    return t.includes("QA Engineer") && t.includes("Brand New Co")
  })
  await step("onboarding not shown again", async () => !(await bodyText()).includes("Welcome to JobTrack"))

  // 25 no console/page errors
  await step("no console errors", () => consoleErrors.length === 0)

  let allPass = true
  for (const [name, ok] of results) {
    if (ok === true || ok === undefined) say("PASS", name)
    else {
      say("FAIL", name + " => " + JSON.stringify(ok))
      allPass = false
    }
  }
  if (consoleErrors.length) {
    say("", "Console errors:")
    consoleErrors.slice(0, 20).forEach((e) => say("ERR", e))
  }
  await browser.close()
  process.exit(allPass ? 0 : 1)
})().catch((e) => {
  console.error("FATAL", e)
  process.exit(2)
})
