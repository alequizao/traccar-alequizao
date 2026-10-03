import { Navigate } from 'react-router-dom';
import { useAdministrator } from '../common/util/permissions';

// /finance: o administrador abre a Cobrança; o cliente abre a própria assinatura.
const FinancePage = () => {
  const admin = useAdministrator();
  return <Navigate to={admin ? '/finance/billing' : '/finance/subscription'} replace />;
};

export default FinancePage;
