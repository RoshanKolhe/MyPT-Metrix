// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import KpiNewEditForm from '../kpi-new-edit-form';
//

// ----------------------------------------------------------------------

export default function KpiCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create a new Kpi"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Kpi',
            href: paths.dashboard.kpi.list,
          },
          { name: 'New Kpi' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <KpiNewEditForm />
    </Container>
  );
}
