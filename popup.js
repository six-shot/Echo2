// Initialize state when popup opens
document.addEventListener("DOMContentLoaded", async () => {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");

  // Query the offscreen document's URL hash to check recording state
  const response = await chrome.runtime.sendMessage({
    type: "get-recording-state",
    target: "offscreen",
  });

  isRecording = response.isRecording;
  if (isRecording) {
    startButton.style.display = "none";
    stopButton.style.display = "block";
  } else {
    startButton.style.display = "block";
    stopButton.style.display = "none";
  }
});

let isRecording = false;

document.getElementById("startButton").addEventListener("click", async () => {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id,
    });

    await chrome.runtime.sendMessage({
      type: "start-recording",
      target: "offscreen",
      data: streamId,
    });

    startButton.style.display = "none";
    stopButton.style.display = "block";
    isRecording = true;
  } catch (error) {
    console.error("Error starting recording:", error);
    // If there's an error, ensure we're in the correct state
    startButton.style.display = "block";
    stopButton.style.display = "none";
    isRecording = false;
  }
});

document.getElementById("stopButton").addEventListener("click", async () => {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");

  try {
    await chrome.runtime.sendMessage({
      type: "stop-recording",
      target: "offscreen",
    });

    startButton.style.display = "block";
    stopButton.style.display = "none";
    isRecording = false;
  } catch (error) {
    console.error("Error stopping recording:", error);
  }
});

// Sync button states with recording status
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "recording-status") {
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");
    isRecording = message.isRecording;

    if (isRecording) {
      startButton.style.display = "none";
      stopButton.style.display = "block";
    } else {
      startButton.style.display = "block";
      stopButton.style.display = "none";
    }
  }
});
