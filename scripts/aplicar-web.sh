#!/bin/bash
# Traccar Alequizão · Desenvolvido por Alequizao <alequizao.dev@gmail.com>
# https://github.com/alequizao · © 2026 Alequizao. Todos os direitos reservados.
#
# Compila a web personalizada e instala em uma pasta web do Traccar.
# Uso: scripts/aplicar-web.sh [/opt/traccar/web]
set -e
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="${1:-/opt/traccar/web}"

cd "$RAIZ/web"
npm ci --no-audit --no-fund
npm run build

rm -rf "$DESTINO"
cp -a "$RAIZ/web/build" "$DESTINO"
rm -rf "$DESTINO/node_modules"

# logos, ícones, .env (SUPPORT_URL), custom.css/js e a Central de Comandos
cp -a "$RAIZ/personalizacoes/web/." "$DESTINO/"

# SEO (JSON-LD) no index.html
python3 - "$DESTINO/index.html" "$RAIZ/personalizacoes/seo-jsonld.html" <<'PY'
import sys
destino, bloco = sys.argv[1], open(sys.argv[2]).read()
html = open(destino).read()
if 'application/ld+json' not in html:
    html = html.replace('</head>', bloco + '  </head>', 1)
open(destino, 'w').write(html)
PY

# service worker não intercepta /comandos
if ! grep -q comandos-bypass "$DESTINO/sw.js"; then
  { cat "$RAIZ/personalizacoes/sw-comandos-bypass.js"; cat "$DESTINO/sw.js"; } > "$DESTINO/sw.js.novo"
  mv "$DESTINO/sw.js.novo" "$DESTINO/sw.js"
fi

echo "Web aplicada em $DESTINO"
