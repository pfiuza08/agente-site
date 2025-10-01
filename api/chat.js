export default async function handler(req, res) {
  // ✅ Permitir apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 🔑 Checa se a chave da OpenAI existe
    console.log("🔑 Checando API Key:", process.env.OPENAI_API_KEY ? "✅ Existe" : "❌ NÃO ENCONTRADA");
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada no projeto." });
    }

    // 📩 Processa o body da requisição
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

    // 🧠 Carrega o prompt do sistema
    let system = process.env.AGENT_SYSTEM || "";
    if (!system && process.env.AGENT_SYSTEM_B64) {
      try {
        system = Buffer.from(process.env.AGENT_SYSTEM_B64, "base64").toString("utf8");
        console.log("✅ Prompt carregado via Base64");
      } catch (e) {
        console.error("❌ Erro ao decodificar AGENT_SYSTEM_B64:", e.message);
      }
    }

    if (!system || !system.trim()) {
      system = "Você é um assistente útil e responde sempre em português.";
      console.warn("⚠️ Nenhum prompt personalizado encontrado. Usando fallback.");
    }

    console.log("🧠 Prompt do sistema sendo usado:", system.slice(0, 150) + "...");

    // 📦 Monta as mensagens
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const input = [{ role: "system", content: system }, ...messages];

    console.log("📨 Enviando mensagens para OpenAI:", JSON.stringify(input, null, 2));

    // 📤 Envia a requisição para a API da OpenAI
    const payload = {
      model: "gpt-4o-mini",
      messages: input
    };

    console.log("📤 Corpo enviado para OpenAI:", JSON.stringify(payload, null, 2));

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("📡 Status da resposta da OpenAI:", r.status);

    const data = await r.json();
    console.log("📥 Dados recebidos da OpenAI:", JSON.stringify(data, null, 2));

    if (!r.ok) {
      return res.status(500).json({ error: "Erro na chamada da OpenAI", details: data });
    }

    // ✅ Extrai a resposta em qualquer formato possível
    let text = "Sem resposta da OpenAI.";
    if (data?.choices?.[0]) {
      text =
        data.choices[0].message?.content?.trim() ||
        data.choices[0].delta?.content?.trim() ||
        data.choices[0].text?.trim() ||
        "Sem resposta da OpenAI.";
    }

    console.log("💬 Resposta final do modelo:", text);

    return res.status(200).json({ text });
  } catch (err) {
    console.error("💥 Erro inesperado no servidor:", err);
    return res.status(500).json({ error: "Erro inesperado no servidor.", details: err.message });
  }
}

