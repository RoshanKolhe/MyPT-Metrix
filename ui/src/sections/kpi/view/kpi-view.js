// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { useGetKpi } from 'src/api/kpi';
import KpiViewForm from '../kpi-view-form';

// ----------------------------------------------------------------------

export default function KpiView() {
  const settings = useSettingsContext();

  const params = useParams();

  const { id } = params;

  const { kpi: currentKpi } = useGetKpi(id);

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
            name: 'Kpi',
            href: paths.dashboard.kpi.root,
          },
          {
            name: `${currentKpi?.name}`,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <KpiViewForm currentKpi={currentKpi} />
    </Container>
  );
}
