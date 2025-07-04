// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import ConductionNewEditForm from '../conduction-new-edit-form';

// ----------------------------------------------------------------------

export default function ConductionCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create a new Conduction"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Conduction',
            href: paths.dashboard.conduction.root,
          },
          { name: 'New conduction' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <ConductionNewEditForm />
    </Container>
  );
}
