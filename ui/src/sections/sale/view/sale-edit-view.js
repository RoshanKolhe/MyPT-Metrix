// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { Tab, Tabs } from '@mui/material';
import { useGetSale } from 'src/api/sale';
import Iconify from 'src/components/iconify';
import { useCallback, useState } from 'react';
import SaleNewEditForm from '../sale-new-edit-form';

// ----------------------------------------------------------------------

export default function SaleEditView() {
  const settings = useSettingsContext();

  const [currentTab, setCurrentTab] = useState('general');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const params = useParams();

  const { id } = params;

  const { sale: currentSale } = useGetSale(id);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Sale',
            href: paths.dashboard.sale.root,
          },
          {
            name: currentSale?.memberName || 'Sale Detail',
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <SaleNewEditForm currentSale={currentSale} />
    </Container>
  );
}
