import { Helmet } from 'react-helmet-async';
// sections
import ConductionEditView from 'src/sections/conduction/view/conduction-edit-view';

// ----------------------------------------------------------------------

export default function ConductionEditPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Conduction Edit</title>
      </Helmet>

      <ConductionEditView />
    </>
  );
}
