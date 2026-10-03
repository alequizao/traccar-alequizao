import { useEffect, useRef, useState } from 'react';
import { Paper, IconButton, Tooltip } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import StreetviewIcon from '@mui/icons-material/Streetview';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import NavigationIcon from '@mui/icons-material/Navigation';

// Janelinha de Street View sem chave de API (embed público do Google).
// Segue a posição e o rumo do veículo selecionado; só recarrega quando ele andou
// mais de 25 m ou virou mais de 25 graus, no máximo a cada 6 s.
const useStyles = makeStyles()((theme) => ({
  botao: {
    position: 'absolute',
    right: theme.spacing(8),
    top: theme.spacing(1.5),
    zIndex: 5,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[3],
    '&:hover': { backgroundColor: theme.palette.background.paper },
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
    [theme.breakpoints.down('md')]: { top: theme.spacing(1), right: theme.spacing(7) },
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
  const ultimo = useRef({ pos: null, curso: 0, hora: 0 });

  useEffect(() => {
    if (!aberta || !position) return;
    const u = ultimo.current;
    const curso = Math.round(position.course || 0);
    const dif = Math.abs(((curso - u.curso + 540) % 360) - 180);
    const andou = !u.pos || distancia(u.pos, position) > 25;
    const virou = u.pos && dif > 25;
    if (u.pos && !andou && !virou) return;
    const espera = Math.max(0, 6000 - (Date.now() - u.hora));
    const t = setTimeout(() => {
      ultimo.current = { pos: position, curso, hora: Date.now() };
      setAlvo({ lat: position.latitude, lon: position.longitude, curso });
    }, u.pos ? espera : 0);
    return () => clearTimeout(t);
  }, [aberta, position]);

  const alterna = (v) => {
    setAberta(v);
    salva('streetview-aberta', v ? '1' : '0');
    if (!v) ultimo.current = { pos: null, curso: 0, hora: 0 };
  };
  const tamanho = (v) => {
    setGrande(v);
    salva('streetview-grande', v ? '1' : '0');
  };

  if (!position) return null;

  if (!aberta) {
    return (
      <Tooltip title="Street View do veículo" placement="left">
        <IconButton className={classes.botao} onClick={() => alterna(true)} size="small">
          <StreetviewIcon />
        </IconButton>
      </Tooltip>
    );
  }

  const w = grande ? 560 : 320;
  const h = grande ? 380 : 220;
  const src = alvo
    ? `https://maps.google.com/maps?layer=c&cbll=${alvo.lat},${alvo.lon}&cbp=12,${alvo.curso},0,0,0&source=embed&output=svembed`
    : null;

  return (
    <Paper className={classes.janela} elevation={6} style={{ width: `min(${w}px, 92vw)`, height: h + 36 }}>
      <div className={classes.barra}>
        <NavigationIcon fontSize="small" style={{ transform: `rotate(${alvo ? alvo.curso : 0}deg)` }} />
        <span className={classes.titulo}>{nome || 'Street View'}</span>
        <IconButton size="small" onClick={() => tamanho(!grande)}>
          {grande ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
        </IconButton>
        <IconButton size="small" onClick={() => alterna(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      {src && <iframe className={classes.quadro} title="Street View" src={src} allowFullScreen loading="lazy" />}
    </Paper>
  );
};

export default StreetViewWindow;
