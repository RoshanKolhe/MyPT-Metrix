// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { useGetStaff } from 'src/api/staff';

import StaffViewForm from '../staff-view-form';

// ----------------------------------------------------------------------

export default function StaffView() {
  const settings = useSettingsContext();

  const params = useParams();

  const { id } = params;

  const { staff: currentStaff } = useGetStaff(id);

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
            name: 'Staff',
            href: paths.dashboard.staff.root,
          },
          {
            name: `${currentStaff?.firstName} ${currentStaff?.lastName ? currentStaff?.lastName : ''}`,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <StaffViewForm currentStaff={currentStaff} />
    </Container>
  );
}
