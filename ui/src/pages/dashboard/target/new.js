import { Helmet } from 'react-helmet-async';
// sections
import { TargetCreateView } from 'src/sections/target/view';

// ----------------------------------------------------------------------

export default function TargetCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new target</title>
      </Helmet>

      <TargetCreateView />
    </>
  );
}
