export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada no projeto." });
    }

    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => data += chunk);
      req.on("end", () => resolve(JSON.parse(data || "{}")));
      req.on("error", reject);
    });

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const system = process.env.AGENT_SYSTEM || "Você é um assistente útil e responde sempre em português do Brasil.";

    const input = [{ role: "system", content: system }, ...messages];

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({ error: "Erro na chamada da OpenAI", details: data });
    }

    const text = data.output_text || "Sem resposta da OpenAI.";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("Erro no servidor:", err);
    return res.status(500).json({ error: "Erro inesperado no servidor." });
  }
}
