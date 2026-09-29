#!/bin/bash
# Traccar Alequizão · Desenvolvido por Alequizao <alequizao.dev@gmail.com>
# https://github.com/alequizao · © 2026 Alequizao. Todos os direitos reservados.
#
# Atualiza o servidor Traccar oficial mantendo conf/, data/ e logs/.
# Uso: scripts/atualizar-servidor.sh 6.16.0 [/opt/traccar]
# Faça backup do banco e da pasta antes!
set -e
VERSAO="$1"; PASTA="${2:-/opt/traccar}"
[ -n "$VERSAO" ] || { echo "Uso: $0 <versao> [pasta]"; exit 1; }
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"

curl -fsSL -o "$TMP/t.zip" "https://github.com/traccar/traccar/releases/download/v$VERSAO/traccar-linux-64-$VERSAO.zip"
unzip -q "$TMP/t.zip" -d "$TMP/z"
sh "$TMP/z/traccar.run" --noexec --target "$TMP/x" >/dev/null

systemctl stop traccar
for d in lib jre schema templates; do rsync -a --delete "$TMP/x/$d/" "$PASTA/$d/"; done
cp -a "$TMP/x/tracker-server.jar" "$PASTA/tracker-server.jar"
"$RAIZ/scripts/aplicar-web.sh" "$PASTA/web"
systemctl start traccar

rm -rf "$TMP"
echo "Traccar $VERSAO instalado em $PASTA"
