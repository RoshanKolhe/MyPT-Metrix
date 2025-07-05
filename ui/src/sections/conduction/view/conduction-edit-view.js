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
import { useGetConduction } from 'src/api/conduction';
import Iconify from 'src/components/iconify';
import { useCallback, useState } from 'react';
import ConductionNewEditForm from '../conduction-new-edit-form';

// ----------------------------------------------------------------------

export default function ConductionEditView() {
  const settings = useSettingsContext();

  const [currentTab, setCurrentTab] = useState('general');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

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
            name: currentConduction?.memberName || 'Conduction Detail',
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <ConductionNewEditForm currentConduction={currentConduction} />
    </Container>
  );
}
