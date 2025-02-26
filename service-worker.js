async function initializeOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({});
  const offscreenDocument = existingContexts.find(
    (c) => c.contextType === "OFFSCREEN_DOCUMENT"
  );

  if (!offscreenDocument) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Recording from chrome.tabCapture API",
    });
  }
}

// Initialize offscreen document when extension loads
initializeOffscreenDocument();

// Listen for messages from popup
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.target === "offscreen") {
    const existingContexts = await chrome.runtime.getContexts({});
    const offscreenDocument = existingContexts.find(
      (c) => c.contextType === "OFFSCREEN_DOCUMENT"
    );

    if (message.type === "start-recording") {
      chrome.action.setIcon({ path: "icons/recording.png" });
    } else if (message.type === "stop-recording") {
      chrome.action.setIcon({ path: "icons/not-recording.png" });
    }

    // Forward message to offscreen document
    chrome.runtime.sendMessage(message);
  }
});
