// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import StaffNewEditForm from '../staff-new-edit-form';

// ----------------------------------------------------------------------

export default function StaffCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create a new Staff"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Staff',
            href: paths.dashboard.staff.root,
          },
          { name: 'New staff' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <StaffNewEditForm />
    </Container>
  );
}
