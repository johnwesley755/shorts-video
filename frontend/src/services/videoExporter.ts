// src/services/videoExporter.ts

export interface ExportProgress {
  progress: number; // 0 to 100
  status: "preparing" | "recording" | "finalizing" | "completed" | "error";
  errorMessage?: string;
}

/**
 * Checks supported MIME types for video recording in the current browser
 */
export const getSupportedMimeType = (): string => {
  const types = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "video/webm";
};

/**
 * Exports canvas rendering to a downloadable video file with audio
 */
export const exportCanvasToVideo = async (
  canvas: HTMLCanvasElement,
  audioDestination: MediaStreamAudioDestinationNode | null,
  durationSec: number,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      if (!canvas) {
        throw new Error("Canvas element is required for export");
      }

      if (onProgress) {
        onProgress({ progress: 5, status: "preparing" });
      }

      // Capture stream from canvas at 30 fps
      const canvasStream = canvas.captureStream(30);

      // Create composite stream combining canvas video and Web Audio narration/music
      const compositeStream = new MediaStream();

      // Add video track
      canvasStream.getVideoTracks().forEach((track) => compositeStream.addTrack(track));

      // Add audio track if available
      if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
        audioDestination.stream.getAudioTracks().forEach((track) => compositeStream.addTrack(track));
      }

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(compositeStream, {
        mimeType,
        videoBitsPerSecond: 4_000_000, // 4 Mbps for crisp 1080x1920 mobile video
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      const startTime = Date.now();
      const totalMs = durationSec * 1000;

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min(95, Math.floor((elapsed / totalMs) * 90) + 5);
        if (onProgress) {
          onProgress({ progress: percent, status: "recording" });
        }
      }, 250);

      recorder.onstop = () => {
        clearInterval(progressInterval);
        if (onProgress) {
          onProgress({ progress: 98, status: "finalizing" });
        }
        const finalBlob = new Blob(chunks, { type: mimeType });

        if (onProgress) {
          onProgress({ progress: 100, status: "completed" });
        }

        resolve(finalBlob);
      };

      recorder.onerror = (e) => {
        clearInterval(progressInterval);
        console.error("MediaRecorder error:", e);
        if (onProgress) {
          onProgress({ progress: 0, status: "error", errorMessage: "Video encoding failed" });
        }
        reject(e);
      };

      // Start recording with 200ms slice chunks
      recorder.start(200);

      // Stop recorder once duration expires
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, totalMs + 300);
    } catch (err) {
      if (onProgress) {
        onProgress({
          progress: 0,
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Export failed",
        });
      }
      reject(err);
    }
  });
};

/**
 * Downloads a video Blob to the user's computer with proper filename
 */
export const downloadVideoBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  const isMp4 = blob.type.includes("mp4");
  const ext = isMp4 ? ".mp4" : ".webm";
  const cleanName = filename.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 40);
  a.download = `${cleanName || "short_video"}${ext}`;

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1000);
};
