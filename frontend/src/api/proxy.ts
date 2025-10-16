import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { endpoint } = req.query;

  if (!endpoint || typeof endpoint !== "string") {
    return res.status(400).json({ error: "Missing endpoint query parameter" });
  }

  try {
    // Use the correct API endpoint URL for your Hugging Face Space
    const baseUrl = "https://johnwesley756-shorts-video.hf.space/api";
    
    if (req.method === "POST") {
      console.log(`Forwarding POST request to ${baseUrl}/${endpoint}`);
      const response = await axios.post(
        `${baseUrl}/${endpoint}`,
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
      console.log(`Forwarding GET request to ${baseUrl}/${endpoint}`);
      const response = await axios.get(
        `${baseUrl}/${endpoint}`
      );
      return res.status(200).json(response.data);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(err.response?.status || 500).json({
      error: err.response?.data || err.message,
    });
  }
}
