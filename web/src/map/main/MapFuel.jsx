import { useMemo } from 'react';
import { map } from '../core/MapView';
import useMapLayer from '../core/useMapLayer';
import { findFonts } from '../core/mapUtil';

// Postos perto do veículo selecionado, com o preço escrito ao lado do ponto.
// O mais barato fica verde, os demais amarelos (cor da marca).
const MapFuel = ({ stations }) => {
  const data = useMemo(() => {
    const menor = stations.length ? Math.min(...stations.map((s) => s.price)) : 0;
    return {
      type: 'FeatureCollection',
      features: stations.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
        properties: {
          label: `R$ ${s.price.toFixed(2).replace('.', ',')}`,
          barato: s.price === menor ? 1 : 0,
        },
      })),
    };
  }, [stations]);

  useMapLayer({
    source: { type: 'geojson' },
    layers: [
      {
        key: 'ponto',
        type: 'circle',
        paint: {
          'circle-radius': 7,
          'circle-color': ['case', ['==', ['get', 'barato'], 1], '#2E7D32', '#FFC107'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      },
      {
        key: 'preco',
        type: 'symbol',
        layout: {
          'text-field': '{label}',
          'text-font': findFonts(map),
          'text-size': 12,
          'text-anchor': 'top',
          'text-offset': [0, 0.9],
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#111111', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
      },
    ],
    layersDeps: [],
    data,
    dataDeps: [data],
  });

  return null;
};

export default MapFuel;
