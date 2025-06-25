import { Helmet } from 'react-helmet-async';
// sections
import StaffEditView from 'src/sections/staff/view/staff-edit-view';

// ----------------------------------------------------------------------

export default function StaffEditPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Staff Edit</title>
      </Helmet>

      <StaffEditView />
    </>
  );
}
