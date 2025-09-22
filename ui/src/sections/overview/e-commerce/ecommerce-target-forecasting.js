/* eslint-disable no-unsafe-optional-chaining */
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import {
  MenuItem,
  Box,
  Stack,
  Chip,
  TextField,
  CardHeader,
  Card,
  Checkbox,
  FormControl,
  Grid,
  InputLabel,
  OutlinedInput,
  Select,
  useMediaQuery,
  useTheme,
  Typography,
  alpha,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import Chart, { useChart } from 'src/components/chart';
import { useGetDashboradChartData, useGetDashboradForecastingData } from 'src/api/user';
import Iconify from 'src/components/iconify';

export default function EcommerceTargetForecasting({
  title,
  subheader,
  kpiOptions,
  onFilterChange,
  ...other
}) {
  const [interval, setInterval] = useState('monthly');
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [selectedKpis, setSelectedKpis] = useState([]);

  // Build query string
  const kpiQueryString = `interval=${interval}`;

  // Fetch chart data from API
  const { dashboradChartData = {} } = useGetDashboradForecastingData(kpiQueryString);
  const {
    targetSeries = [],
    actualSeries = [],
    deficitPercentSeries = [],
    labels = [],
    forecast = {},
  } = dashboradChartData;
  const percent = forecast?.variancePercent ?? 0;
  const dataSeries = [
    { name: 'Target', data: targetSeries },
    { name: 'Actual', data: actualSeries },
  ];

  const chartOptions = useChart({
    chart: {
      id: 'target-forecast-chart',
      type: 'area',
      toolbar: { show: false },
    },
    xaxis: {
      categories: labels,
      labels: {
        rotate: -45,
        trim: true,
        hideOverlappingLabels: true,
      },
      tickPlacement: 'on',
    },
    tooltip: {
      enabled: true,
      shared: true,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const target = series[0][dataPointIndex];
        const actual = series[1][dataPointIndex];
        const deficit = deficitPercentSeries[dataPointIndex]; // from your state/API

        return `
      <div style="padding:8px">
        <div><b>${labels[dataPointIndex]}</b></div>
        <div>Target: AED ${target.toLocaleString()}</div>
        <div>Actual: AED ${actual.toLocaleString()}</div>
        <div style="color:${deficit < 0 ? 'red' : 'green'}">
          Deficit: ${deficit.toFixed(1)}%
        </div>
      </div>
    `;
      },
    },

    stroke: {
      curve: 'smooth',
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '14px',
      markers: {
        width: 12,
        height: 12,
      },
    },
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleKpiChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedKpis(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <>
      {/*
      Uncomment once ai integration is done
      
      <Card
        sx={{
          mt: 2,
          mb: 3,
          borderLeft: '4px solid',
          borderColor: percent < 0 ? 'error.main' : 'success.main',
          backgroundColor: percent < 0 ? '#fff5f5' : '#f0fcf5',
          borderRadius: 0,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'}
              sx={{
                p: 0.5,
                width: 24,
                height: 24,
                borderRadius: '50%',
                color: percent < 0 ? 'error.main' : 'success.main',
                bgcolor: alpha(theme.palette[percent < 0 ? 'error' : 'success'].main, 0.16),
              }}
            />

            <Box>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                color={percent < 0 ? 'error.main' : 'success.main'}
              >
                {forecast?.status}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {forecast?.message}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Card> */}
      <Card {...other}>
        <CardHeader title={title} subheader={subheader} />
        {/* {isMobile && <Box sx={{ mt: 2, px: 3, pb: 2 }}>{FilterFields}</Box>} */}
        <Box sx={{ mt: 3, mx: 3, overflowX: 'auto' }}>
          <Box sx={{ minWidth: Math.max(dataSeries[0]?.data.length * 80, 600) }}>
            <Chart dir="ltr" type="area" series={dataSeries} options={chartOptions} height={364} />
          </Box>
        </Box>
      </Card>
    </>
  );
}

EcommerceTargetForecasting.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  kpiOptions: PropTypes.array,
  onFilterChange: PropTypes.func,
};
