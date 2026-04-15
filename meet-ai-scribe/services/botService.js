const { chromium } = require("playwright");
const transcriptStore = require("../utils/transcriptStore");
const fs = require("fs");

let browser;
let context;
let page;
let isRunning = false;

// Buffer variables to fix the "waterfall" repeating text
let activeSpeaker = "";
let activeText = "";

exports.start = async (meetLink) => {
  if (isRunning) return;
  
  isRunning = true;
  activeSpeaker = "";
  activeText = "";
  transcriptStore.clearTranscript();
  console.log(`🚀 Launching Playwright Bot for: ${meetLink}`);

  try {
    const hasAuth = fs.existsSync("auth.json");
    if (!hasAuth) {
        console.warn("⚠️ No auth.json found. Running as anonymous guest.");
    } else {
        console.log("🔐 Using auth.json session. Bypassing bot detection...");
    }

    browser = await chromium.launch({
      headless: false, 
      args: [
        "--no-sandbox",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    });

    context = await browser.newContext(
      hasAuth ? { storageState: "auth.json" } : {}
    );

    page = await context.newPage();
    await page.goto(meetLink, { waitUntil: "domcontentloaded" });

    // 1. Mute Mic & Cam instantly
    await clickIfVisible(page, 'button[aria-label*="Turn off microphone"]');
    await clickIfVisible(page, 'button[aria-label*="Turn off camera"]');
    await clickIfVisible(page, 'button:has-text("Got it")');

    // 2. Click Join 
    await clickJoin(page);

    console.log("⏳ Waiting to be admitted...");
    await waitUntilJoined(page);
    console.log("✅ Admitted into the meeting!");

    // 3. Turn on Captions
    await ensureCaptionsOn(page);

    // 4. Scrape Captions with Sentence Buffering
    console.log("🎧 Listening for live captions...");
    
    await page.exposeFunction("onCaption", (speaker, text) => {
      if (!isRunning) return;

      const cleanText = text.trim();
      if (!cleanText) return;

      // Check if the same person is continuing their sentence
      const isSameSentence = 
        speaker === activeSpeaker && 
        (cleanText.startsWith(activeText.slice(0, 15)) || activeText === "");

      if (isSameSentence) {
        // Just update the buffer, don't save yet
        activeText = cleanText;
      } else {
        // Speaker paused or changed. Save the finished sentence!
        if (activeText) {
          const formattedLine = `${activeSpeaker}: ${activeText}`;
          console.log(`📝 ${formattedLine}`);
          transcriptStore.addLine(formattedLine);
        }
        
        // Start the new buffer
        activeSpeaker = speaker;
        activeText = cleanText;
      }
    });

    await page.evaluate(() => {
      const badgeSel = ".NWpY1d, .xoMHSc";
      let lastSpeaker = "Unknown Speaker";

      const getSpeaker = (node) => {
        const badge = node.querySelector(badgeSel);
        return badge?.textContent?.trim() || lastSpeaker;
      };

      const getText = (node) => {
        const clone = node.cloneNode(true);
        clone.querySelectorAll(badgeSel).forEach((el) => el.remove());
        return clone.textContent?.trim() || "";
      };

      const send = (node) => {
        const txt = getText(node);
        const spk = getSpeaker(node);
        if (txt && txt.toLowerCase() !== spk.toLowerCase()) {
          window.onCaption(spk, txt);
          lastSpeaker = spk;
        }
      };

      new MutationObserver((mutations) => {
        for (const m of mutations) {
          Array.from(m.addedNodes).forEach((n) => {
            if (n instanceof HTMLElement) send(n);
          });
          if (m.type === "characterData" && m.target?.parentElement instanceof HTMLElement) {
            send(m.target.parentElement);
          }
        }
      }).observe(document.body, { childList: true, characterData: true, subtree: true });
    });

  } catch (err) {
    console.error("❌ Bot encountered an error:", err);
    isRunning = false;
  }
};

exports.stop = async () => {
  console.log("🛑 Stopping bot...");
  isRunning = false;

  // Flush the final lingering sentence to the transcript store
  if (activeText) {
    const formattedLine = `${activeSpeaker}: ${activeText}`;
    console.log(`📝 [FINAL] ${formattedLine}`);
    transcriptStore.addLine(formattedLine);
    activeText = ""; 
    activeSpeaker = "";
  }

  if (context) await context.close();
  if (browser) await browser.close();
  console.log("✅ Bot completely disconnected.");
};

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================

async function clickIfVisible(page, selector, timeout = 3000) {
  try {
    const elem = page.locator(selector).first();
    await elem.waitFor({ state: "visible", timeout });
    await elem.click();
    return true;
  } catch {
    return false;
  }
}

async function clickJoin(page) {
  await clickIfVisible(page, 'button:has-text("Continue without microphone and camera")');
  const possibleTexts = ["Join now", "Ask to join", "Join meeting", "Join"];
  for (const text of possibleTexts) {
    if (await clickIfVisible(page, `button:has-text("${text}")`)) {
      console.log(`🔘 Clicked join button: "${text}"`);
      return;
    }
  }
  console.log("⚠️ No standard join button found. Pressing Enter as fallback.");
  await page.keyboard.press("Enter");
}

async function waitUntilJoined(page) {
  try {
    await Promise.race([
      page.waitForSelector('button[aria-label*="Leave call"]', { timeout: 60000 }),
      page.waitForSelector("text=You've been admitted", { timeout: 60000 }),
    ]);
  } catch (err) {
    throw new Error("Not admitted within time limit (60s)");
  }
}

async function ensureCaptionsOn(page) {
  console.log("⚙️ Stabilizing UI and enabling captions...");
  await page.waitForTimeout(4000);
  
  await page.keyboard.down("Shift");
  await page.keyboard.press("c");
  await page.keyboard.up("Shift");
  await page.waitForTimeout(2000);

  const ccOffBtn = page.locator('button[aria-label*="Turn off captions"]');
  if (await ccOffBtn.isVisible().catch(() => false)) {
    console.log("✅ Captions are ON (via shortcut).");
    return;
  }

  console.log("⚠️ Shortcut failed, falling back to UI click...");
  await clickIfVisible(page, 'button[aria-label*="Turn on captions"]', 5000);
}