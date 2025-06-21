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
import { useGetTrainer } from 'src/api/trainer';
import Iconify from 'src/components/iconify';
import { useCallback, useState } from 'react';
import TrainerNewEditForm from '../trainer-new-edit-form';

// ----------------------------------------------------------------------

export default function TrainerEditView() {
  const settings = useSettingsContext();

  const [currentTab, setCurrentTab] = useState('general');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const params = useParams();

  const { id } = params;

  const { trainer: currentTrainer } = useGetTrainer(id);

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
            name: 'Trainer',
            href: paths.dashboard.trainer.root,
          },
          {
            name: `${currentTrainer?.firstName} ${currentTrainer?.lastName ? currentTrainer?.lastName : ''}`,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <TrainerNewEditForm currentTrainer={currentTrainer} />
    </Container>
  );
}
