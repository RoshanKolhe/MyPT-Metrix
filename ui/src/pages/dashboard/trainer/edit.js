import { Helmet } from 'react-helmet-async';
// sections
import TrainerEditView from 'src/sections/trainer/view/trainer-edit-view';

// ----------------------------------------------------------------------

export default function TrainerEditPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Trainer Edit</title>
      </Helmet>

      <TrainerEditView />
    </>
  );
}
