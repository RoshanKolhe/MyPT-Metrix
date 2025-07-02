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
import { useGetDepartmentTarget, useGetTarget } from 'src/api/target';
import Iconify from 'src/components/iconify';
import { useCallback, useState } from 'react';
import TargetNewEditAssignTrainerForm from '../target-new-edit-assign-trainer';

// ----------------------------------------------------------------------

export default function TargetAssignTrainerView() {
  const settings = useSettingsContext();

  const params = useParams();

  const { targetId, deptId } = params;
  const { depTarget: currentDepartmentTarget } = useGetDepartmentTarget(targetId, deptId);

  console.log('currentDepartmentTarget', currentDepartmentTarget);

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
            name: currentDepartmentTarget?.data?.department?.name,
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <TargetNewEditAssignTrainerForm currentDepartmentTarget={currentDepartmentTarget?.data} />
    </Container>
  );
}
