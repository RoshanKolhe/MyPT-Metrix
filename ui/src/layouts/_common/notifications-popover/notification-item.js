import PropTypes from 'prop-types';
// @mui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
// utils
import { fToNow } from 'src/utils/format-time';
// components
import Label from 'src/components/label';
import FileThumbnail from 'src/components/file-thumbnail';
import { useRouter } from 'src/routes/hook';
import { paths } from 'src/routes/paths';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function NotificationItem({ notification, drawer }) {
  const { user } = useAuthContext();
  const isAdmin = user
    ? user.permissions.includes('super_admin') || user.permissions.includes('admin')
    : false;
  const router = useRouter();

  const renderAvatar = (
    <ListItemAvatar>
      {notification.avatarUrl ? (
        <Avatar src={notification?.avatarUrl} sx={{ bgcolor: 'background.neutral' }} />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'background.neutral',
          }}
        >
          <Box
            component="img"
            src={`/assets/icons/notification/${
              (notification.type === 'order' && 'ic_order') ||
              (notification.type === 'quotation' && 'ic_quotation') ||
              (notification.type === 'mail' && 'ic_mail') ||
              (notification.type === 'delivery' && 'ic_delivery') ||
              (notification.type === 'material' && 'ic_material')
            }.svg`}
            sx={{ width: 24, height: 24 }}
          />
        </Stack>
      )}
    </ListItemAvatar>
  );

  const renderText = (
    <ListItemText
      disableTypography
      primary={reader(notification.title)}
      secondary={
        <Stack
          direction="row"
          alignItems="center"
          sx={{ typography: 'caption', color: 'text.disabled' }}
          divider={
            <Box
              sx={{ width: 2, height: 2, bgcolor: 'currentColor', mx: 0.5, borderRadius: '50%' }}
            />
          }
        >
          {fToNow(notification.createdAt)}
        </Stack>
      }
    />
  );

  const renderUnReadBadge = !notification.status && (
    <Box
      sx={{
        top: 26,
        width: 8,
        height: 8,
        right: 20,
        borderRadius: '50%',
        bgcolor: 'info.main',
        position: 'absolute',
      }}
    />
  );

  const targetApprovalAction = (
    <Stack spacing={1} direction="row" sx={{ mt: 1.5 }}>
      {notification?.extraDetails?.targetId && (
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            drawer.onFalse();
            router.push(paths.dashboard.target.view(notification.extraDetails.targetId));
          }}
        >
          View Target
        </Button>
      )}
    </Stack>
  );

  const targetStatusAction = (
    <Stack spacing={1} direction="row" sx={{ mt: 1.5 }}>
      {notification.extraDetails?.targetId && (
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            drawer.onFalse?.();
            router.push(paths.dashboard.target.edit(notification.extraDetails.targetId));
          }}
        >
          View Target
        </Button>
      )}
    </Stack>
  );

  return (
    <ListItemButton
      disableRipple
      sx={{
        p: 2.5,
        alignItems: 'flex-start',
        borderBottom: (theme) => `dashed 1px ${theme.palette.divider}`,
      }}
    >
      {renderUnReadBadge}

      {renderAvatar}

      <Stack sx={{ flexGrow: 1 }}>
        {renderText}
        {notification.type === 'target_approval' && targetApprovalAction}
        {notification.type === 'target' && targetStatusAction}
      </Stack>
    </ListItemButton>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.object,
  drawer: PropTypes.any,
};

// ----------------------------------------------------------------------

function reader(data) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: data }}
      sx={{
        mb: 0.5,
        '& p': { typography: 'body2', m: 0 },
        '& a': { color: 'inherit', textDecoration: 'none' },
        '& strong': { typography: 'subtitle2' },
      }}
    />
  );
}
