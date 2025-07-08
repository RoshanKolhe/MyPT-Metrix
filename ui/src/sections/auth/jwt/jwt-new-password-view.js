/* eslint-disable no-nested-ternary */
import * as Yup from 'yup';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
// routes
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hook';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// assets
import { SentIcon } from 'src/assets/icons';
// components
import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
import { Card, CircularProgress } from '@mui/material';
import axiosInstance from 'src/utils/axios';
import { useSnackbar } from 'notistack';

// ----------------------------------------------------------------------

export default function JwtNewPasswordView() {
  const password = useBoolean();
  const params = useSearchParams();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [isValidToken, setIsValidToken] = useState(null);

  const token = params.get('token');
  const NewPasswordSchema = Yup.object().shape({
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('password')], 'Passwords must match'),
  });

  const defaultValues = {
    email: '',
    password: '',
    confirmPassword: '',
  };

  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(NewPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const inputData = {
        email: data.email,
        newPassword: data.confirmPassword,
      };

      const response = await axiosInstance.post('setNewPassword', inputData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      enqueueSnackbar(response?.data?.message, { variant: 'success' });
      router.push(paths.auth.jwt.login);
    } catch (error) {
      console.error(error);
      setIsValidToken(false);
    }
  });

  const renderForm = (
    <Stack spacing={3} alignItems="center">
      <RHFTextField
        name="email"
        label="Email"
        placeholder="example@gmail.com"
        InputLabelProps={{ shrink: true }}
        disabled
      />

      <RHFTextField
        name="password"
        label="Password"
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <RHFTextField
        name="confirmPassword"
        label="Confirm New Password"
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
      >
        Update Password
      </LoadingButton>

      <Link
        component={RouterLink}
        href={paths.auth.jwt.login}
        color="inherit"
        variant="subtitle2"
        sx={{
          alignItems: 'center',
          display: 'inline-flex',
        }}
      >
        <Iconify icon="eva:arrow-ios-back-fill" width={16} />
        Return to sign in
      </Link>
    </Stack>
  );

  const renderHead = (
    <>
      <SentIcon sx={{ height: 96 }} />

      <Stack spacing={1} sx={{ my: 5 }}>
        <Typography variant="h3">Reset Password</Typography>
      </Stack>
    </>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsValidToken(true);
        setValue('email', response?.data?.email);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.error('Unauthorized: Invalid token');
          setIsValidToken(false); // Set to false if token is invalid
        } else {
          console.error('An error occurred:', error);
          setIsValidToken(false); // Handle other errors as invalid token
        }
      }
    };

    if (token) {
      fetchData();
    }
  }, [setValue, token]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      {renderHead}

      {isValidToken === null ? (
        // Display nothing or a loading state while checking token validity
        <Stack spacing={1} sx={{ my: 5 }} justifyContent="center">
          <CircularProgress color="info" sx={{ alignSelf: 'center' }} />
        </Stack>
      ) : isValidToken ? (
        renderForm
      ) : (
        <Stack spacing={1} sx={{ my: 5 }}>
          <Typography variant="subtitle1">This link is not valid</Typography>
        </Stack>
      )}
    </FormProvider>
  );
}
