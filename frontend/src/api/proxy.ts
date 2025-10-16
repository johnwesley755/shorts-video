// /api/proxy.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const endpoint = req.query.endpoint || "";

    const response = await axios({
      method: req.method as any,
      url: `https://huggingface.co/spaces/johnwesley756/shorts-video/api/${endpoint}`,
      data: req.body,
      headers: { "Content-Type": "application/json" },
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Proxy error:", error.message || error);
    res.status(500).json({ error: "Failed to call Space API" });
  }
}
