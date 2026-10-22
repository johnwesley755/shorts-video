import type { IncomingMessage, ServerResponse } from "http";
import axios from "axios";

export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { endpoint } = req.query;

  if (!endpoint || typeof endpoint !== "string") {
    return res.status(400).json({ error: "Missing endpoint query parameter" });
  }

  // Strict allowlist: only allow 'videos', 'videos/generate', or 'videos/<uuid>'
  const ALLOWED_ENDPOINT_REGEX = /^videos(\/generate|\/[a-f0-9-]+)?$/i;
  const cleanEndpoint = endpoint.trim().replace(/^\/+/, "");

  if (!ALLOWED_ENDPOINT_REGEX.test(cleanEndpoint)) {
    return res.status(400).json({ error: "Invalid or unauthorized endpoint parameter" });
  }

  if (req.method === "POST" && cleanEndpoint !== "videos/generate") {
    return res.status(400).json({ error: "Invalid POST endpoint" });
  }

  if (req.method === "GET" && cleanEndpoint === "videos/generate") {
    return res.status(405).json({ error: "Method not allowed for generation endpoint" });
  }

  try {
    // Use the correct API endpoint URL for your Hugging Face Space
    const baseUrl = "https://johnwesley756-shorts-video.hf.space/api";
    const targetUrl = cleanEndpoint === "videos" ? `${baseUrl}/videos/` : `${baseUrl}/${cleanEndpoint}`;
    
    if (req.method === "POST") {
      console.log(`Forwarding POST request to ${targetUrl}`);
      const response = await axios.post(
        targetUrl,
        req.body,
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            // If your Space requires authorization, add it here:
            // Authorization: `Bearer ${process.env.HF_API_KEY}`
          },
        }
      );
      return res.status(200).json(response.data);
    } else if (req.method === "GET") {
      console.log(`Forwarding GET request to ${targetUrl}`);
      const response = await axios.get(
        targetUrl
      );
      return res.status(200).json(response.data);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    console.error("API proxy error:", err);
    if (axios.isAxiosError(err)) {
      return res.status(err.response?.status || 500).json({
        error: err.response?.data || err.message,
      });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
