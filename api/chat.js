export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log("🔑 Checando API Key:", process.env.OPENAI_API_KEY ? "✅ Existe" : "❌ NÃO ENCONTRADA");

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada no projeto." });
    }

    // 📩 Processa body da requisição
    let body = {};
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      body = raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error("❌ Erro ao processar body:", err);
      return res.status(400).json({ error: "Erro ao processar JSON do body." });
    }

    console.log("📩 Body recebido:", body);

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const system = process.env.AGENT_SYSTEM || "Você é um assistente útil e responde sempre em português.";

    const input = [{ role: "system", content: system }, ...messages];
    console.log("📨 Enviando para OpenAI:", input);

    // 📡 Chamada para a API de Chat
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: input
      })
    });

    console.log("📡 Status da resposta da OpenAI:", r.status);
    const data = await r.json();
    console.log("📥 Dados recebidos:", data);

    if (!r.ok) {
      return res.status(500).json({ error: "Erro na chamada da OpenAI", details: data });
    }

    // ✅ Extrair a resposta corretamente
    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.choices?.[0]?.delta?.content?.trim() ||
      "Sem resposta da OpenAI.";

    return res.status(200).json({ text });
  } catch (err) {
    console.error("💥 Erro inesperado no servidor:", err);
    return res.status(500).json({ error: "Erro inesperado no servidor.", details: err.message });
  }
}

