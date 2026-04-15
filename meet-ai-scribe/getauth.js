const { chromium } = require('playwright');

(async () => {
  try {
    console.log("🔌 Connecting to your real Chrome browser...");
    // Connects to the port we opened in Step 2
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    
    // Grabs the active session
    const context = browser.contexts()[0];

    console.log("💾 Extracting session cookies to auth.json...");
    await context.storageState({ path: 'auth.json' });
    
    console.log("✅ auth.json successfully generated!");
    
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("Make sure you ran the Chrome debug command and kept the browser open!");
  }
})();