import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
// auth
import { AuthGuard } from 'src/auth/guard';
// layouts
import DashboardLayout from 'src/layouts/dashboard';
// components
import { LoadingScreen } from 'src/components/loading-screen';
import { RolesAuthRoute } from './RolesAuthRoute';

// ----------------------------------------------------------------------

// OVERVIEW
const IndexPage = lazy(() => import('src/pages/dashboard/ecommerce'));

// USER
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserAccountPage = lazy(() => import('src/pages/dashboard/user/account'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
const UserViewPage = lazy(() => import('src/pages/dashboard/user/view'));

// STAFF
const StaffListPage = lazy(() => import('src/pages/dashboard/staff/list'));
const StaffCreatePage = lazy(() => import('src/pages/dashboard/staff/new'));
const StaffEditPage = lazy(() => import('src/pages/dashboard/staff/edit'));
const StaffViewPage = lazy(() => import('src/pages/dashboard/staff/view'));

// TARGET
const TargetListPage = lazy(() => import('src/pages/dashboard/target/list'));
const TargetCreatePage = lazy(() => import('src/pages/dashboard/target/new'));
const TargetEditPage = lazy(() => import('src/pages/dashboard/target/edit'));
const TargetViewPage = lazy(() => import('src/pages/dashboard/target/view'));
const TargetAssignTargetPage = lazy(() => import('src/pages/dashboard/target/assignTarget'));

// DEPARTMENT
const DepartmentListPage = lazy(() => import('src/pages/dashboard/department/list'));
const DepartmentCreatePage = lazy(() => import('src/pages/dashboard/department/new'));
const DepartmentEditPage = lazy(() => import('src/pages/dashboard/department/edit'));
const DepartmentViewPage = lazy(() => import('src/pages/dashboard/department/view'));

// KPI
const KpiListPage = lazy(() => import('src/pages/dashboard/kpi/list'));
const KpiCreatePage = lazy(() => import('src/pages/dashboard/kpi/new'));
const KpiEditPage = lazy(() => import('src/pages/dashboard/kpi/edit'));
const KpiViewPage = lazy(() => import('src/pages/dashboard/kpi/view'));

// BRANCH
const BranchListPage = lazy(() => import('src/pages/dashboard/branch/list'));
const BranchCreatePage = lazy(() => import('src/pages/dashboard/branch/new'));
const BranchEditPage = lazy(() => import('src/pages/dashboard/branch/edit'));
const BranchViewPage = lazy(() => import('src/pages/dashboard/branch/view'));

// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { element: <IndexPage />, index: true },
      { path: 'profile', element: <UserAccountPage /> },
      {
        path: 'user',
        element: <RolesAuthRoute roles={['super_admin', 'admin', 'cgm', 'hod']} />,
        children: [
          { element: <UserListPage />, index: true },
          { path: 'list', element: <UserListPage /> },
          { path: 'new', element: <UserCreatePage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          { path: ':id/view', element: <UserViewPage /> },
          { path: 'account', element: <UserAccountPage /> },
        ],
      },
      {
        path: 'target',
        element: <RolesAuthRoute roles={['super_admin', 'admin', 'cgm', 'hod']} />,
        children: [
          { element: <TargetListPage />, index: true },
          { path: 'list', element: <TargetListPage /> },
          { path: 'new', element: <TargetCreatePage /> },
          { path: ':id/edit', element: <TargetEditPage /> },
          { path: ':id/view', element: <TargetViewPage /> },
          { path: ':id/assign-trainer-target', element: <TargetAssignTargetPage /> },
        ],
      },
      {
        path: 'staff',
        element: <RolesAuthRoute roles={['super_admin', 'admin', 'cgm', 'hod']} />,
        children: [
          { element: <StaffListPage />, index: true },
          { path: 'list', element: <StaffListPage /> },
          { path: 'new', element: <StaffCreatePage /> },
          { path: ':id/edit', element: <StaffEditPage /> },
          { path: ':id/view', element: <StaffViewPage /> },
        ],
      },
      {
        path: 'department',
        element: <RolesAuthRoute roles={['super_admin', 'admin']} />,
        children: [
          { element: <DepartmentListPage />, index: true },
          { path: 'list', element: <DepartmentListPage /> },
          { path: 'new', element: <DepartmentCreatePage /> },
          { path: ':id/view', element: <DepartmentViewPage /> },
          { path: ':id/edit', element: <DepartmentEditPage /> },
        ],
      },
      {
        path: 'kpi',
        element: <RolesAuthRoute roles={['super_admin', 'admin']} />,
        children: [
          { element: <KpiListPage />, index: true },
          { path: 'list', element: <KpiListPage /> },
          { path: ':id/view', element: <KpiViewPage /> },
          { path: 'new', element: <KpiCreatePage /> },
          { path: ':id/edit', element: <KpiEditPage /> },
        ],
      },
      {
        path: 'branch',
        element: <RolesAuthRoute roles={['super_admin', 'admin']} />,
        children: [
          { element: <BranchListPage />, index: true },
          { path: 'list', element: <BranchListPage /> },
          { path: 'new', element: <BranchCreatePage /> },
          { path: ':id/edit', element: <BranchEditPage /> },
          { path: ':id/view', element: <BranchViewPage /> },
        ],
      },
    ],
  },
];
