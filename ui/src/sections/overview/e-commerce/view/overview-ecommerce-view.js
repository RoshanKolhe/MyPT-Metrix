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
  useGetDashboradConductionSummary,
  useGetDashboradMaleToFemaleRatio,
  useGetDashboradMemberStatistics,
  useGetDashboradPtsVsMembershipRatio,
  useGetDashboradSummary,
} from 'src/api/user';
import { fShortenNumber } from 'src/utils/format-number';
import { Box } from '@mui/material';
import { useState } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { useGetBranchsWithFilter } from 'src/api/branch';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { SalesmanLeaderboardListView } from 'src/sections/salesmanLeaderboard/view';
import { CountrySalesLeaderboardListView } from 'src/sections/countrySalesLeaderboard/view';
import EcommerceYearlySales from '../ecommerce-yearly-sales';
import EcommerceBestSalesman from '../ecommerce-best-salesman';
import EcommerceSaleByGender from '../ecommerce-sale-by-gender';
import EcommerceWidgetSummary from '../ecommerce-widget-summary';
import EcommerceYearlyConductions from '../ecommerce-yearly-conductions';
import EcommerceTargetForecasting from '../ecommerce-target-forecasting';
import EcommerceFiltersForm from '../ecommerce-filters-form';
import EcommerceMemberStatistics from '../ecommerce-member-statistics';
import AnalyticsWidgetSummary from '../analytics-widget-summary';
import EcommercePtsVsMembership from '../ecommerce-pts-vs-membership';

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
  const { conductionDashboardCounts, refreshDashboardConductionSummary } =
    useGetDashboradConductionSummary(queryString);
  const { dashboradChartData = {}, refreshDashboradChartData } =
    useGetDashboradChartData(queryString);
  const { dashboradConductionsData = {}, refreshDashboradConductionsData } =
    useGetDashboradConductionsData(queryString);
  const { dashboradMaleToFemaleRatioData = {}, refreshDashboradMaleToFemaleRatio } =
    useGetDashboradMaleToFemaleRatio(queryString);
  const { dashboradPtsVsMembershipRatioData = {}, refreshDashboradPtsVsMembershipRatio } =
    useGetDashboradPtsVsMembershipRatio(queryString);
  console.log(dashboradPtsVsMembershipRatioData);
  const { dashboardMemberStatistics = {}, refreshDashboradMemberStatistics } =
    useGetDashboradMemberStatistics(queryString);

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
    refreshDashboradMaleToFemaleRatio(updatedQueryString);
    refreshDashboradConductionsData(updatedQueryString);
    refreshDashboradMemberStatistics(updatedQueryString);
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

            <Grid xs={12} sm={6} md={3}>
              <AnalyticsWidgetSummary
                title="Total Conductions"
                total={conductionDashboardCounts?.totalConductions || 0}
                color="info"
                icon={<img alt="icon" src="/assets/icons/glass/ic_glass_bag.png" />}
              />
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <AnalyticsWidgetSummary
                title="Avg conduction/Day "
                total={conductionDashboardCounts?.avgConductionsPerDay || 0}
                icon={<img alt="icon" src="/assets/icons/glass/ic_glass_users.png" />}
              />
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <AnalyticsWidgetSummary
                title="Avg Codncution/Trainer"
                total={conductionDashboardCounts?.avgConductionsPerTrainer || 0}
                color="warning"
                icon={<img alt="icon" src="/assets/icons/glass/ic_glass_buy.png" />}
              />
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <AnalyticsWidgetSummary
                title="Avg Revenue/Trainer"
                total={dashboardCounts?.avgRevenuePerTrainer || 0}
                color="warning"
                icon={<img alt="icon" src="/assets/icons/glass/ic_glass_message.png" />}
              />
            </Grid>

            <Grid xs={12} md={12} lg={12}>
              <EcommerceYearlySales
                title="Daily KPI Sales"
                subheader="Tracks daily PT & Membership client additions over time"
                chart={[]}
                dashboradChartData={dashboradChartData}
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
            <Grid xs={12} md={6} lg={4}>
              <EcommercePtsVsMembership
                title="PTS Vs Membership"
                dashboradPtsVsMembershipRatioData={dashboradPtsVsMembershipRatioData}
              />
            </Grid>
            <Grid xs={12} md={6} lg={6}>
              <CountrySalesLeaderboardListView filter={queryString} />
            </Grid>

            <Grid xs={12} md={12} lg={6}>
              <EcommerceTargetForecasting title="12-Month Sales Performance" />
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

            {/* <Grid xs={12} md={6} lg={8}>
              <EcommerceSalesOverview title="Sales Overview" data={_ecommerceSalesOverview} />
            </Grid> */}

            <Grid xs={12} md={12} lg={12}>
              <SalesmanLeaderboardListView filter={queryString} branches={branches} />
            </Grid>
          </Grid>
        </>
      ) : null}
    </Container>
  );
}
