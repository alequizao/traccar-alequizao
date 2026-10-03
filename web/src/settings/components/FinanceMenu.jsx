import { List } from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator } from '../../common/util/permissions';
import MenuItem from '../../common/components/MenuItem';

// Menu lateral do Financeiro: "Minha assinatura" para todos e "Cobrança" para o administrador.
const FinanceMenu = () => {
  const t = useTranslation();
  const location = useLocation();
  const admin = useAdministrator();

  return (
    <List>
      {admin && (
        <MenuItem
          title={t('cobrancaTitulo')}
          link="/finance/billing"
          icon={<RequestQuoteRoundedIcon />}
          selected={location.pathname === '/finance/billing'}
        />
      )}
      <MenuItem
        title={t('assinaturaTitulo')}
        link="/finance/subscription"
        icon={<ReceiptLongRoundedIcon />}
        selected={location.pathname === '/finance/subscription'}
      />
    </List>
  );
};

export default FinanceMenu;
