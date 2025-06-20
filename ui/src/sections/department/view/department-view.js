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
import DepartmentViewForm from '../department-view-form';

// ----------------------------------------------------------------------

export default function DepartmentView() {
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

      <DepartmentViewForm currentDepartment={currentDepartment} />
    </Container>
  );
}
