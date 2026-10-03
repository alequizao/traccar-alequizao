import { useEffect, useMemo, useState } from 'react';
import {
  Paper,
  IconButton,
  Tooltip,
  Button,
  MenuItem,
  Select,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import CloseIcon from '@mui/icons-material/Close';
import useFuel, { fuelNames, fuelOrder, real } from '../../common/util/useFuel';
import { map } from '../../map/core/MapView';

// Preço dos combustíveis por onde o veículo selecionado passa.
// Os dados vêm do próprio servidor Traccar (GET /api/fuel), que coleta direto na SEFAZ-AL.
const TIPOS = fuelOrder.map((codigo) => [codigo, fuelNames[codigo]]);

const useStyles = makeStyles()((theme) => ({
  botao: {
    position: 'absolute',
    right: theme.spacing(8),
    top: theme.spacing(7),
    zIndex: 5,
    backgroundColor: '#FFC107',
    color: '#000',
    fontWeight: 700,
    textTransform: 'none',
    boxShadow: theme.shadows[4],
    '&:hover': { backgroundColor: '#FFB300' },
    [theme.breakpoints.down('md')]: { top: theme.spacing(14) },
  },
  janela: {
    position: 'absolute',
    right: theme.spacing(8),
    top: theme.spacing(7),
    zIndex: 5,
    width: 'min(340px, calc(100vw - 72px))',
    maxHeight: 'max(190px, calc(100vh - 560px))',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 12,
    [theme.breakpoints.down('md')]: {
      top: theme.spacing(14),
      // deixa espaço para o popup do veículo (até ~500 px) não ficar por cima da lista
      maxHeight: 'max(88px, calc(100dvh - 612px))',
    },
  },
  barra: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5, 0.5, 0, 1.5),
    fontSize: 13,
    fontWeight: 600,
  },
  titulo: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  lista: { overflowY: 'auto', padding: 0 },
  preco: { fontWeight: 700, marginLeft: theme.spacing(1), whiteSpace: 'nowrap' },
  perto: {
    padding: theme.spacing(0.5, 1.5, 1),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  pertoLinha: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  pertoNome: {
    fontWeight: 700,
    fontSize: 15,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  aviso: { padding: theme.spacing(1, 1.5, 1.5) },
}));

const guarda = (chave, padrao) => {
  try {
    const v = localStorage.getItem(chave);
    return v === null ? padrao : v;
  } catch {
    return padrao;
  }
};
const salva = (chave, valor) => {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem armazenamento */
  }
};

const raioLista = 3; // km mostrados na lista e no mapa

const FuelWindow = ({ position, onStations }) => {
  const { classes } = useStyles();
  const [aberta, setAberta] = useState(() => guarda('combustivel-aberta', '0') === '1');
  const [tipo, setTipo] = useState(() => Number(guarda('combustivel-tipo', '1')) || 1);
  const { stations, failed } = useFuel(position, aberta);

  // postos que vendem o combustível escolhido, do mais barato ao mais caro, até 3 km
  const postos = useMemo(
    () =>
      stations
        .filter((p) => p.distance <= raioLista && p.prices[tipo] !== undefined)
        .map((p) => ({ ...p, price: p.prices[tipo] }))
        .sort((x, y) => x.price - y.price || x.distance - y.distance)
        .slice(0, 8),
    [stations, tipo],
  );

  useEffect(() => {
    onStations(aberta && position ? postos : []);
  }, [aberta, position, postos, onStations]);

  const alterna = (v) => {
    setAberta(v);
    salva('combustivel-aberta', v ? '1' : '0');
  };

  if (!position) return null;

  if (!aberta) {
    return (
      <Tooltip title="Preço dos combustíveis perto do veículo" placement="left">
        <Button
          className={classes.botao}
          onClick={() => alterna(true)}
          variant="contained"
          startIcon={<LocalGasStationIcon />}
          data-testid="botao-combustivel"
        >
          Combustível
        </Button>
      </Tooltip>
    );
  }

  return (
    <Paper className={classes.janela} elevation={6}>
      <div className={classes.barra}>
        <LocalGasStationIcon fontSize="small" />
        <Select
          className={classes.titulo}
          size="small"
          variant="standard"
          disableUnderline
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            salva('combustivel-tipo', String(e.target.value));
          }}
        >
          {TIPOS.map(([codigo, nome]) => (
            <MenuItem key={codigo} value={codigo}>
              {nome}
            </MenuItem>
          ))}
        </Select>
        <IconButton size="small" onClick={() => alterna(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      {failed && (
        <Typography variant="body2" className={classes.aviso}>
          Preços indisponíveis no momento.
        </Typography>
      )}
      {!failed && stations.length > 0 && postos.length === 0 && (
        <Typography variant="body2" className={classes.aviso}>
          Nenhum posto com esse combustível em 3 km.
        </Typography>
      )}
      <List dense className={classes.lista}>
        {postos.map((p, i) => (
          <ListItemButton
            key={p.cnpj}
            onClick={() => map.easeTo({ center: [p.longitude, p.latitude], zoom: 16 })}
          >
            <ListItemText
              primary={p.name}
              secondary={`${p.distance.toFixed(1).replace('.', ',')} km · ${p.neighborhood || p.city}`}
            />
            <span className={classes.preco} style={{ color: i === 0 ? '#2E7D32' : undefined }}>
              {real(p.price)}
            </span>
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
};

export default FuelWindow;
