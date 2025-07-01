// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import SaleNewEditForm from '../sale-new-edit-form';

// ----------------------------------------------------------------------

export default function SaleCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create a new Sale"
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

      <SaleNewEditForm />
    </Container>
  );
}
