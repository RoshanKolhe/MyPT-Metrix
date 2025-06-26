// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { Tab, Tabs } from '@mui/material';
import { useGetTarget } from 'src/api/target';
import Iconify from 'src/components/iconify';
import { useCallback, useState } from 'react';
import TargetNewEditForm from '../target-new-edit-form';

// ----------------------------------------------------------------------

export default function TargetEditView() {
  const settings = useSettingsContext();

  const [currentTab, setCurrentTab] = useState('general');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

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

      <TargetNewEditForm currentTarget={currentTarget} />
    </Container>
  );
}
