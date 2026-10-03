// Cobrança de clientes · Desenvolvido por Alequizao. Funções compartilhadas entre
// "Minha assinatura" (cliente) e "Cobrança" (administrador).

export const MESES = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
];

export const real = (v) =>
  v === null || v === undefined ? '' : `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

/** 2026-09-30 -> 30/09/2026 */
export const dataBr = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};

/** 2026-09-30 -> 30 SET 2026 */
export const dataExtenso = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d} ${MESES[Number(m) - 1]} ${a}`;
};

export const statusInfo = (account) => {
  if (!account || !account.active)
    return { texto: 'Sem cobrança cadastrada', cor: 'default', chave: 'none' };
  const d = account.daysToDue;
  switch (account.status) {
    case 'overdue':
      return {
        texto: d === -1 ? 'Venceu ontem' : `Vencida há ${-d} dias`,
        cor: 'error',
        chave: 'overdue',
      };
    case 'dueToday':
      return { texto: 'Vence hoje', cor: 'warning', chave: 'dueToday' };
    case 'dueSoon':
      return {
        texto: d === 1 ? 'Vence amanhã' : `Vence em ${d} dias`,
        cor: 'warning',
        chave: 'dueSoon',
      };
    default:
      return { texto: `Em dia · vence em ${d} dias`, cor: 'success', chave: 'ok' };
  }
};

/** Texto da cobrança (push no celular do cliente e WhatsApp). */
export const mensagemCobranca = (nome, account, link) =>
  [
    'Você possui uma cobrança em aberto:',
    `• ${nome || 'Cliente'}`,
    ...(account.amount !== null && account.amount !== undefined
      ? [`• ${real(account.amount)}`]
      : []),
    `• Data de vencimento: ${dataExtenso(account.dueDate)}`,
    '',
    'Acesse agora e faça o seu pagamento.',
    ...(link ? ['', link] : []),
  ].join('\n');

/** Telefone em formato de WhatsApp (só dígitos, com 55). */
export const telefoneWhats = (telefone) => {
  let t = `${telefone || ''}`.replace(/\D/g, '');
  if (t.length < 10) return null;
  if (t.length <= 11) t = `55${t}`;
  return t;
};
