import PropTypes from 'prop-types';
// @mui
import { styled, useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';
// utils
import { fNumber } from 'src/utils/format-number';
// components
import Chart, { useChart } from 'src/components/chart';
import { useGetDashboradMaleToFemaleRatio } from 'src/api/user';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Box, Divider } from '@mui/material';

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

export default function EcommercePtsVsMembership({
  title,
  subheader,
  dashboradPtsVsMembershipRatioData,
  ...other
}) {
  const theme = useTheme();

  // Extract API data
  const { membership, pt, ratio } = dashboradPtsVsMembershipRatioData;
  const totalUniqueClients = (membership?.total ?? 0) + (pt?.total ?? 0);

  // Chart data
  const chartData = useMemo(
    () => ({
      colors: [
        [theme.palette.primary.light, theme.palette.primary.main], // PTS
        [theme.palette.warning.light, theme.palette.warning.main], // Membership
      ],
      series: [
        { label: 'PTS', value: pt?.total ?? 0, male: pt?.male ?? 0, female: pt?.female ?? 0 },
        {
          label: 'Membership',
          value: membership?.total ?? 0,
          male: membership?.male ?? 0,
          female: membership?.female ?? 0,
        },
      ],
    }),
    [theme, membership, pt]
  );

  const chartSeries = chartData.series.map((item) => item.value);

  const chartConfig = useMemo(
    () => ({
      colors: chartData.colors.map((colr) => colr[1]),
      chart: {
        sparkline: { enabled: true },
      },
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
                return fNumber(totalUniqueClients); // read latest state value
              },
            },
          },
        },
      },
      tooltip: {
        enabled: true,
        custom({ series, seriesIndex, w }) {
          const label = w.globals.labels[seriesIndex];
          const value = series[seriesIndex];
          let male = 0;
          let female = 0;

          if (seriesIndex === 0) {
            male = pt?.male ?? 0;
            female = pt?.female ?? 0;
          } else if (seriesIndex === 1) {
            male = membership?.male ?? 0;
            female = membership?.female ?? 0;
          }

          return `
      <div style="padding:6px 10px;">
        <div style="display:flex;align-items:center;margin-bottom:4px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${w.globals.colors[seriesIndex]};margin-right:6px;"></span>
          <span style="font-weight:500;">${label}: ${value}</span>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:2px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4e79a7;margin-right:6px;"></span>
          Male: ${male}
        </div>
        <div style="display:flex;align-items:center;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f28e2c;margin-right:6px;"></span>
          Female: ${female}
        </div>
      </div>
    `;
        },
      },
    }),
    [
      chartData.colors,
      chartData.series,
      membership?.female,
      membership?.male,
      pt?.female,
      pt?.male,
      totalUniqueClients,
    ]
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
        key={totalUniqueClients}
      />

      <Divider />

      <Box sx={{ textAlign: 'center', py: 1, color: 'text.secondary' }}>
        PTS : membership = {ratio}
      </Box>
    </Card>
  );
}

EcommercePtsVsMembership.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  title: PropTypes.string,
  total: PropTypes.number,
  dashboradPtsVsMembershipRatioData: PropTypes.object,
};
