import { Helmet } from 'react-helmet-async';
// sections
import JwtNewPasswordView from 'src/sections/auth/jwt/jwt-new-password-view';
// ----------------------------------------------------------------------

export default function NewPasswordPage() {
  return (
    <>
      <Helmet>
        <title> MyPT: New Password</title>
      </Helmet>

      <JwtNewPasswordView />
    </>
  );
}
