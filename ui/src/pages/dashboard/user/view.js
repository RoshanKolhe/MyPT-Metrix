import { Helmet } from 'react-helmet-async';
// sections
import UserView from 'src/sections/user/view/user-view';

// ----------------------------------------------------------------------

export default function UserViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: User View</title>
      </Helmet>

      <UserView />
    </>
  );
}
