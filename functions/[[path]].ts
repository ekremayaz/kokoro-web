export const onRequest: PagesFunction<{ AI: any }> = async (context) => {
  const request = context.request;
  const env = context.env;

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

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
};
