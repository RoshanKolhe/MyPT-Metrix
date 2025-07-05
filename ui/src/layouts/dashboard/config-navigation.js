import { useMemo } from 'react';
// routes
import { paths } from 'src/routes/paths';
// locales
import { useLocales } from 'src/locales';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
  // OR
  // <Iconify icon="fluent:mail-24-filled" />
  // https://icon-sets.iconify.design/solar/
  // https://www.streamlinehq.com/icons
);

const ICONS = {
  job: icon('ic_job'),
  blog: icon('ic_blog'),
  chat: icon('ic_chat'),
  mail: icon('ic_mail'),
  user: icon('ic_user'),
  staff: icon('ic_staff'),
  target: icon('ic_target'),
  file: icon('ic_file'),
  lock: icon('ic_lock'),
  tour: icon('ic_tour'),
  order: icon('ic_order'),
  label: icon('ic_label'),
  kpi: icon('ic_kpi'),
  blank: icon('ic_blank'),
  kanban: icon('ic_kanban'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  invoice: icon('ic_invoice'),
  product: icon('ic_product'),
  calendar: icon('ic_calendar'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
  branch: icon('ic_branch'),
  sale: icon('ic_sale'),
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { t } = useLocales();
  const { user } = useAuthContext();

  let data = [];
  if (user && (user.permissions.includes('super_admin') || user.permissions.includes('admin'))) {
    data = [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: t('overview'),
        items: [{ title: t('dashboard'), path: paths.dashboard.root, icon: ICONS.dashboard }],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('management'),
        items: [
          // USER
          {
            title: t('user'),
            path: paths.dashboard.user.root,
            icon: ICONS.user,
            children: [
              { title: t('list'), path: paths.dashboard.user.list },
              { title: t('create'), path: paths.dashboard.user.new },
            ],
          },
          // TARGET
          {
            title: t('target'),
            path: paths.dashboard.target.root,
            icon: ICONS.target,
            children: [
              { title: t('list'), path: paths.dashboard.target.list },
              { title: t('create'), path: paths.dashboard.target.new },
            ],
          },
          // STAFF
          {
            title: t('staff'),
            path: paths.dashboard.staff.root,
            icon: ICONS.staff,
            children: [
              { title: t('list'), path: paths.dashboard.staff.list },
              { title: t('create'), path: paths.dashboard.staff.new },
            ],
          },
          // SALE
          {
            title: t('sale'),
            path: paths.dashboard.sale.root,
            icon: ICONS.sale,
            children: [
              { title: t('list'), path: paths.dashboard.sale.list },
              { title: t('create'), path: paths.dashboard.sale.new },
            ],
          },
        ],
      },
      // MASTERS
      {
        subheader: t('masters'),
        items: [
          // Department
          {
            title: t('department'),
            path: paths.dashboard.department.root,
            icon: ICONS.label,
            roles: ['super_admin'],
            children: [
              {
                title: t('list'),
                path: paths.dashboard.department.list,
                roles: ['super_admin'],
              },
              {
                title: t('create'),
                path: paths.dashboard.department.new,
                roles: ['super_admin'],
              },
            ],
          },
          // KPI
          {
            title: t('Kpi'),
            path: paths.dashboard.kpi.root,
            icon: ICONS.kpi,
            roles: ['super_admin'],
            children: [
              {
                title: t('list'),
                path: paths.dashboard.kpi.list,
                roles: ['super_admin'],
              },
              {
                title: t('create'),
                path: paths.dashboard.kpi.new,
                roles: ['super_admin'],
              },
            ],
          },
          // Branch
          {
            title: t('branch'),
            path: paths.dashboard.branch.root,
            icon: ICONS.branch,
            roles: ['super_admin'],
            children: [
              {
                title: t('list'),
                path: paths.dashboard.branch.list,
                roles: ['super_admin'],
              },
              {
                title: t('create'),
                path: paths.dashboard.branch.new,
                roles: ['super_admin'],
              },
            ],
          },
        ],
      },
    ];
  }
  if (user && user.permissions.includes('cgm')) {
    data = [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: t('overview'),
        items: [{ title: t('dashboard'), path: paths.dashboard.root, icon: ICONS.dashboard }],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('management'),
        items: [
          // USER
          {
            title: t('user'),
            path: paths.dashboard.user.root,
            icon: ICONS.user,
            children: [
              { title: t('list'), path: paths.dashboard.user.list },
              { title: t('create'), path: paths.dashboard.user.new },
            ],
          },
          // TARGET
          {
            title: t('target'),
            path: paths.dashboard.target.root,
            icon: ICONS.target,
            children: [{ title: t('list'), path: paths.dashboard.target.list }],
          },
          // STAFF
          {
            title: t('staff'),
            path: paths.dashboard.staff.root,
            icon: ICONS.staff,
            children: [
              { title: t('list'), path: paths.dashboard.staff.list },
              { title: t('create'), path: paths.dashboard.staff.new },
            ],
          },
          // SALE
          {
            title: t('sale'),
            path: paths.dashboard.sale.root,
            icon: ICONS.sale,
            children: [
              { title: t('list'), path: paths.dashboard.sale.list },
              { title: t('create'), path: paths.dashboard.sale.new },
            ],
          },
        ],
      },
    ];
  }

  if (user && user.permissions.includes('hod')) {
    data = [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: t('overview'),
        items: [{ title: t('dashboard'), path: paths.dashboard.root, icon: ICONS.dashboard }],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('management'),
        items: [
          // USER
          {
            title: t('user'),
            path: paths.dashboard.user.root,
            icon: ICONS.user,
            children: [
              { title: t('list'), path: paths.dashboard.user.list },
              { title: t('create'), path: paths.dashboard.user.new },
            ],
          },
          // TARGET
          {
            title: t('target'),
            path: paths.dashboard.target.root,
            icon: ICONS.target,
            children: [
              { title: t('list'), path: paths.dashboard.target.list },
              { title: t('create'), path: paths.dashboard.target.new },
            ],
          },
          // STAFF
          {
            title: t('staff'),
            path: paths.dashboard.staff.root,
            icon: ICONS.staff,
            children: [
              { title: t('list'), path: paths.dashboard.staff.list },
              { title: t('create'), path: paths.dashboard.staff.new },
            ],
          },
          // SALE
          {
            title: t('sale'),
            path: paths.dashboard.sale.root,
            icon: ICONS.sale,
            children: [
              { title: t('list'), path: paths.dashboard.sale.list },
              { title: t('create'), path: paths.dashboard.sale.new },
            ],
          },
        ],
      },
    ];
  }
  return data;
}
