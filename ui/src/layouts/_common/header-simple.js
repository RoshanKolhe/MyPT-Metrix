// @mui
import { useTheme } from '@mui/material/styles';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { Box, Button, Popover, Typography } from '@mui/material';

// theme
import { bgBlur } from 'src/theme/css';
// routes
import { paths } from 'src/routes/paths';
// hooks
import { useOffSetTop } from 'src/hooks/use-off-set-top';
// components
import Logo from 'src/components/logo';
import { RouterLink } from 'src/routes/components';
//
import { useState } from 'react';
import { HEADER } from '../config-layout';
import HeaderShadow from './header-shadow';
import SettingsButton from './settings-button';

// ----------------------------------------------------------------------

export default function HeaderSimple() {
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'help-popup' : undefined;

  const offsetTop = useOffSetTop(HEADER.H_DESKTOP);

  return (
    <AppBar>
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          height: {
            xs: HEADER.H_MOBILE,
            md: HEADER.H_DESKTOP,
          },
          transition: theme.transitions.create(['height'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.shorter,
          }),
          ...(offsetTop && {
            ...bgBlur({
              color: theme.palette.background.default,
            }),
            height: {
              md: HEADER.H_DESKTOP_OFFSET,
            },
          }),
        }}
      >
        <Logo />

        <Stack direction="row" alignItems="center" spacing={1}>
          <SettingsButton />

          <Link
            href="#"
            onClick={handleOpen}
            component={RouterLink}
            color="inherit"
            sx={{ typography: 'subtitle2' }}
          >
            Need help?
          </Link>

          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <Box sx={{ p: 2, width: 250 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box
                  component="img"
                  src="/assets/icons/navbar/ic_chat.svg"
                  sx={{ width: 80, height: 80 }}
                />
              </Box>
              {/* Title and Subtitle */}
              <Typography variant="h6" align="center" sx={{ mb: 1 }}>
                Get in touch
              </Typography>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
                Reach Out for Assistance Anytime!
              </Typography>
              {/* Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: 'black',
                    color: 'white',
                    px: 4, // Increased horizontal padding
                    '&:hover': {
                      backgroundColor: 'grey.800',
                    },
                  }}
                  onClick={() => window.open('tel:+1234567890', '_self')}
                >
                  Call
                </Button>
                {/* Mail Button */}
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: 'white',
                    color: 'black',
                    px: 4, // Increased horizontal padding
                    border: '1px solid black',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                    },
                  }}
                  onClick={() => window.open('mailto:help@example.com', '_self')}
                >
                  Mail
                </Button>
              </Box>
            </Box>
          </Popover>
        </Stack>
      </Toolbar>

      {offsetTop && <HeaderShadow />}
    </AppBar>
  );
}
