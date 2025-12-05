import PropTypes from 'prop-types';
// @mui
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
// theme
import { bgGradient } from 'src/theme/css';
// utils
import { fNumber } from 'src/utils/format-number';
import { Card, Grid, LinearProgress } from '@mui/material';
// theme

// ----------------------------------------------------------------------

export default function BranchWiseAnalytics({
  title = 'DSO',
  status = 'Behind',
  statusColor = '#FFC107',

  revenueAmount = 22300,
  revenueTarget = 28000,

  ptCount = 54,
  conductionCount = 60,

  topCategory = 'PT Sales',
  contribution = 18.2,
}) {
  const revenuePercent = Math.round((revenueAmount / revenueTarget) * 100);
  const ptPercent = Math.round((ptCount / conductionCount) * 100);

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        width: 280,
      }}
    >
      <Grid container spacing={1}>
        {/* TITLE + STATUS */}
        <Grid item xs={12}>
          <Grid container alignItems="center" justifyContent="space-between" spacing={1}>
            <Grid item>
              <Typography variant="h6">{title}</Typography>
            </Grid>
            <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: statusColor,
                  display: 'inline-block',
                }}
              />
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {status}
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        {/* REVENUE SECTION */}
        <Grid item xs={12}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Revenue
          </Typography>

          <Typography variant="h6">AED {(revenueAmount / 1000).toFixed(1)}K</Typography>

          <LinearProgress
            variant="determinate"
            value={revenuePercent}
            sx={{
              mt: 1,
              height: 6,
              borderRadius: 2,
              bgcolor: '#444',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#4CAF50',
              },
            }}
          />

          <Grid container justifyContent="space-between" sx={{ mt: 0.5 }}>
            <Grid item>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                Target: AED {(revenueTarget / 1000).toFixed(1)}K
              </Typography>
            </Grid>

            <Grid item>
              <Typography variant="caption">{revenuePercent}%</Typography>
            </Grid>
          </Grid>
        </Grid>

        {/* PT SECTION */}
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            PT Conductions
          </Typography>

          <Typography variant="body1">
            {ptCount} / {conductionCount}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={ptPercent}
            sx={{
              mt: 1,
              height: 6,
              borderRadius: 2,
              bgcolor: '#444',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#00BCD4',
              },
            }}
          />

          <Typography variant="caption">{ptPercent}% complete</Typography>
        </Grid>

        {/* BOTTOM SECTION */}
        <Grid item xs={12} sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            Top Category
          </Typography>
          <Typography variant="body2">{topCategory}</Typography>
        </Grid>

        <Grid item xs={12} sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            Contribution
          </Typography>
          <Typography variant="body2">{contribution}%</Typography>
        </Grid>
      </Grid>
    </Card>
  );
}

BranchWiseAnalytics.propTypes = {
  title: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  statusColor: PropTypes.string, // optional, default can be provided

  revenueAmount: PropTypes.number.isRequired,
  revenueTarget: PropTypes.number.isRequired,

  ptCount: PropTypes.number.isRequired,
  conductionCount: PropTypes.number.isRequired,

  topCategory: PropTypes.string.isRequired,
  contribution: PropTypes.number.isRequired,
};
