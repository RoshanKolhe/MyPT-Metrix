import { Helmet } from 'react-helmet-async';
// sections
import { StaffListView } from 'src/sections/staff/view';

// ----------------------------------------------------------------------

export default function StaffListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Staff List</title>
      </Helmet>

      <StaffListView />
    </>
  );
}
