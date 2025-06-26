// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import TargetNewEditForm from '../target-new-edit-form';

// ----------------------------------------------------------------------

export default function TargetCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create a new Target"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Target',
            href: paths.dashboard.target.root,
          },
          { name: 'New target' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <TargetNewEditForm />
    </Container>
  );
}
