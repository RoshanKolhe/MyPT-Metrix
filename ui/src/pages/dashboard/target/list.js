import { Helmet } from 'react-helmet-async';
// sections
import { TargetListView } from 'src/sections/target/view';

// ----------------------------------------------------------------------

export default function TargetListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Target List</title>
      </Helmet>

      <TargetListView />
    </>
  );
}
