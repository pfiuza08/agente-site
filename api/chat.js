export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // CORS opcional (mesmo domínio geralmente não precisa)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no projeto.' });
    }

    // Lê o corpo como JSON (compatível com Vercel Node functions)
    let body = {};
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      body = req.body || {};
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const system = process.env.AGENT_SYSTEM || "Você é um agente de IA educado, objetivo e prático. Responda em português do Brasil, de forma clara e amigável. Se o usuário pedir para executar tarefas perigosas, recuse com segurança.";

    // Monta o input para a Responses API
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

    if (!r.ok) {
      const errTxt = await r.text();
      return res.status(500).json({ error: "Falha na API OpenAI", details: errTxt });
    }

    const data = await r.json();
    const text = data.output_text || "";

    // Opcional: limitar tamanho da resposta
    const safeText = String(text).slice(0, 8000);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ text: safeText });
  } catch (err) {
    return res.status(500).json({ error: 'Erro inesperado no servidor.' });
  }
}
