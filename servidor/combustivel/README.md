# Módulo de combustível (Traccar 6.16.0)

Coleta os preços de gasolina, etanol, diesel e GNV direto na SEFAZ-AL (programa Economiza Alagoas) e os serve
dentro do próprio Traccar. O Traccar oficial não tem isso, por isso é um patch sobre o fonte.

## Endpoints (exigem login, como o resto da API)
- `GET /api/fuel/stations?latitude=&longitude=&radius=6&limit=40` — postos do mais perto ao mais longe, cada um com
  `prices` por combustível (1 gasolina, 2 aditivada, 3 etanol, 4 diesel, 5 diesel aditivado, 6 GNV).
- `GET /api/fuel?latitude=&longitude=&radius=5&type=1&limit=5` — os mais baratos de um combustível.

## Configuração (`conf/traccar.xml`)
```xml
<entry key='fuel.enable'>true</entry>
<entry key='fuel.token'>APPTOKEN_DA_SEFAZ</entry>          <!-- nunca vai para o git -->
<entry key='fuel.cache'>/opt/traccar/data/fuel.json</entry>
<!-- opcionais: fuel.interval (min, padrão 60), fuel.latitude / fuel.longitude (padrão Maceió), fuel.url -->
```

## Como aplicar numa versão nova
```bash
git clone --depth 1 --branch vX.Y.Z https://github.com/traccar/traccar && cd traccar
git apply /caminho/combustivel-6.16.0.patch      # se houver conflito, reaplique à mão: são 5 arquivos
./gradlew --no-daemon assemble -x test
# testar num Traccar paralelo (outra porta, banco H2) antes de trocar tracker-server.jar da produção
```

## Como coleta
Mesma receita do projeto Economiza: POST em `combustivel/pesquisa` com o header `AppToken`; a API limita a
geolocalização a 15 km, então também consulta os 2 municípios mais frequentes (código IBGE) e une por CNPJ.
Postos com coordenada 0,0 são ignorados no "perto de mim".
