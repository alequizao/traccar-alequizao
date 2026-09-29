# Changelog

## v6.16.0 — 29/09/2026

Primeira versão pública, baseada no **Traccar 6.16.0 oficial** (servidor e web).

### Personalizações
- 🔒 **Bloquear / desbloquear** em cada veículo da lista (cadeado verde = liberado, vermelho = bloqueado),
  enviando `engineStop` / `engineResume` e guardando o estado em `attributes.uiLocked`.
- 💬 **Botão Suporte (WhatsApp)** no menu inferior do celular, com o número lido de `/.env` (`SUPPORT_URL`).
- 👨‍💻 **Dados do desenvolvedor** em *Preferências › Informação*, com links clicáveis.
- 🎨 Identidade visual do Monitoramento.top: logos, favicon, ícones do PWA, `custom.css` / `custom.js`.
- 🧭 **Central de Comandos** (`/comandos.html`): envio, histórico e fila. A aba **Fila** passou a funcionar pelo
  domínio por meio da ponte `servidor/alequizao.com/traccar-fila/`.
- 🔎 SEO com JSON-LD no `index.html` e service worker sem cache para `/comandos*`.

### Scripts
- `scripts/aplicar-web.sh`: compila a web e instala numa pasta do Traccar.
- `scripts/atualizar-servidor.sh`: baixa o Traccar oficial e troca servidor e web, mantendo `conf/`, `data/` e `logs/`.

### Observações
- A 6.16.0 não traz migração de banco em relação à 6.15.x.
