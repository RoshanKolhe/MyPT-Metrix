import { Helmet } from 'react-helmet-async';
// sections
import { StaffCreateView } from 'src/sections/staff/view';

// ----------------------------------------------------------------------

export default function StaffCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new staff</title>
      </Helmet>

      <StaffCreateView />
    </>
  );
}
