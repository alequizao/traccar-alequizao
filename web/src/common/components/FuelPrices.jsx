import { Link } from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';
import { fuelNames, fuelOrder, real, routeUrl } from '../util/useFuel';

// Nome do posto (clicável: abre a rota até ele) e os preços de todos os combustíveis.
const FuelPrices = ({ station, from }) => (
  <span>
    <Link
      href={routeUrl(from, station)}
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}
    >
      <NavigationIcon style={{ fontSize: 14 }} />
      {station.name}
    </Link>
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '0 12px', margin: '2px 0' }}>
      {fuelOrder
        .filter((type) => station.prices[type] !== undefined)
        .map((type) => (
          <span key={type} style={{ whiteSpace: 'nowrap' }}>
            {fuelNames[type]} <strong>{real(station.prices[type])}</strong>
          </span>
        ))}
    </span>
    <span style={{ fontSize: '0.85em' }}>
      {station.distance.toFixed(1).replace('.', ',')} km · {station.neighborhood || station.city}
    </span>
  </span>
);

export default FuelPrices;
