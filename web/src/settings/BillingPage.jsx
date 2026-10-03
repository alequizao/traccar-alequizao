import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActiveRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import UndoIcon from '@mui/icons-material/UndoRounded';
import EditCalendarIcon from '@mui/icons-material/EditCalendarRounded';
import HistoryIcon from '@mui/icons-material/HistoryRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import AttachFileIcon from '@mui/icons-material/AttachFileRounded';
import PageLayout from '../common/components/PageLayout';
import FinanceMenu from './components/FinanceMenu';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { dataBr, mensagemCobranca, real, statusInfo, telefoneWhats } from './billing/billingUtil';

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

const ORDEM = { overdue: 0, dueToday: 1, dueSoon: 2, ok: 3, none: 4 };
const ehImagem = (p) => p && p.type.startsWith('image/');
const FILTROS = [
  ['all', 'Todos'],
  ['overdue', 'Vencidos'],
  ['dueToday', 'Hoje'],
  ['dueSoon', 'A vencer'],
  ['ok', 'Em dia'],
  ['none', 'Sem data'],
  ['proof', 'Com comprovante'],
];

const ultimaCobranca = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date();
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === hoje.toDateString()
    ? `Cobrado hoje às ${hora}`
    : `Última cobrança: ${d.toLocaleDateString('pt-BR')}`;
};

