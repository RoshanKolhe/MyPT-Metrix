// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { useGetTarget } from 'src/api/target';

import TargetViewForm from '../target-view-form';

// ----------------------------------------------------------------------

export default function TargetView() {
  const settings = useSettingsContext();

  const params = useParams();

  const { id } = params;

  const { target: currentTarget } = useGetTarget(id);

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
            name: 'Target',
            href: paths.dashboard.target.root,
          },
          {
            name: currentTarget?.branch?.name,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <TargetViewForm currentTarget={currentTarget} />
    </Container>
  );
}
