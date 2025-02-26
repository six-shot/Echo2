chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === "offscreen") {
    switch (message.type) {
      case "get-recording-state":
        sendResponse({ isRecording: recorder?.state === "recording" });
        return true; // Required for async response
      case "start-recording":
        startRecording(message.data)
          .then(() => sendResponse({ success: true }))
          .catch((error) =>
            sendResponse({ success: false, error: error.message })
          );
        return true; // Required for async response
      case "stop-recording":
        stopRecording()
          .then(() => sendResponse({ success: true }))
          .catch((error) =>
            sendResponse({ success: false, error: error.message })
          );
        return true; // Required for async response
      default:
        sendResponse({
          success: false,
          error: `Unrecognized message: ${message.type}`,
        });
        return true;
    }
  }
});

let recorder;
let data = [];

async function startRecording(streamId) {
  if (recorder?.state === "recording") {
    throw new Error("Called startRecording while recording is in progress.");
  }

  const media = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
  });
  // Continue to play the captured audio to the user.
  const output = new AudioContext();
  const source = output.createMediaStreamSource(media);
  source.connect(output.destination);

  // Start recording.
  recorder = new MediaRecorder(media, { mimeType: "audio/webm" });
  recorder.ondataavailable = (event) => data.push(event.data);
  recorder.onstop = () => {
    const blob = new Blob(data, { type: "audio/webm" });

    // Create download link and trigger download
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `tab-recording-${new Date().toISOString()}.webm`;
    downloadLink.click();
    URL.revokeObjectURL(downloadLink.href);

    // Clear state ready for next recording
    recorder = undefined;
    data = [];
  };
  recorder.start();

  // Record the current state in the URL. This provides a very low-bandwidth
  // way of communicating with the service worker (the service worker can check
  // the URL of the document and see the current recording state). We can't
  // store that directly in the service worker as it may be terminated while
  // recording is in progress. We could write it to storage but that slightly
  // increases the risk of things getting out of sync.
  window.location.hash = "recording";
}

async function stopRecording() {
  if (!recorder) {
    throw new Error("No active recording to stop");
  }

  try {
    recorder.stop();
    // Stopping the tracks makes sure the recording icon in the tab is removed.
    recorder.stream.getTracks().forEach((t) => t.stop());
    // Update current state in URL
    window.location.hash = "";
  } catch (error) {
    console.error("Error stopping recording:", error);
    throw error;
  }
}
