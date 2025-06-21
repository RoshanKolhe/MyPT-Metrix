import { Helmet } from 'react-helmet-async';
// sections
import { TrainerCreateView } from 'src/sections/trainer/view';

// ----------------------------------------------------------------------

export default function TrainerCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new trainer</title>
      </Helmet>

      <TrainerCreateView />
    </>
  );
}
