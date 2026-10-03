import { useEffect, useMemo, useState } from 'react';
import fetchOrThrow from './fetchOrThrow';

// Preços de combustível por onde o veículo passa (GET /api/fuel/stations do próprio Traccar).
// Uma consulta só traz todos os combustíveis de cada posto. Ela é compartilhada entre o popup
// e o painel, e só se repete se o veículo andou mais de 1,5 km ou passaram 10 min. Entre uma
// consulta e outra, as distâncias são recalculadas aqui, sem rede.
export const fuelNames = {
  1: 'Gasolina',
  2: 'Gasolina aditivada',
  3: 'Etanol',
  4: 'Diesel',
  5: 'Diesel aditivado',
  6: 'GNV',
};
export const fuelOrder = [1, 3, 4, 6, 2, 5];

export const real = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export const metros = (a, b) => {
  const r = Math.PI / 180;
  const dx = (b.longitude - a.longitude) * r * Math.cos(((a.latitude + b.latitude) / 2) * r);
  const dy = (b.latitude - a.latitude) * r;
  return Math.sqrt(dx * dx + dy * dy) * 6371000;
};

export const routeUrl = (from, to) =>
  `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}&travelmode=driving`;

const shared = { pos: null, time: 0, stations: [], pending: false, listeners: new Set() };

const refresh = async (position) => {
  const near = shared.pos && metros(shared.pos, position) < 1500;
  if (shared.pending || (near && Date.now() - shared.time < 600000)) return;
  shared.pending = true;
  try {
    const response = await fetchOrThrow(
      `/api/fuel/stations?latitude=${position.latitude}&longitude=${position.longitude}&radius=6&limit=40`,
    );
    const data = await response.json();
    shared.stations = data.stations;
    shared.pos = { latitude: position.latitude, longitude: position.longitude };
    shared.time = Date.now();
    shared.listeners.forEach((listener) => listener(shared.stations, false));
  } catch {
    shared.listeners.forEach((listener) => listener(shared.stations, true));
  } finally {
    shared.pending = false;
  }
};

const useFuel = (position, active = true) => {
  const [state, setState] = useState({ base: shared.stations, failed: false });

  useEffect(() => {
    const listener = (base, failed) => setState({ base, failed });
    shared.listeners.add(listener);
    return () => shared.listeners.delete(listener);
  }, []);

  useEffect(() => {
    if (active && position) refresh(position);
  }, [active, position]);

  const stations = useMemo(
    () =>
      position && active
        ? state.base.map((s) => ({ ...s, distance: metros(position, s) / 1000 }))
        : [],
    [state.base, position, active],
  );

  const nearest = useMemo(
    () => stations.reduce((m, s) => (!m || s.distance < m.distance ? s : m), null),
    [stations],
  );

  return { stations, nearest, failed: state.failed && !stations.length };
};

export default useFuel;
