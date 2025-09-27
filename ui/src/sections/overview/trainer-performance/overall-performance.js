/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
// overall-performance.js

import PropTypes from 'prop-types';
import { Card, CardHeader, Avatar, Box, Typography, Stack, Divider } from '@mui/material';

// Helper to color percentages
const getPerformanceColor = (value) => {
  if (value >= 110) return 'success.main'; // green
  if (value >= 100) return 'primary.main'; // blue/green
  if (value >= 95) return 'warning.main'; // orange
  return 'error.main'; // red
};

export default function OverallPerformance({ title, data }) {
  const topThree = data.slice(0, 3);
  const rest = data.slice(3);

  const podiumOrder = [topThree[1], topThree[0], topThree[2]];

  return (
    <Card sx={{ height: '535px' }}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 8 }}>
            {title}
          </Typography>
        }
      />

      <Stack
        direction="row"
        justifyContent="center"
        alignItems="flex-end"
        spacing={4}
        sx={{ mb: 3, mt: 1 }}
      >
        {podiumOrder.map((item, index) => {
          let transformStyle = '';
          let avatarSize = 72;
          let zIndex = 1;
          let rankNumber = 0;
          let borderColor = '';
          let badgeColor = '';

          if (index === 0) {
            transformStyle = 'rotateY(20deg) translateY(10px)';
            zIndex = 2;
            avatarSize = 72;
            rankNumber = 2;
            borderColor = '#FFB86A';
            badgeColor = '#FFB86A';
          } else if (index === 1) {
            transformStyle = 'scale(1.3) translateY(-10px)';
            zIndex = 3;
            avatarSize = 88;
            rankNumber = 1;
            borderColor = '#FDC700';
            badgeColor = '#FDC700';
          } else if (index === 2) {
            transformStyle = 'rotateY(-20deg) translateY(10px)';
            zIndex = 2;
            avatarSize = 72;
            rankNumber = 3;
            borderColor = '#D1D5DC';
            badgeColor = '#D1D5DC';
          }

          return (
            <Box key={item.id} textAlign="center" sx={{ transform: transformStyle, zIndex }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                {/* Avatar */}
                <Avatar
                  src={item.avatar}
                  alt={item.name}
                  sx={{
                    width: { md: 80, xs: 50 },
                    height: { md: 80, xs: 50 },
                    border: `3px solid ${
                      rankNumber === 1 ? '#FDC700' : rankNumber === 2 ? '#D1D5DC' : '#FFB86A'
                    }`,
                  }}
                />

                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor:
                      // eslint-disable-next-line no-nested-ternary
                      index === 0 ? '#6A7282' : index === 1 ? '#F0B100' : '#FF6900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#fff',
                  }}
                >
                  {rankNumber}
                </Box>
              </Box>

              <Typography
                variant="subtitle2"
                mt={1}
                sx={{
                  fontSize: { xs: '12px', sm: '14px' },
                }}
              >
                {item.name}
              </Typography>

              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color={getPerformanceColor(item.value)}
                sx={{
                  fontSize: { xs: '12px', sm: '14px' },
                }}
              >
                {item.value}%
              </Typography>
            </Box>
          );
        })}
      </Stack>

      <Divider />

      {/* Remaining ranks */}
      <Box sx={{ p: 2 }}>
        {rest.map((item, index) => (
          <Stack
            key={item.id}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              {index + 4}. {item.name}
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={getPerformanceColor(item.value)}>
              {item.value}%
            </Typography>
          </Stack>
        ))}
      </Box>
    </Card>
  );
}

OverallPerformance.propTypes = {
  title: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      avatar: PropTypes.string,
      value: PropTypes.number,
    })
  ),
};
