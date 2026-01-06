import PropTypes from 'prop-types';
// @mui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Card, Grid, LinearProgress, CircularProgress } from '@mui/material';

// ----------------------------------------------------------------------

function BranchWiseAnalyticsCard({
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
  const revenuePercent = revenueTarget > 0 ? Math.round((revenueAmount / revenueTarget) * 100) : 0;
  const ptPercent = conductionCount > 0 ? Math.round((ptCount / conductionCount) * 100) : 0;

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
            value={Math.min(revenuePercent, 100)}
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
            value={Math.min(ptPercent, 100)}
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

BranchWiseAnalyticsCard.propTypes = {
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

// ----------------------------------------------------------------------

export default function BranchWiseAnalytics({ branches = [], isLoading = false }) {
  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!branches || branches.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          No branch data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Branch Wise Analytics
      </Typography>
      <Grid container spacing={2}>
        {branches.map((branch, index) => (
          <Grid item key={branch.title || index}>
            <BranchWiseAnalyticsCard
              title={branch.title}
              status={branch.status}
              statusColor={branch.statusColor}
              revenueAmount={branch.revenueAmount}
              revenueTarget={branch.revenueTarget}
              ptCount={branch.ptCount}
              conductionCount={branch.conductionCount}
              topCategory={branch.topCategory}
              contribution={branch.contribution}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

BranchWiseAnalytics.propTypes = {
  branches: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      statusColor: PropTypes.string,
      revenueAmount: PropTypes.number.isRequired,
      revenueTarget: PropTypes.number.isRequired,
      ptCount: PropTypes.number.isRequired,
      conductionCount: PropTypes.number.isRequired,
      topCategory: PropTypes.string.isRequired,
      contribution: PropTypes.number.isRequired,
    })
  ),
  isLoading: PropTypes.bool,
};
