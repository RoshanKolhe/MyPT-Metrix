// @mui
import Container from '@mui/material/Container';
// routes
import { paths } from 'src/routes/paths';
// components
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
//
import TrainerNewEditForm from '../trainer-new-edit-form';

// ----------------------------------------------------------------------

export default function TrainerCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create a new Trainer"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Trainer',
            href: paths.dashboard.trainer.root,
          },
          { name: 'New trainer' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <TrainerNewEditForm />
    </Container>
  );
}
