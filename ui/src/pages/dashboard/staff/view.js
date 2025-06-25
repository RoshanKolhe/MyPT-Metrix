import { Helmet } from 'react-helmet-async';
// sections
import StaffView from 'src/sections/staff/view/staff-view';

// ----------------------------------------------------------------------

export default function StaffViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Staff View</title>
      </Helmet>

      <StaffView />
    </>
  );
}
