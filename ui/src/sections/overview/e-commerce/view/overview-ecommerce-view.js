// @mui
import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
// components
import { useSettingsContext } from 'src/components/settings';
//
import {
  useGetDashboradChartData,
  useGetDashboradConductionsData,
  useGetDashboradConductionSummary,
  useGetDashboradMaleToFemaleRatio,
  useGetDashboradMemberStatistics,
  useGetDashboradMonthlyData,
  useGetDashboradPtsVsMembershipRatio,
  useGetDashboradSummary,
  useGetDashobardKpiSummary,
  useGetDashobardRevenueByPaymentMode,
  useGetPtConductionsRank,
  useGetPtRanks,
  useGetPtSalesRank,
  useGetBranchWiseAnalytics,
} from 'src/api/dashboard';
import { fShortenNumber } from 'src/utils/format-number';
import { Box, CircularProgress, LinearProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { useGetBranchsWithFilter } from 'src/api/branch';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { SalesmanLeaderboardListView } from 'src/sections/salesmanLeaderboard/view';
import { CountrySalesLeaderboardListView } from 'src/sections/countrySalesLeaderboard/view';
import EcommerceYearlySales from '../ecommerce-yearly-sales';
import EcommerceSaleByGender from '../ecommerce-sale-by-gender';
import EcommerceWidgetSummary from '../ecommerce-widget-summary';
import EcommerceYearlyConductions from '../ecommerce-yearly-conductions';
import EcommerceTargetForecasting from '../ecommerce-target-forecasting';
import EcommerceFiltersForm from '../ecommerce-filters-form';
import EcommerceMemberStatistics from '../ecommerce-member-statistics';
import AnalyticsWidgetSummary from '../analytics-widget-summary';
import EcommercePtsVsMembership from '../ecommerce-pts-vs-membership';
import EcommerceMonthlySales from '../ecommerce-month-wise-sales';
import { TrainerPerformanceView } from '../../trainer-performance/view';
import EcommerceRevenueByPayment from '../ecommerce-revenue-by-payment';
import EcommerceCategoryBreakdown from '../ecommerce-category-breakdown';
import BranchWiseAnalytics from '../branch-wise-analytics';

// ----------------------------------------------------------------------

export default function OverviewEcommerceView() {
  const { user } = useAuthContext();
  const isSuperOrAdmin =
    user?.permissions?.includes('super_admin') || user?.permissions?.includes('admin');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [filters, setFilters] = useState({
    branch: null,
    department: null,
    kpis: [],
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    country: null,
    day: yesterday.getDate(),
  });

  const [showFilters, setShowFilters] = useState(false);
  const [shouldLoadData, setShouldLoadData] = useState(false);

  // Defer API calls until component is mounted
  useEffect(() => {
    // Small delay to ensure page renders first
    const timer = setTimeout(() => {
      setShouldLoadData(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const queryString = [
    filters.kpis?.length ? `kpiIds=${filters.kpis.map((k) => k.id).join(',')}` : '',
    filters.branch?.id ? `branchId=${filters.branch.id}` : '',
    filters.department?.id ? `departmentId=${filters.department.id}` : '',
    filters.startDate ? `startDate=${format(new Date(filters.startDate), 'yyyy-MM-dd')}` : '',
    filters.endDate ? `endDate=${format(new Date(filters.endDate), 'yyyy-MM-dd')}` : '',
    filters.country ? `country=${filters.country}` : '',
  ]
    .filter(Boolean)
    .join('&');

  // Branch wise analytics only needs startDate and endDate
  const branchAnalyticsQueryString = [
    filters.startDate ? `startDate=${format(new Date(filters.startDate), 'yyyy-MM-dd')}` : '',
    filters.endDate ? `endDate=${format(new Date(filters.endDate), 'yyyy-MM-dd')}` : '',
  ]
    .filter(Boolean)
    .join('&');

  // Conditionally call hooks - only when shouldLoadData is true
  const { dashboardCounts, refreshDashboardSummary } = useGetDashboradSummary(
    shouldLoadData ? queryString : null
  );
  const { conductionDashboardCounts, refreshDashboardConductionSummary } =
    useGetDashboradConductionSummary(shouldLoadData ? queryString : null);
  const {
    dashboradChartData = {},
    refreshDashboradChartData,
    isLoadingDashboradChartData,
  } = useGetDashboradChartData(shouldLoadData ? queryString : null);
  const {
    dashboradMonthlyData = {},
    refreshDashboradMonthlyData,
    isLoadingDashboradMonthlyData,
  } = useGetDashboradMonthlyData(shouldLoadData ? `${queryString}&day=${filters.day}` : null);
  const {
    dashboradConductionsData = {},
    refreshDashboradConductionsData,
    isLoadingConductionsData,
  } = useGetDashboradConductionsData(shouldLoadData ? queryString : null);
  const { dashboradMaleToFemaleRatioData = {}, refreshDashboradMaleToFemaleRatio } =
    useGetDashboradMaleToFemaleRatio(shouldLoadData ? queryString : null);
  const { dashboradPtsVsMembershipRatioData = {}, refreshDashboradPtsVsMembershipRatio } =
    useGetDashboradPtsVsMembershipRatio(shouldLoadData ? queryString : null);
  const { dashboardMemberStatistics = {}, refreshDashboradMemberStatistics } =
    useGetDashboradMemberStatistics(shouldLoadData ? queryString : null);
  const { dashboardPtSalesRank, isLoading } = useGetPtSalesRank(
    shouldLoadData ? queryString : null
  );
  const { dashboardPtConductionsRank } = useGetPtConductionsRank(
    shouldLoadData ? queryString : null
  );
  const { dashboardPtRanks } = useGetPtRanks(shouldLoadData ? queryString : null);
  const { dashboardRevenueByPaymentMode } = useGetDashobardRevenueByPaymentMode(
    shouldLoadData ? queryString : null
  );
  const { dashboardKpisummary } = useGetDashobardKpiSummary(shouldLoadData ? queryString : null);
  console.log('dashboardKpisummary', dashboardKpisummary);

  const {
    branchWiseAnalytics,
    isLoadingBranchWiseAnalytics,
    refreshBranchWiseAnalytics,
  } = useGetBranchWiseAnalytics(shouldLoadData ? branchAnalyticsQueryString : null);

  const rawFilter = {
    where: {
      isActive: true,
    },
  };

  const encodedFilter = `filter=${encodeURIComponent(JSON.stringify(rawFilter))}`;

  const { filteredbranches: branches, filteredbranchesLoading } = useGetBranchsWithFilter(
    shouldLoadData ? encodedFilter : null
  );

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
    refreshDashboradMonthlyData(updatedQueryString);
    refreshDashboradMaleToFemaleRatio(updatedQueryString);
    refreshDashboradConductionsData(updatedQueryString);
    refreshDashboradMemberStatistics(updatedQueryString);
  };

  // Show initial loading state
  if (!shouldLoadData) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'xl'}>
        <Box
          sx={{
            px: 5,
            width: 1,
            flexGrow: 1,
            // minHeight: 1,
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress color="inherit" sx={{ width: 1, maxWidth: 360 }} />
        </Box>
      </Container>
    );
  }
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

            <Grid xs={12}>
              <BranchWiseAnalytics
                branches={branchWiseAnalytics}
                isLoading={isLoadingBranchWiseAnalytics}
              />
            </Grid>

            {/* <Grid xs={12} md={12} lg={12}>
              {isLoadingDashboradMonthlyData ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={364}>
                  <CircularProgress />
                </Box>
              ) : (
                <EcommerceMonthlySales
                  title="Revenue (Month-on-Month, Last 13 Months)"
                  dashboradChartData={dashboradMonthlyData}
                  filters={filters}
                  setFilters={setFilters}
                  refreshDashboradMonthlyData={refreshDashboradMonthlyData}
                />
              )}
            </Grid> */}

            {/* <Grid xs={12} md={12} lg={12}>
              {isLoadingDashboradChartData ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={364}>
                  <CircularProgress />
                </Box>
              ) : (
                <EcommerceYearlySales
                  title="Daily KPI Sales"
                  subheader="Tracks daily PT & Membership client additions over time"
                  chart={[]}
                  dashboradChartData={dashboradChartData}
                />
              )}
            </Grid> */}

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
              <EcommerceRevenueByPayment
                title="Revenue by Payment Mode"
                subheader="Payment method breakdown and digital adoption"
                chart={{
                  series: dashboardRevenueByPaymentMode.summary || [],
                  colors: [
                    '#4B89FF', // viya_app
                    '#FF8F6B', // mypt
                    '#6BD66B', // cash
                    '#29C3D2', // pos
                    '#8BE4D4', // bank
                    '#FFB86B', // link
                    '#A48CFF', // tabby
                    '#F4C363', // tamara
                    '#9D6BFF', // cheque
                    '#FF6BCB', // atm
                  ],
                }}
              />
            </Grid>
            <Grid xs={12} md={6} lg={6}>
              <EcommerceCategoryBreakdown
                title="Category Breakdown"
                subheader="Revenue distribution by sales type"
                chart={{
                  series: dashboardKpisummary.summary || [],
                }}
              />
            </Grid>

            <Grid xs={12} md={6} lg={6}>
              <CountrySalesLeaderboardListView filter={queryString} />
            </Grid>

            <Grid xs={12} md={12} lg={6}>
              {filteredbranchesLoading ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={364}>
                  <CircularProgress />
                </Box>
              ) : (
                <EcommerceTargetForecasting
                  title="12-Month Sales Performance"
                  branch={filters.branch}
                />
              )}
            </Grid>

            {/* <Grid xs={12} md={12} lg={12}>
              {isLoadingConductionsData ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={364}>
                  <CircularProgress />
                </Box>
              ) : (
                <EcommerceYearlyConductions
                  title="Daily Conductions"
                  subheader="Tracks daily conductions over time"
                  chart={[]}
                  filterValues={filters}
                  dashboradConductionsData={dashboradConductionsData}
                />
              )}
            </Grid> */}

            {/* <Grid xs={12} md={6} lg={8}>
              <EcommerceSalesOverview title="Sales Overview" data={_ecommerceSalesOverview} />
            </Grid> */}

            {/* <Grid xs={12} md={12} lg={12}>
              <SalesmanLeaderboardListView filter={queryString} branches={branches} />
            </Grid> */}
            <Grid xs={12} md={12} lg={12}>
              <TrainerPerformanceView
                filters={filters}
                dashboardPtSalesRank={dashboardPtSalesRank}
                dashboardPtConductionsRank={dashboardPtConductionsRank}
                dashboardPtRanks={dashboardPtRanks}
              />
            </Grid>
          </Grid>
        </>
      ) : null}
    </Container>
  );
}
