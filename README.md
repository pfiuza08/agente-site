# Chat do Agente (sem expor link interno)

Pronto para deploy na **Vercel**. A página `index.html` consome a rota serverless `api/chat.js`, que chama a **Responses API** da OpenAI.

## Passo a passo (super simples)

1. **Crie uma conta** em https://vercel.com (gratuita).
2. **Crie uma conta/Key** na OpenAI e gere sua `OPENAI_API_KEY` em https://platform.openai.com/api-keys
3. No GitHub, crie um repositório vazio (por ex. `agente-site`) e **suba estes arquivos**:
   - `index.html`
   - `api/chat.js`
   - `vercel.json`
4. Na Vercel, clique **Add New → Project → Import** seu repositório.
5. Em **Settings → Environment Variables**, adicione:
   - `OPENAI_API_KEY` = `sua_chave_aqui`
   - (Opcional) `AGENT_SYSTEM` = instruções do seu agente (prompt do sistema).
6. Clique **Deploy**. Quando terminar, você terá uma URL pública (ex.: `https://agente-xyz.vercel.app`).

### Customizar domínio
Em **Settings → Domains**, adicione `agente.seu-dominio.com` e aponte o DNS conforme a Vercel instruir.

### Onde editar o comportamento do agente?
- **`api/chat.js`** → variável `AGENT_SYSTEM` (ou defina a env var).
- Modelo usado: `"gpt-4o-mini"` (barato e bom). Troque se quiser.

### Dica de uso
- Mantenha a **OPENAI_API_KEY somente no servidor** (`api/chat.js`). Nunca exponha no front-end.
- Para **streaming** ou funções avançadas (tools), veja a documentação oficial da OpenAI.

Boa sorte e bons testes! 🚀
