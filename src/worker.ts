export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Sadece POST istekleri desteklenir." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const { text, voice } = await request.json();

      if (!text) {
        throw new Error("Metin alanı boş olamaz.");
      }

      // İşlemi kullanıcının telefonu yerine Hugging Face sunucularına yaptırıyoruz
      const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/hexgrad/Kokoro-82M",
        {
          headers: {
            "Authorization": `Bearer ${env.HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (!hfResponse.ok) {
        const errorText = await hfResponse.text();
        throw new Error(`Yapay zeka sunucu hatası: ${hfResponse.status} - ${errorText}`);
      }

      const audioBuffer = await hfResponse.arrayBuffer();

      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
        },
      });

    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
