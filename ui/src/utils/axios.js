import axios from 'axios';
// config
import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: HOST_API });

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/me',
    login: '/login',
    register: '/register',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
  user: {
    list: '/users/list',
    filterList: (filter) => `/users/list?${filter}`,
    filterNotificationList: (filter) => `/notifications?${filter}`,
    details: (id) => `/users/${id}`,
  },
  dashboard: {
    getFilteredDashboradSummary: (filter) => `/dashboard/summary?${filter}`,
    getFilteredChartData: (filter) => `/clients/chart-data?${filter}`,
    getFilteredMonthlyData: (filter) => `/dashboard/monthly-revenue?${filter}`,
    getMonthlyData: (filter) => `/dashboard/monthly-revenue`,
    getChartData: (filter) => `/clients/chart-data?${filter}`,
    getFilteredConductionsData: (filter) => `/conductions/chart-data?${filter}`,
    getConductionsData: (filter) => `/conductions/chart-data?${filter}`,
    getForecastingData: (filter) => `dashboard/forecast/monthly-series`,
    getForecastingDataWithFilter: (filter) => `dashboard/forecast/monthly-series?${filter}`,
    getMaleToFemaleRatio: (filter) => `gender-ratio?${filter}`,
    getPtsVsMembershipRatio: (filter) => `client-stats?${filter}`,
    getMemberStatistics: (filter) => `member-statistics?${filter}`,
    getDashboradSummary: `/dashboard/summary`,
    getFilterPtSales: (filter) => `/leaderboard/top-sales?${filter}`,
    getPtSales: (filter) => `/leaderboard/top-sales`,
    getFilterPtConductions: (filter) => `/leaderboard/top-conductions?${filter}`,
    getPtConductions: (filter) => `/leaderboard/top-conductions`,
    getFilterPtRanks: (filter) => `/leaderboard/top-ranks?${filter}`,
    getPtRanks: (filter) => `/leaderboard/top-conductions`,
    getFilteredConductionDashboradSummary: (filter) => `/member-conduction-stats?${filter}`,
    getConductionDashboradSummary: `/member-conduction-stats'`,
    getRevenueByPaymentMode: (filter) => `/payments/summary?${filter}`,
    getKpiSummary: (filter) => `/sales/kpi-summary?${filter}`,
    getBranchWiseAnalytics: (filter) => `/dashboard/branch-wise-analytics?${filter}`,
  },
  staff: {
    list: '/trainers',
    filterList: (filter) => `/trainers?${filter}`,
    details: (id) => `/trainers/${id}`,
  },
  sale: {
    list: '/sales',
    filterList: (filter) => `/sales?${filter}`,
    details: (id) => `/sales/${id}`,
  },
  conduction: {
    list: '/conductions',
    filterList: (filter) => `/conductions?${filter}`,
    details: (id) => `/conductions/${id}`,
  },
  target: {
    list: '/targets',
    filterList: (filter) => `/targets?${filter}`,
    details: (id) => `/targets/${id}`,
    depTarget: (targetId, deptId) => `/department-targets/${deptId}/${targetId}`,
  },
  department: {
    list: '/departments',
    filterList: (filter) => `/departments?${filter}`,
    details: (id) => `/departments/${id}`,
  },
  salesmanLeaderboard: {
    filterList: (filter) => `/leaderboard/trainer-performance?${filter}`,
  },
  countrySalesLeaderboard: {
    filterList: (filter) => `/sales-by-country?${filter}`,
  },
  kpi: {
    list: '/kpis',
    filterList: (filter) => `/kpis?${filter}`,
    details: (id) => `/kpis/${id}`,
  },
  branch: {
    list: '/branches',
    filterList: (filter) => `/branches?${filter}`,
    details: (id) => `/branches/${id}`,
  },
};
