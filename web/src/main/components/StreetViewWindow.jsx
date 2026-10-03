import { useEffect, useRef, useState } from 'react';
import { Paper, IconButton, Tooltip, Button } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import StreetviewIcon from '@mui/icons-material/Streetview';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import NavigationIcon from '@mui/icons-material/Navigation';

// Janelinha de Vista 3D (satélite inclinado + prédios 3D, sem chave de API; página própria em alequizao.com/vista3d).
// Segue a posição e o rumo do veículo selecionado; só recarrega quando ele andou
// mais de 25 m ou virou mais de 25 graus, no máximo a cada 6 s.
const useStyles = makeStyles()((theme) => ({
  botao: {
    position: 'absolute',
    right: theme.spacing(8),
    top: theme.spacing(1.5),
    zIndex: 5,
    backgroundColor: '#FFC107',
    color: '#000',
    fontWeight: 700,
    textTransform: 'none',
    boxShadow: theme.shadows[4],
    '&:hover': { backgroundColor: '#FFB300' },
    [theme.breakpoints.down('md')]: { top: theme.spacing(9), right: theme.spacing(8) },
  },
  janela: {
    position: 'absolute',
    right: theme.spacing(8),
    top: theme.spacing(1.5),
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 12,
    [theme.breakpoints.down('md')]: { top: theme.spacing(9), right: theme.spacing(8) },
  },
  barra: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0, 0.5, 0, 1.5),
    fontSize: 13,
    fontWeight: 600,
    minHeight: 36,
  },
  titulo: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  quadro: { border: 0, width: '100%', flex: 1, display: 'block', background: '#222' },
}));

const distancia = (a, b) => {
  const r = Math.PI / 180;
  const dx = (b.longitude - a.longitude) * r * Math.cos(((a.latitude + b.latitude) / 2) * r);
  const dy = (b.latitude - a.latitude) * r;
  return Math.sqrt(dx * dx + dy * dy) * 6371000;
};

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

const StreetViewWindow = ({ position, nome }) => {
  const { classes } = useStyles();
  const [aberta, setAberta] = useState(() => guarda('streetview-aberta', '0') === '1');
  const [grande, setGrande] = useState(() => guarda('streetview-grande', '0') === '1');
  const [alvo, setAlvo] = useState(null);
  const [inicial, setInicial] = useState(null);
  const quadroRef = useRef(null);
  const ultimoRef = useRef({ pos: null, curso: 0, hora: 0 });

  useEffect(() => {
    if (!aberta || !position) return;
    const u = ultimoRef.current;
    const curso = Math.round(position.course || 0);
    const dif = Math.abs(((curso - u.curso + 540) % 360) - 180);
    const andou = !u.pos || distancia(u.pos, position) > 25;
    const virou = u.pos && dif > 25;
    if (u.pos && !andou && !virou) return;
    const espera = Math.max(0, 6000 - (Date.now() - u.hora));
    const t = setTimeout(
      () => {
        ultimoRef.current = { pos: position, curso, hora: Date.now() };
        const novo = { lat: position.latitude, lon: position.longitude, curso };
        setAlvo(novo);
        setInicial((i) => i || novo);
        quadroRef.current?.contentWindow?.postMessage(
          { tipo: 'vista3d', ...novo, rumo: curso },
          '*',
        );
      },
      u.pos ? espera : 0,
    );
    return () => clearTimeout(t);
  }, [aberta, position]);

  const alterna = (v) => {
    setAberta(v);
    salva('streetview-aberta', v ? '1' : '0');
    if (!v) {
      ultimoRef.current = { pos: null, curso: 0, hora: 0 };
      setInicial(null);
    }
  };
  const tamanho = (v) => {
    setGrande(v);
    salva('streetview-grande', v ? '1' : '0');
  };

  if (!position) return null;

  if (!aberta) {
    return (
      <Tooltip title="Vista 3D do veículo" placement="left">
        <Button
          className={classes.botao}
          onClick={() => alterna(true)}
          variant="contained"
          startIcon={<StreetviewIcon />}
          data-testid="botao-vista3d"
        >
          Vista 3D
        </Button>
      </Tooltip>
    );
  }

  const w = grande ? 560 : 320;
  const h = grande ? 380 : 220;
  const src = inicial
    ? `/vista3d/index.html?v=2&lat=${inicial.lat}&lon=${inicial.lon}&rumo=${inicial.curso}&nome=${encodeURIComponent(nome || '')}`
    : null;

  return (
    <Paper
      className={classes.janela}
      elevation={6}
      style={{ width: `min(${w}px, 92vw)`, height: h + 36 }}
    >
      <div className={classes.barra}>
        <NavigationIcon
          fontSize="small"
          style={{ transform: `rotate(${alvo ? alvo.curso : 0}deg)` }}
        />
        <span className={classes.titulo}>{nome || 'Vista 3D'}</span>
        <IconButton size="small" onClick={() => tamanho(!grande)}>
          {grande ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
        </IconButton>
        <IconButton size="small" onClick={() => alterna(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      {src && <iframe ref={quadroRef} className={classes.quadro} title="Vista 3D" src={src} />}
    </Paper>
  );
};

export default StreetViewWindow;
