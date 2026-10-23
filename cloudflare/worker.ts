// cloudflare/worker.ts - Cloudflare Workers AI Serverless Edge Handler
export interface Env {
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === "/api/health" || url.pathname === "/") {
      return new Response(
        JSON.stringify({ status: "ok", engine: "Cloudflare Workers AI", freeTier: "10,000 Neurons/day" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Text-to-Story Decomposition using Llama-3-8B
    if (url.pathname === "/api/story" && request.method === "POST") {
      try {
        const { prompt } = await request.json() as { prompt: string };
        const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages: [
            {
              role: "system",
              content: "You are an AI Shorts director. Given a topic, output 3 distinct narrative scenes as JSON: [{ order: 1, text: 'voiceover text', visualPrompt: 'visual prompt for diffusion model' }]. Output ONLY valid JSON array."
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 512,
        });

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. Sub-second Image Generation using SDXL-Lightning
    if (url.pathname === "/api/image" && request.method === "POST") {
      try {
        const { prompt } = await request.json() as { prompt: string };
        const imageStream = await env.AI.run(
          "@cf/bytedance/stable-diffusion-xl-lightning",
          {
            prompt: `${prompt}, vertical 9:16 aspect ratio, dramatic cinematic lighting, photorealistic, 8k, sharp focus`,
            num_steps: 4,
          }
        );

        return new Response(imageStream, {
          headers: {
            ...corsHeaders,
            "Content-Type": "image/png",
          },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
