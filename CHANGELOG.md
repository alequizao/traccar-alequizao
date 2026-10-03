# Changelog

## Combustível — 03/10/2026

- ⛽ **Preço dos combustíveis por onde o veículo passa.** Módulo nativo no servidor (`servidor/combustivel/`) que coleta
  na SEFAZ-AL e serve `GET /api/fuel/stations`.
- No **popup do veículo**: posto mais próximo (nome clicável, abre a rota), preços de gasolina, etanol, diesel e GNV, distância.
- Botão **Combustível** no mapa: lista dos mais baratos num raio de 3 km e marcadores com o preço (o mais barato em verde).
- Atualização estilo ajax: só consulta o servidor se o veículo andou mais de 1,5 km ou passaram 10 min; entre uma
  consulta e outra as distâncias são recalculadas no navegador.

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
