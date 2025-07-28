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
import { useState } from 'react';

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

export default function EcommerceSaleByGender({ title, subheader, ...other }) {
  const theme = useTheme();

  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [selectedKpis, setSelectedKpis] = useState([]);

  // Build query string
  const queryParams = new URLSearchParams();
  if (selectedKpis.length) queryParams.append('kpiIds', selectedKpis.join(','));
  if (startDate) queryParams.append('startDate', format(startDate, 'yyyy-MM-dd'));
  if (endDate) queryParams.append('endDate', format(endDate, 'yyyy-MM-dd'));
  const kpiQueryString = queryParams.toString();

  // Fetch chart data from API
  const { dashboradMaleToFemaleRatioData = {} } = useGetDashboradMaleToFemaleRatio(kpiQueryString);
  const {
    maleCount = 0,
    femaleCount = 0,
    maleRatio = 0,
    femaleRatio = 0,
    totalUniqueClients = 0,
  } = dashboradMaleToFemaleRatioData;

  // Build chart data dynamically
  const chartData = {
    colors: [
      [theme.palette.primary.light, theme.palette.primary.main],
      [theme.palette.warning.light, theme.palette.warning.main],
    ],
    series: [
      { label: 'Male', value: parseFloat(maleRatio) },
      { label: 'Female', value: parseFloat(femaleRatio) },
    ],
  };

  const chartSeries = chartData.series.map((item) => item.value);

  const chartOptions = useChart({
    colors: chartData.colors.map((colr) => colr[1]),
    chart: {
      sparkline: {
        enabled: true,
      },
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
            formatter: () => {
              console.log(fNumber(totalUniqueClients));
              return fNumber(totalUniqueClients);
            },
          },
        },
      },
    },
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 5 }} />

      <StyledChart
        dir="ltr"
        type="radialBar"
        series={chartSeries}
        options={chartOptions}
        height={300}
      />
    </Card>
  );
}

EcommerceSaleByGender.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  title: PropTypes.string,
  total: PropTypes.number,
};
