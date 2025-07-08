// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { useGetSale } from 'src/api/sale';

import SaleViewForm from '../sale-view-form';

// ----------------------------------------------------------------------

export default function SaleView() {
  const settings = useSettingsContext();

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
          { name: 'New sale' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <SaleViewForm currentSale={currentSale} />
    </Container>
  );
}
