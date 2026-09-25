// Headless smoke test for JobTrack production build (preview server on :4173)
const puppeteer = require("puppeteer-core")

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
const BASE = "http://localhost:4173"
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []

function say(tag, msg) {
  console.log(`[${tag}] ${msg}`)
}

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  const consoleErrors = []
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()) })
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message))

  async function step(name, fn) {
    try { results.push([name, await fn()]) }
    catch (e) { results.push([name, "THREW: " + e.message]) }
  }

  await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 30000 })
  await sleep(1500)

  await step("redirect to /overview", () => page.url().endsWith("/overview"))
  await step("onboarding visible", () => page.evaluate(() => document.body.innerText.includes("Welcome to JobTrack")))

  await step("load sample jobs", async () => {
    const btns = await page.$$("button")
    for (const b of btns) {
      const t = await page.evaluate((el) => el.innerText, b)
      if (t.includes("Load sample jobs")) { await b.click(); return true }
    }
    return false
  })
  await sleep(1000)
  await step("overview populated after sample", () => page.evaluate(() => document.body.innerText.includes("Total applications")))

  let boardText = ""
  await step("board has columns", async () => {
    await page.evaluate(() => { const a = [...document.querySelectorAll("aside a")].find(x => x.innerText.includes("Board")); if (a) a.click() })
    await sleep(1100)
    boardText = await page.evaluate(() => document.body.innerText)
    return boardText.includes("Wishlist") && boardText.includes("Applied") && boardText.includes("Interviewing")
  })

  await step("open Add job modal", async () => {
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => x.innerText.includes("Add job")); if (b) b.click() })
    await sleep(800)
    return !!(await page.$("#job_title"))
  })

  await step("fill and submit application", async () => {
    await page.type("#job_title", "QA Engineer")
    await page.type("#companyName", "Brand New Co")
    await page.evaluate(() => { const s = document.querySelector("form button[type=submit]"); if (s) s.click() })
    await sleep(1000)
    return page.evaluate(() => document.body.innerText.includes("QA Engineer"))
  })

  await step("applications list shows new job", async () => {
    await page.evaluate(() => { const a = [...document.querySelectorAll("aside a")].find(x => x.innerText.includes("Applications")); if (a) a.click() })
    await sleep(1000)
    return page.evaluate(() => document.body.innerText.includes("QA Engineer"))
  })

  await step("dark mode toggles", async () => {
    await page.evaluate(() => { const a = [...document.querySelectorAll("aside a")].find(x => x.innerText.includes("Settings")); if (a) a.click() })
    await sleep(800)
    await page.evaluate(() => { const d = [...document.querySelectorAll("button")].find(x => x.getAttribute("aria-label") === "dark theme"); if (d) d.click() })
    await sleep(500)
    return page.evaluate(() => document.documentElement.classList.contains("dark"))
  })

  await page.reload({ waitUntil: "networkidle0", timeout: 30000 })
  await sleep(1500)
  await step("dark persists after refresh", () => page.evaluate(() => document.documentElement.classList.contains("dark")))
  await step("data persists after refresh", async () => {
    await page.evaluate(() => { const a = [...document.querySelectorAll("aside a")].find(x => x.innerText.includes("Applications")); if (a) a.click() })
    await sleep(1000)
    return page.evaluate(() => document.body.innerText.includes("QA Engineer") && document.body.innerText.includes("Brand New Co"))
  })
  await step("onboarding not shown again", () => page.evaluate(() => !document.body.innerText.includes("Welcome to JobTrack")))

  await step("no console errors", () => consoleErrors.length === 0)

  let allPass = true
  for (const [name, ok] of results) {
    if (ok === true || ok === undefined) { say("PASS", name) }
    else { say("FAIL", name + " => " + JSON.stringify(ok)); allPass = false }
  }
  if (consoleErrors.length) {
    say("", "Console errors:")
    consoleErrors.slice(0, 20).forEach((e) => say("ERR", e))
  }
  await browser.close()
  process.exit(allPass ? 0 : 1)
})().catch((e) => { console.error("FATAL", e); process.exit(2) })
