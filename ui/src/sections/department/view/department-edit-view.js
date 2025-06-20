// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { useGetDepartment } from 'src/api/department';
import DepartmentNewEditForm from '../department-new-edit-form';

// ----------------------------------------------------------------------

export default function DepartmentEditView() {
  const settings = useSettingsContext();

  const params = useParams();

  const { id } = params;

  const { department: currentDepartment } = useGetDepartment(id);

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
            name: 'Department',
            href: paths.dashboard.department.root,
          },
          {
            name: `${currentDepartment?.name}`,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <DepartmentNewEditForm currentDepartment={currentDepartment} />
    </Container>
  );
}
