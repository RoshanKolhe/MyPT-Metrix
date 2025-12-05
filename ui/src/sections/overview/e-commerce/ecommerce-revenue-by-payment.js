import PropTypes from 'prop-types';
// @mui
import { useTheme, styled } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';
// utils
import { fNumber } from 'src/utils/format-number';
// components
import Chart, { useChart } from 'src/components/chart';
import { Box, Grid, Stack, Typography } from '@mui/material';

// ----------------------------------------------------------------------

const CHART_HEIGHT = 400;

const LEGEND_HEIGHT = 72;

const StyledChart = styled(Chart)(({ theme }) => ({
  height: CHART_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',

  '& .apexcharts-canvas, .apexcharts-inner, svg, foreignObject': {
    height: '100% !important',
  },

  // Remove unwanted dashed line and forced legend positioning
  '& .apexcharts-legend': {
    display: 'none !important',
  },
}));

// ----------------------------------------------------------------------

export default function EcommerceRevenueByPayment({ title, subheader, chart, ...other }) {
  const theme = useTheme();

  const { colors, series, options } = chart;

  const chartSeries = series.map((i) => i.value);

  const chartOptions = useChart({
    chart: {
      sparkline: {
        enabled: true,
      },
    },
    colors,
    labels: series.map((i) => i.label),
    stroke: { colors: [theme.palette.background.paper] },
    legend: {
      show: false,
    },

    tooltip: {
      fillSeriesColor: false,
      y: {
        formatter: (value) => fNumber(value),
        title: {
          formatter: (seriesName) => `${seriesName}`,
        },
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '85%', // bigger circle
          width: 100, // 👈 THICKER RING
          labels: {
            show: true,
            value: { formatter: (value) => fNumber(value) },
            total: {
              formatter: (w) => {
                const sum = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                return fNumber(sum);
              },
            },
          },
        },
      },
    },

    ...options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <Grid container spacing={2} sx={{ px: 2 }}>
        {/* LEFT — Chart */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StyledChart dir="ltr" type="donut" series={chartSeries} options={chartOptions} />
          </Box>
        </Grid>

        {/* RIGHT — Legend */}
        <Grid item xs={12} md={6} sx={{ pr: 2 }}>
          {series.map((item, idx) => (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2.5,
              }}
            >
              {/* Left: dot + label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: colors[idx],
                  }}
                />
                <Stack>
                  <Typography variant="subtitle2">{item.label}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.56 }}>
                    {item.transactionCount} transactions
                  </Typography>
                </Stack>
              </Box>

              {/* Right: stats */}
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2">{item.percentage}%</Typography>
                <Typography variant="body2" sx={{ opacity: 0.56 }}>
                  AED {item.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Card>
  );
}

EcommerceRevenueByPayment.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  title: PropTypes.string,
};
