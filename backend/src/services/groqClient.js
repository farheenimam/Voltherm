// Both LLM steps in the pipeline (manager's recommendation draft, and the
// critique agent's review) go through Groq's OpenAI-compatible chat endpoint.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b"; // llama-3.3-70b-versatile was deprecated June 2026

async function chat({ system, user, jsonMode = true, timeoutMs = 6000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Groq] request failed (${res.status}):`, errText);
      throw new Error(`Groq ${res.status}: ${errText}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return jsonMode ? JSON.parse(content) : content;
  } catch (err) {
    console.error("[Groq] call failed:", err.message);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { chat };