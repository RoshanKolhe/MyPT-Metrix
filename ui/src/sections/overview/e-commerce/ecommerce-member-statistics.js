import PropTypes from 'prop-types';
// @mui
import { styled, useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';
// utils
import { fNumber } from 'src/utils/format-number';
// components
import Chart, { useChart } from 'src/components/chart';
import { useGetDashboradMemberStatistics } from 'src/api/user';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useMemo, useState } from 'react';

// ----------------------------------------------------------------------

const CHART_HEIGHT = 400;

const LEGEND_HEIGHT = 72;

const StyledChart = styled(Chart)(({ theme }) => ({
  height: CHART_HEIGHT,
  '& .apexcharts-canvas, .apexcharts-inner, svg, foreignObject': {
    height: `100% !important`,
  },
  '& .apexcharts-legend': {
    height: LEGEND_HEIGHT,
    borderTop: `dashed 1px ${theme.palette.divider}`,
    top: `calc(${CHART_HEIGHT - LEGEND_HEIGHT}px) !important`,
  },
}));

// ----------------------------------------------------------------------

export default function EcommerceMemberStatistics({
  title,
  subheader,
  dashboardMemberStatistics,
  ...other
}) {
  const theme = useTheme();
  const {
    newMemberPercent,
    renewedMemberPercent,
    expiredMemberPercent,
    unclassifiedMemberCount,
    totalMemberCount,
  } = dashboardMemberStatistics;

  // Build chart data dynamically
  const chartData = useMemo(
    () => ({
      colors: [
        [theme.palette.primary.light, theme.palette.primary.main],
        [theme.palette.warning.light, theme.palette.warning.main],
        [theme.palette.warning.light, theme.palette.secondary.main],
      ],
      series: [
        { label: 'New Members', value: parseFloat(newMemberPercent) },
        { label: 'Renewed Members', value: parseFloat(renewedMemberPercent) },
        { label: 'Expired Members', value: parseFloat(expiredMemberPercent) },
      ],
    }),
    [newMemberPercent, renewedMemberPercent, expiredMemberPercent, theme]
  );

  const chartSeries = chartData.series.map((item) => item.value);

  const chartConfig = useMemo(
    () => ({
      colors: chartData.colors.map((colr) => colr[1]),
      chart: { sparkline: { enabled: true } },
      labels: chartData.series.map((item) => item.label),
      legend: {
        floating: true,
        position: 'bottom',
        horizontalAlign: 'center',
      },
      fill: {
        type: 'gradient',
        gradient: {
          colorStops: chartData.colors.map((colr) => [
            { offset: 0, color: colr[0] },
            { offset: 100, color: colr[1] },
          ]),
        },
      },
      plotOptions: {
        radialBar: {
          hollow: { size: '68%' },
          dataLabels: {
            value: { offsetY: 16 },
            total: {
              formatter() {
                return fNumber(totalMemberCount || 0);
              },
            },
          },
        },
      },
    }),
    [chartData, totalMemberCount]
  );

  const chartOptions = useChart(chartConfig);

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 5 }} />

      <StyledChart
        dir="ltr"
        type="radialBar"
        series={chartSeries}
        options={chartOptions}
        height={300}
        key={totalMemberCount}
      />
    </Card>
  );
}

EcommerceMemberStatistics.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  title: PropTypes.string,
  total: PropTypes.number,
  dashboardMemberStatistics: PropTypes.object,
};
