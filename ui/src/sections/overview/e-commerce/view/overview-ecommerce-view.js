// @mui
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
// _mock
import { _ecommerceBestSalesman } from 'src/_mock';
// components
import { useSettingsContext } from 'src/components/settings';
//
import {
  useGetDashboradChartData,
  useGetDashboradConductionsData,
  useGetDashboradMaleToFemaleRatio,
  useGetDashboradMemberStatistics,
  useGetDashboradSummary,
} from 'src/api/user';
import { fShortenNumber } from 'src/utils/format-number';
import { Box } from '@mui/material';
import { useState } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { useGetBranchsWithFilter } from 'src/api/branch';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import EcommerceYearlySales from '../ecommerce-yearly-sales';
import EcommerceBestSalesman from '../ecommerce-best-salesman';
import EcommerceSaleByGender from '../ecommerce-sale-by-gender';
import EcommerceWidgetSummary from '../ecommerce-widget-summary';
import EcommerceYearlyConductions from '../ecommerce-yearly-conductions';
import EcommerceTargetForecasting from '../ecommerce-target-forecasting';
import EcommerceFiltersForm from '../ecommerce-filters-form';
import EcommerceMemberStatistics from '../ecommerce-member-statistics';

// ----------------------------------------------------------------------

export default function OverviewEcommerceView() {
  const { user } = useAuthContext();
  const isSuperOrAdmin =
    user?.permissions?.includes('super_admin') || user?.permissions?.includes('admin');

  const [filters, setFilters] = useState({
    branch: null,
    department: null,
    kpis: [],
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    country: null,
  });

  const [showFilters, setShowFilters] = useState(false);

  const queryString = [
    filters.kpis?.length ? `kpiIds=${filters.kpis.map((k) => k.id).join(',')}` : '',
    filters.branch?.id ? `branchId=${filters.branch.id}` : '',
    filters.department?.id ? `departmentId=${filters.department.id}` : '',
    filters.startDate ? `startDate=${format(new Date(filters.startDate), 'yyyy-MM-dd')}` : '',
    filters.endDate ? `endDate=${format(new Date(filters.endDate), 'yyyy-MM-dd')}` : '',
    filters.country ? `country=${filters.country}` : '', // <-- NEW line
  ]
    .filter(Boolean)
    .join('&');

  const { dashboardCounts, refreshDashboardSummary } = useGetDashboradSummary(queryString);
  const { dashboradChartData = {}, refreshDashboradChartData } =
    useGetDashboradChartData(queryString);
  const { dashboradConductionsData = {} } = useGetDashboradConductionsData(queryString);
  const { dashboradMaleToFemaleRatioData = {} } = useGetDashboradMaleToFemaleRatio(queryString);
  const { dashboardMemberStatistics = {} } = useGetDashboradMemberStatistics(queryString);

  const rawFilter = {
    where: {
      isActive: true,
    },
  };

  const encodedFilter = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}`;

  const { filteredbranches: branches } = useGetBranchsWithFilter(encodedFilter);

  const theme = useTheme();

  const settings = useSettingsContext();

  const handleFilterChange = (newValues) => {
    console.log('Filter changed:', newValues);

    // Merge new values with previous filters
    const updatedFilters = {
      ...filters,
      ...newValues,
    };

    setFilters(updatedFilters);

    // Generate query string from updatedFilters
  };

  const handleSubmitFiltersForm = (formData) => {
    console.info('Form submitted with data:', formData);
    const updatedQueryString = [
      filters.kpis?.length ? `kpiIds=${filters.kpis.map((k) => k.id).join(',')}` : '',
      filters.branch?.id ? `branchId=${filters.branch.id}` : '',
      filters.department?.id ? `departmentId=${filters.department.id}` : '',
      filters.startDate ? `startDate=${new Date(filters.startDate).toISOString()}` : '',
      filters.endDate ? `endDate=${new Date(filters.endDate).toISOString()}` : '',
      filters.country ? `country=${filters.country}` : '',
    ]
      .filter(Boolean)
      .join('&');

    // Call with latest query string
    refreshDashboardSummary(updatedQueryString);
    refreshDashboradChartData(updatedQueryString);
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {isSuperOrAdmin ? (
        <>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <EcommerceFiltersForm
                  showFilters={showFilters}
                  setShowFilter={setShowFilters}
                  branches={branches}
                  onFilterChange={handleFilterChange}
                  filterValues={filters}
                  handleSubmitFiltersForm={handleSubmitFiltersForm}
                />
              </Grid>
            </Grid>
          </Box>
          <Grid container spacing={3}>
            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title="Total Revenue"
                percent={dashboardCounts?.revenue?.percent}
                total={fShortenNumber(dashboardCounts?.revenue?.value || 0)}
                chart={{
                  series: dashboardCounts?.revenue?.series || [],
                }}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title="Total Units"
                percent={dashboardCounts?.tickets?.percent}
                total={fShortenNumber(dashboardCounts?.tickets?.value || 0)}
                chart={{
                  colors: [theme.palette.info.light, theme.palette.info.main],
                  series: dashboardCounts?.tickets?.series || [],
                }}
              />
            </Grid>

            <Grid xs={12} md={4}>
              <EcommerceWidgetSummary
                title="Avg Unit Value"
                percent={dashboardCounts?.averageTicket?.percent}
                total={fShortenNumber(dashboardCounts?.averageTicket?.value || 0)}
                chart={{
                  colors: [theme.palette.warning.light, theme.palette.warning.main],
                  series: dashboardCounts?.averageTicket?.series || [],
                }}
              />
            </Grid>

            <Grid xs={12} md={12} lg={12}>
              <EcommerceYearlySales
                title="Daily KPI Sales"
                subheader="Tracks daily PT & Membership client additions over time"
                chart={[]}
                filterValues={filters}
                dashboradChartData={dashboradChartData}
              />
            </Grid>

            <Grid xs={12} md={12} lg={12}>
              <EcommerceYearlyConductions
                title="Daily Conductions"
                subheader="Tracks daily conductions over time"
                chart={[]}
                filterValues={filters}
                dashboradConductionsData={dashboradConductionsData}
              />
            </Grid>

            <Grid xs={12} md={6} lg={4}>
              <EcommerceSaleByGender
                title="Sale By Gender"
                dashboradMaleToFemaleRatioData={dashboradMaleToFemaleRatioData}
              />
            </Grid>
            <Grid xs={12} md={6} lg={4}>
              <EcommerceMemberStatistics
                title="Member Statistics"
                dashboardMemberStatistics={dashboardMemberStatistics}
              />
            </Grid>

            <Grid xs={12} md={12} lg={12}>
              <EcommerceTargetForecasting title="Forecasting" subheader="Target forecasting" />
            </Grid>

            {/* <Grid xs={12} md={6} lg={8}>
              <EcommerceSalesOverview title="Sales Overview" data={_ecommerceSalesOverview} />
            </Grid> */}

            <Grid xs={12} md={12} lg={12}>
              <EcommerceBestSalesman
                title="Best Salesman"
                tableData={_ecommerceBestSalesman}
                tableLabels={[
                  { id: 'name', label: 'Seller' },
                  { id: 'category', label: 'Product' },
                  { id: 'country', label: 'Country', align: 'center' },
                  { id: 'totalAmount', label: 'Total', align: 'right' },
                  { id: 'rank', label: 'Rank', align: 'right' },
                ]}
              />
            </Grid>
          </Grid>
        </>
      ) : null}
    </Container>
  );
}
