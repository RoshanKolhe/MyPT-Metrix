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

// TRAINER
const TrainerListPage = lazy(() => import('src/pages/dashboard/trainer/list'));
const TrainerCreatePage = lazy(() => import('src/pages/dashboard/trainer/new'));
const TrainerEditPage = lazy(() => import('src/pages/dashboard/trainer/edit'));
const TrainerViewPage = lazy(() => import('src/pages/dashboard/trainer/view'));

// DEPARTMENT
const DepartmentListPage = lazy(() => import('src/pages/dashboard/department/list'));
const DepartmentCreatePage = lazy(() => import('src/pages/dashboard/department/new'));
const DepartmentEditPage = lazy(() => import('src/pages/dashboard/department/edit'));
const DepartmentViewPage = lazy(() => import('src/pages/dashboard/department/view'));

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
        element: <RolesAuthRoute roles={['super_admin', 'admin']} />,
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
        path: 'trainer',
        element: <RolesAuthRoute roles={['super_admin', 'admin']} />,
        children: [
          { element: <TrainerListPage />, index: true },
          { path: 'list', element: <TrainerListPage /> },
          { path: 'new', element: <TrainerCreatePage /> },
          { path: ':id/edit', element: <TrainerEditPage /> },
          { path: ':id/view', element: <TrainerViewPage /> },
        ],
      },
      {
        path: 'department',
        element: <RolesAuthRoute roles={['super_admin', 'admin']} />,
        children: [
          { element: <DepartmentListPage />, index: true },
          { path: 'list', element: <DepartmentListPage /> },
          { path: 'new', element: <DepartmentCreatePage /> },
          { path: ':id/edit', element: <DepartmentEditPage /> },
          { path: ':id/view', element: <DepartmentViewPage /> },
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
