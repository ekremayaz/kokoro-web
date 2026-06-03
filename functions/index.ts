export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // Eğer istek sese çevirme isteğiyse (POST ise) yapay zekayı çalıştır
    if (request.method === "POST") {
      try {
        const { text, voice, speed } = await request.json() as any;

        if (!text) {
          return new Response(JSON.stringify({ error: "Text is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const aiResponse = await env.AI.run("@cf/funaudiollm/kokoro-v0_1", {
          text: text,
          voice: voice || "af_heart",
          speed: speed || 1
        });

        return new Response(aiResponse, {
          headers: { "Content-Type": "audio/mpeg" }
        });

      } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // İstek normal siteye giriş ise, ön yüzü (HTML/CSS) Cloudflare Pages'e pasla
    return env.ASSETS.fetch(request);
  }
};
