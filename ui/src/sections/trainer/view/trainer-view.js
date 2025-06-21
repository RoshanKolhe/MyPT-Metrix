// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hook';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import { useGetTrainer } from 'src/api/trainer';

import TrainerViewForm from '../trainer-view-form';

// ----------------------------------------------------------------------

export default function TrainerView() {
  const settings = useSettingsContext();

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

      <TrainerViewForm currentTrainer={currentTrainer} />
    </Container>
  );
}
