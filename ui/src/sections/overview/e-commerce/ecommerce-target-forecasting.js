/* eslint-disable no-unsafe-optional-chaining */
import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
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
  const scrollRef = useRef(null);

  const kpiQueryString = `interval=${interval}`;
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
    chart: { id: 'target-forecast-chart', type: 'area', toolbar: { show: false } },
    xaxis: {
      categories: labels,
      labels: { rotate: -45, trim: true, hideOverlappingLabels: true },
      tickPlacement: 'on',
    },
    tooltip: {
      enabled: true,
      shared: true,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const target = series[0][dataPointIndex];
        const actual = series[1][dataPointIndex];
        const deficit = deficitPercentSeries[dataPointIndex];

        return `
          <div style="padding:8px">
            <div><b>${labels[dataPointIndex]}</b></div>
            <div>Target: AED ${target?.toLocaleString?.() ?? 0}</div>
            <div>Actual: AED ${actual?.toLocaleString?.() ?? 0}</div>
            <div style="color:${deficit < 0 ? 'red' : 'green'}">
              Deficit: ${deficit?.toFixed?.(1) ?? 0}%
            </div>
          </div>
        `;
      },
    },
    stroke: { curve: 'smooth' },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.1 } },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '14px',
      markers: { width: 12, height: 12 },
    },
  });

  // 👇 Scroll to current month after chart data loads
  useEffect(() => {
    if (labels.length && scrollRef.current) {
      const currentMonth = format(new Date(), 'MMM yyyy'); // e.g., "Oct 2025"
      const index = labels.findIndex((lbl) => lbl === currentMonth);

      if (index >= 0) {
        const scrollAmount = index * 80; // since each category ~80px
        scrollRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  }, [labels]);

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      <Box ref={scrollRef} sx={{ mt: 3, mx: 3, overflowX: 'auto' }}>
        <Box sx={{ minWidth: Math.max(dataSeries[0]?.data.length * 80, 600) }}>
          <Chart dir="ltr" type="area" series={dataSeries} options={chartOptions} height={364} />
        </Box>
      </Box>
    </Card>
  );
}

EcommerceTargetForecasting.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  kpiOptions: PropTypes.array,
  onFilterChange: PropTypes.func,
};
