// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { useGetConduction } from 'src/api/conduction';

import ConductionViewForm from '../conduction-view-form';

// ----------------------------------------------------------------------

export default function ConductionView() {
  const settings = useSettingsContext();

  const params = useParams();

  const { id } = params;

  const { conduction: currentConduction } = useGetConduction(id);

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
            name: 'Conduction',
            href: paths.dashboard.conduction.root,
          },
          {
            name: `${currentConduction?.firstName} ${currentConduction?.lastName ? currentConduction?.lastName : ''}`,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <ConductionViewForm currentConduction={currentConduction} />
    </Container>
  );
}
