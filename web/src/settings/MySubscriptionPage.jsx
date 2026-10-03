import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { QRCode } from 'react-qr-code';
import UploadFileIcon from '@mui/icons-material/UploadFileRounded';
import PaymentIcon from '@mui/icons-material/PaymentRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import PageLayout from '../common/components/PageLayout';
import FinanceMenu from './components/FinanceMenu';
import useSettingsStyles from './common/useSettingsStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { dataBr, real, statusInfo } from './billing/billingUtil';

// Minha assinatura: o cliente vê a situação, paga (link e QR do Pix) e consulta os pagamentos
// feitos e os próximos vencimentos. Só leitura: quem altera é o administrador.
const MySubscriptionPage = () => {
  const { classes } = useSettingsStyles();
  const [conta, setConta] = useState(null);
  const [erro, setErro] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const userId = useSelector((state) => state.session.user.id);
  const [enviando, setEnviando] = useState(false);
  const [avisoProva, setAvisoProva] = useState('');

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetchOrThrow('/api/billing/me');
      setConta(await resposta.json());
      setErro(false);
    } catch {
      setErro(true);
    }
  }, []);

  // "ajax": quando o administrador confirma um pagamento ou muda a cobrança, o servidor avisa
  // (evento "cobranca" no WebSocket) e esta tela se atualiza sozinha, sem recarregar.
  useEffect(() => {
    carregar();
    const aoMudar = () => {
      setAvisoProva('');
      carregar();
    };
    window.addEventListener('billing-update', aoMudar);
    return () => window.removeEventListener('billing-update', aoMudar);
  }, [carregar]);

  const enviarComprovante = async (evento) => {
    const arquivo = evento.target.files[0];
    evento.target.value = '';
    if (!arquivo) return;
    if (arquivo.size > 5 * 1024 * 1024) {
      setAvisoProva('O arquivo passa de 5 MB. Envie uma foto menor ou um PDF.');
      return;
    }
    setEnviando(true);
    try {
      const resposta = await fetch('/api/billing/proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-File-Name': encodeURIComponent(arquivo.name),
        },
        body: arquivo,
      });
      if (resposta.status === 415) {
        setAvisoProva('Envie uma imagem (JPG, PNG ou WEBP) ou um PDF.');
      } else if (!resposta.ok) {
        throw new Error('falhou');
      } else {
        setAvisoProva('Comprovante enviado. O administrador foi avisado.');
        await carregar();
      }
    } catch {
      setAvisoProva('Não foi possível enviar agora. Tente de novo.');
    }
    setEnviando(false);
  };

  const removerComprovante = async () => {
    try {
      await fetchOrThrow('/api/billing/proof', { method: 'DELETE' });
      setAvisoProva('Comprovante removido.');
      await carregar();
    } catch {
      setAvisoProva('Não foi possível remover agora.');
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(conta.pixCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      /* sem permissão da área de transferência */
    }
  };

  const status = statusInfo(conta);
  const linkSeguro = conta && /^https:\/\//i.test(conta.payLink || '') ? conta.payLink : '';
  const pagar = conta && conta.active && (linkSeguro || conta.pixCode);

  return (
    <PageLayout menu={<FinanceMenu />} breadcrumbs={['financeiroTitulo', 'assinaturaTitulo']}>
      <Container maxWidth="sm" className={classes.container}>
        {erro && <Alert severity="error">Não foi possível carregar a sua assinatura agora.</Alert>}
        {conta && !conta.active && (
          <Alert severity="info">Você não tem nenhuma cobrança cadastrada no momento.</Alert>
        )}
        {conta && conta.active && (
          <Card variant="outlined" style={{ marginBottom: 16 }}>
            <CardContent>
              <Chip
                label={status.texto}
                color={status.cor}
                style={{ marginBottom: 12, fontWeight: 700 }}
              />
              <Typography variant="h5">{real(conta.amount)}</Typography>
              <Typography color="textSecondary">Vencimento: {dataBr(conta.dueDate)}</Typography>
            </CardContent>
          </Card>
        )}
        {pagar && (
          <Card variant="outlined" style={{ marginBottom: 16 }}>
            <CardContent style={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                Pagar agora
              </Typography>
              {(conta.pixCode || linkSeguro) && (
                <div
                  style={{
                    background: '#fff',
                    padding: 12,
                    display: 'flex',
                    width: 'fit-content',
                    maxWidth: '100%',
                    margin: '0 auto',
                    borderRadius: 8,
                  }}
                >
                  <QRCode
                    value={conta.pixCode || linkSeguro}
                    size={200}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
              )}
              <Typography
                variant="caption"
                component="div"
                color="textSecondary"
                style={{ marginTop: 8 }}
              >
                {conta.pixCode
                  ? 'Abra o app do seu banco, escolha Pix e leia o QR code.'
                  : 'Leia o QR code para abrir a página de pagamento.'}
              </Typography>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginTop: 12,
                }}
              >
                {conta.pixCode && (
                  <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copiar}>
                    {copiado ? 'Código copiado!' : 'Copiar código Pix'}
                  </Button>
                )}
                {linkSeguro && (
                  <Button
                    variant="contained"
                    startIcon={<PaymentIcon />}
                    href={linkSeguro}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir página de pagamento
                  </Button>
                )}
              </div>
              {linkSeguro && (
                <Typography
                  variant="caption"
                  component="div"
                  style={{ marginTop: 8, wordBreak: 'break-all' }}
                >
                  <Link href={linkSeguro} target="_blank" rel="noopener noreferrer">
                    {linkSeguro}
                  </Link>
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
        {conta && conta.active && (
          <Card variant="outlined" style={{ marginBottom: 16 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Comprovante de pagamento
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Já pagou? Anexe o comprovante (imagem ou PDF de até 5 MB). Só o administrador vê, e
                ele é apagado quando o recebimento for confirmado.
              </Typography>
              {conta.proof && (
                <Alert severity="success" style={{ marginBottom: 12 }}>
                  Comprovante enviado em {new Date(conta.proof.uploadedAt).toLocaleString('pt-BR')}{' '}
                  ({conta.proof.name}). Aguardando a confirmação do administrador.
                </Alert>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<UploadFileIcon />}
                  disabled={enviando}
                >
                  {enviando
                    ? 'Enviando…'
                    : conta.proof
                      ? 'Trocar comprovante'
                      : 'Anexar comprovante'}
                  <input
                    hidden
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={enviarComprovante}
                  />
                </Button>
                {conta.proof && (
                  <>
                    <Button
                      variant="outlined"
                      href={`/api/billing/proof/${userId}?v=${encodeURIComponent(conta.proof.uploadedAt)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver
                    </Button>
                    <Button color="warning" onClick={removerComprovante}>
                      Remover
                    </Button>
                  </>
                )}
              </div>
              {avisoProva && (
                <Typography variant="caption" component="div" style={{ marginTop: 8 }}>
                  {avisoProva}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
        {conta && conta.active && (
          <Card variant="outlined" style={{ marginBottom: 16 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Próximos vencimentos
              </Typography>
              <Table size="small">
                <TableBody>
                  {conta.upcoming.map((p, i) => (
                    <TableRow key={p.due}>
                      <TableCell>
                        {dataBr(p.due)}
                        {i === 0 && <Chip size="small" label="próximo" style={{ marginLeft: 8 }} />}
                      </TableCell>
                      <TableCell align="right">{real(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        {conta && (
          <Card variant="outlined" className={classes.table}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Pagamentos realizados
              </Typography>
              {conta.payments.length === 0 ? (
                <Typography color="textSecondary">Nenhum pagamento registrado ainda.</Typography>
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
                    {conta.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{dataBr(p.paidOn)}</TableCell>
                        <TableCell>{dataBr(p.due)}</TableCell>
                        <TableCell align="right">{real(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </Container>
    </PageLayout>
  );
};

export default MySubscriptionPage;
