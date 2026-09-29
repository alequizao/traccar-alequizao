<?php
/*
 * Traccar Alequizão · Desenvolvido por Alequizao <alequizao.dev@gmail.com>
 * https://github.com/alequizao · © 2026 Alequizao. Todos os direitos reservados.
 *
 * Ponte pública para a aba "Fila" do monitoramento.top/comandos.html.
 * O domínio monitoramento.top vai pelo túnel da Cloudflare direto no Traccar
 * (porta 8082) e não executa PHP; aqui o pedido é repassado ao
 * comandos-fila.php original pelo Apache local, que valida o token de sessão
 * do Traccar e exige administrador. Nenhuma credencial fica neste arquivo.
 */
$origens = ['https://monitoramento.top', 'https://nova.monitoramento.top'];
$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origem, $origens, true)) {
    header('Access-Control-Allow-Origin: ' . $origem);
    header('Vary: Origin');
}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$token = $_GET['token'] ?? '';
if (!preg_match('/^[A-Za-z0-9._\-]{8,512}$/', $token)) {
    http_response_code(401);
    echo json_encode(['error' => 'token ausente']);
    exit;
}

$ch = curl_init('http://127.0.0.1/comandos-fila.php?token=' . urlencode($token));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['Host: nova.monitoramento.top'],
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($res === false || $code === 0) {
    http_response_code(502);
    echo json_encode(['error' => 'fila indisponível']);
    exit;
}
http_response_code($code);
echo $res;
