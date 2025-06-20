// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import DepartmentNewEditForm from '../department-new-edit-form';
//

// ----------------------------------------------------------------------

export default function DepartmentCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create a new Department"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Department',
            href: paths.dashboard.department.list,
          },
          { name: 'New Department' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <DepartmentNewEditForm />
    </Container>
  );
}
