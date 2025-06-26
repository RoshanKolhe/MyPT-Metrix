import { Helmet } from 'react-helmet-async';
// sections
import TargetView from 'src/sections/target/view/target-view';

// ----------------------------------------------------------------------

export default function TargetViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Target View</title>
      </Helmet>

      <TargetView />
    </>
  );
}