// Cobrança (administrador): data de cobrança por cliente, avisar antes / no dia / vencido,
// cobrar por notificação no celular do cliente ou por WhatsApp, registrar pagamento.
const BillingPage = () => {
  const { classes } = useSettingsStyles();
  const [usuarios, setUsuarios] = useState([]);
  const [contas, setContas] = useState({});
  const [geral, setGeral] = useState({ payLink: '', pixCode: '' });
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('all');
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState(null);
  const [historico, setHistorico] = useState(null);
  const [configurando, setConfigurando] = useState(false);
  const [comprovante, setComprovante] = useState(null);

  const carregar = useCallback(async () => {
    const [u, c] = await Promise.all([
      fetchOrThrow('/api/users'),
      fetchOrThrow('/api/billing/accounts'),
    ]);
    const lista = (await u.json()).filter((x) => !x.administrator && !x.disabled);
    const dados = await c.json();
    setUsuarios(lista);
    setContas(dados.accounts);
    setGeral({ payLink: dados.payLink, pixCode: dados.pixCode });
  }, []);

  useEffect(() => {
    carregar().catch(() => setAviso('Não foi possível carregar a cobrança.'));
    // ajax: um cliente anexou comprovante ou algo mudou
    const aoMudar = () => carregar().catch(() => {});
    window.addEventListener('billing-update', aoMudar);
    return () => window.removeEventListener('billing-update', aoMudar);
  }, [carregar]);

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios
      .map((u) => ({
        u,
        conta: contas[u.id] || { active: false, payments: [], payLink: geral.payLink },
      }))
      .map((x) => ({ ...x, status: statusInfo(x.conta) }))
      .filter((x) =>
        filtro === 'all' ? true : filtro === 'proof' ? !!x.conta.proof : x.status.chave === filtro,
      )
      .filter(
        (x) => !termo || `${x.u.name} ${x.u.email} ${x.u.phone}`.toLowerCase().includes(termo),
      )
      .sort(
        (a, b) =>
          ORDEM[a.status.chave] - ORDEM[b.status.chave] ||
          (a.conta.daysToDue ?? 99999) - (b.conta.daysToDue ?? 99999),
      );
  }, [usuarios, contas, geral, busca, filtro]);

  const contagem = (chave) =>
    chave === 'all'
      ? usuarios.length
      : chave === 'proof'
        ? usuarios.filter((u) => contas[u.id]?.proof).length
        : usuarios.filter((u) => statusInfo(contas[u.id]).chave === chave).length;

  const executar = async (acao, ok) => {
    try {
      await acao();
      await carregar();
      if (ok) setAviso(ok);
    } catch {
      setAviso('Não foi possível concluir. Tente de novo.');
    }
  };

  const cobrar = async (u, conta) => {
    try {
      const resposta = await fetch('/api/billing/notify', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          userId: u.id,
          message: mensagemCobranca(u.name, conta, conta.payLink),
        }),
      });
      if (resposta.status === 409) {
        setAviso(
          'Este cliente não tem veículo vinculado, então não recebe notificação. Use o WhatsApp.',
        );
        return;
      }
      if (!resposta.ok) throw new Error('falhou');
      setAviso(`Notificação enviada para ${u.name}.`);
      await carregar();
    } catch {
      setAviso('Não foi possível enviar a notificação. Tente de novo.');
    }
  };

  const whatsapp = (u, conta) => {
    const tel = telefoneWhats(u.phone);
    if (!tel) {
      setAviso('Cadastre o telefone deste cliente (com DDD) para usar o WhatsApp.');
      return;
    }
    const texto = encodeURIComponent(mensagemCobranca(u.name, conta, conta.payLink));
    window.open(`https://wa.me/${tel}?text=${texto}`, '_blank', 'noopener');
  };

  const pago = (u) =>
    window.confirm(`${u.name} pagou? O próximo vencimento avança um mês.`) &&
    executar(
      () =>
        fetchOrThrow(`/api/billing/accounts/${u.id}/pay`, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: '{}',
        }),
      'Pagamento registrado.',
    );

  const removerComprovante = (u) =>
    executar(
      () => fetchOrThrow(`/api/billing/proof/${u.id}`, { method: 'DELETE' }),
      'Comprovante recusado e apagado.',
    );

  const desfazer = (u) =>
    window.confirm(`Desfazer o último pagamento de ${u.name}? O vencimento volta ao que era.`) &&
    executar(
      () => fetchOrThrow(`/api/billing/accounts/${u.id}/undo`, { method: 'POST' }),
      'Pagamento desfeito.',
    );

  const salvarConta = () =>
    executar(
      () =>
        fetchOrThrow(`/api/billing/accounts/${editando.u.id}`, {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            dueDate: editando.dueDate || null,
            amount:
              editando.amount === '' ? null : Number(String(editando.amount).replace(',', '.')),
            payLink: editando.payLink,
            pixCode: editando.pixCode,
          }),
        }),
      'Cobrança salva.',
    ).then(() => setEditando(null));

  const salvarGeral = () =>
    executar(
      () =>
        fetchOrThrow('/api/billing/settings', {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify(geral),
        }),
      'Pagamento padrão salvo.',
    ).then(() => setConfigurando(false));

  const abrirEdicao = (u, conta) =>
    setEditando({
      u,
      dueDate: conta.dueDate || '',
      amount: conta.amount ?? '',
      payLink: conta.ownPayLink || '',
      pixCode: conta.ownPixCode || '',
    });

  return (
    <PageLayout menu={<FinanceMenu />} breadcrumbs={['financeiroTitulo', 'cobrancaTitulo']}>
      <Container maxWidth="md" className={classes.container}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Pesquisar cliente por nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Link e Pix padrão">
            <IconButton onClick={() => setConfigurando(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {FILTROS.map(([chave, rotulo]) => (
            <Chip
              key={chave}
              label={`${rotulo} ${contagem(chave)}`}
              color={filtro === chave ? 'primary' : 'default'}
              onClick={() => setFiltro(chave)}
            />
          ))}
        </div>
        {linhas.length === 0 && (
          <Typography color="textSecondary">Nenhum cliente nesta situação.</Typography>
        )}
        <div
          className={classes.table}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {linhas.map(({ u, conta, status }) => (
            <Card key={u.id} variant="outlined">
              <CardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <Typography variant="subtitle1" style={{ fontWeight: 700 }}>
                    {u.name || '(sem nome)'}
                  </Typography>
                  <Typography style={{ fontWeight: 700 }}>{real(conta.amount)}</Typography>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    margin: '6px 0',
                  }}
                >
                  <Chip size="small" label={status.texto} color={status.cor} />
                  {conta.dueDate && (
                    <Typography variant="caption" color="textSecondary">
                      Vencimento {dataBr(conta.dueDate)}
                    </Typography>
                  )}
                  {conta.proof && (
                    <Chip
                      size="small"
                      color="info"
                      icon={<AttachFileIcon />}
                      label="Comprovante anexado"
                      onClick={() => setComprovante({ u, conta })}
                    />
                  )}
                </div>
                {conta.lastNotice && (
                  <Typography variant="caption" color="textSecondary" component="div">
                    {ultimaCobranca(conta.lastNotice)}
                  </Typography>
                )}
                {!`${u.phone || ''}`.trim() && (
                  <Typography variant="caption" color="error" component="div">
                    Sem telefone cadastrado
                  </Typography>
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<NotificationsActiveIcon />}
                    disabled={!conta.active}
                    onClick={() => cobrar(u, conta)}
                  >
                    Cobrar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CheckCircleOutlineIcon />}
                    disabled={!conta.active}
                    onClick={() => pago(u)}
                  >
                    Pago
                  </Button>
                  <div style={{ display: 'flex', marginLeft: 'auto' }}>
                    <Tooltip title="Cobrar pelo WhatsApp">
                      <span>
                        <IconButton
                          aria-label="Cobrar pelo WhatsApp"
                          disabled={!conta.active}
                          onClick={() => whatsapp(u, conta)}
                          style={{ color: conta.active ? '#25D366' : undefined }}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Data, valor e pagamento">
                      <IconButton
                        aria-label="Data, valor e pagamento"
                        onClick={() => abrirEdicao(u, conta)}
                      >
                        <EditCalendarIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Pagamentos e próximos vencimentos">
                      <IconButton
                        aria-label="Pagamentos e próximos vencimentos"
                        onClick={() => setHistorico({ u, conta })}
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>

      <Dialog open={!!editando} onClose={() => setEditando(null)} fullWidth maxWidth="xs">
        <DialogTitle>Cobrança de {editando?.u.name}</DialogTitle>
        {editando && (
          <DialogContent
            style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}
          >
            <TextField
              label="Data de cobrança (vencimento)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={editando.dueDate}
              onChange={(e) => setEditando({ ...editando, dueDate: e.target.value })}
            />
            <TextField
              label="Valor da mensalidade (R$)"
              value={editando.amount}
              onChange={(e) => setEditando({ ...editando, amount: e.target.value })}
            />
            <TextField
              label="Link de pagamento (opcional)"
              value={editando.payLink}
              onChange={(e) => setEditando({ ...editando, payLink: e.target.value })}
              helperText="Deste cliente. Vazio = usa o link padrão"
            />
            <TextField
              label="Pix copia e cola (opcional)"
              value={editando.pixCode}
              multiline
              maxRows={4}
              onChange={(e) => setEditando({ ...editando, pixCode: e.target.value })}
              helperText="Deste cliente, gera o QR code. Vazio = usa o Pix padrão"
            />
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setEditando(null)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarConta}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={configurando} onClose={() => setConfigurando(false)} fullWidth maxWidth="xs">
        <DialogTitle>Pagamento padrão</DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
          <TextField
            label="Link de pagamento"
            value={geral.payLink}
            onChange={(e) => setGeral({ ...geral, payLink: e.target.value })}
          />
          <TextField
            label="Pix copia e cola (gera o QR code)"
            value={geral.pixCode}
            multiline
            maxRows={4}
            onChange={(e) => setGeral({ ...geral, pixCode: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigurando(false)}>Cancelar</Button>
          <Button variant="contained" onClick={salvarGeral}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!historico} onClose={() => setHistorico(null)} fullWidth maxWidth="sm">
        <DialogTitle>{historico?.u.name}</DialogTitle>
        {historico && (
          <DialogContent>
            <Typography variant="subtitle2" gutterBottom>
              Pagamentos realizados
            </Typography>
            {historico.conta.payments.length === 0 ? (
              <Typography color="textSecondary">Nenhum pagamento registrado.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pago em</TableCell>
                    <TableCell>Referente a</TableCell>
                    <TableCell align="right">Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historico.conta.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{dataBr(p.paidOn)}</TableCell>
                      <TableCell>{dataBr(p.due)}</TableCell>
                      <TableCell align="right">{real(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {historico.conta.upcoming?.length > 0 && (
              <>
                <Typography variant="subtitle2" style={{ marginTop: 16 }} gutterBottom>
                  Próximos vencimentos
                </Typography>
                <Table size="small">
                  <TableBody>
                    {historico.conta.upcoming.map((p) => (
                      <TableRow key={p.due}>
                        <TableCell>{dataBr(p.due)}</TableCell>
                        <TableCell align="right">{real(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </DialogContent>
        )}
        <DialogActions>
          {historico?.conta.payments.length > 0 && (
            <Button
              color="warning"
              startIcon={<UndoIcon />}
              onClick={() => {
                const { u } = historico;
                setHistorico(null);
                desfazer(u);
              }}
            >
              Desfazer último pagamento
            </Button>
          )}
          <Button onClick={() => setHistorico(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!comprovante} onClose={() => setComprovante(null)} fullWidth maxWidth="sm">
        <DialogTitle>Comprovante de {comprovante?.u.name}</DialogTitle>
        {comprovante && (
          <DialogContent style={{ textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary" component="div" gutterBottom>
              {comprovante.conta.proof.name} · enviado em{' '}
              {new Date(comprovante.conta.proof.uploadedAt).toLocaleString('pt-BR')}
            </Typography>
            {ehImagem(comprovante.conta.proof) ? (
              <img
                alt="Comprovante de pagamento"
                style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 8 }}
                src={`/api/billing/proof/${comprovante.u.id}?v=${encodeURIComponent(comprovante.conta.proof.uploadedAt)}`}
              />
            ) : (
              <Button
                variant="outlined"
                href={`/api/billing/proof/${comprovante.u.id}?v=${encodeURIComponent(comprovante.conta.proof.uploadedAt)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Baixar / abrir PDF
              </Button>
            )}
            <Typography
              variant="caption"
              color="textSecondary"
              component="div"
              style={{ marginTop: 8 }}
            >
              Ao confirmar o recebimento, o comprovante é apagado do servidor.
            </Typography>
          </DialogContent>
        )}
        <DialogActions
          sx={{ flexWrap: 'wrap', gap: 0.5, '& .MuiButton-root': { whiteSpace: 'nowrap' } }}
        >
          <Button
            color="warning"
            onClick={() => {
              const { u } = comprovante;
              setComprovante(null);
              removerComprovante(u);
            }}
          >
            Recusar
          </Button>
          <Button onClick={() => setComprovante(null)}>Fechar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const { u } = comprovante;
              setComprovante(null);
              pago(u);
            }}
          >
            Confirmar recebimento
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!aviso}
        autoHideDuration={5000}
        onClose={() => setAviso('')}
        message={aviso}
        sx={{ bottom: { xs: 72, md: 24 } }}
      />
    </PageLayout>
  );
};

export default BillingPage;
