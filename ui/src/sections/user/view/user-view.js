// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { useGetUser } from 'src/api/user';

import UserViewForm from '../user-view-form';

// ----------------------------------------------------------------------

export default function UserView() {
  const settings = useSettingsContext();

  const params = useParams();

  const { id } = params;

  const { user: currentUser } = useGetUser(id);

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
            name: 'User',
            href: paths.dashboard.user.root,
          },
          {
            name: `${currentUser?.firstName} ${currentUser?.lastName ? currentUser?.lastName : ''}`,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <UserViewForm currentUser={currentUser} />
    </Container>
  );
}
