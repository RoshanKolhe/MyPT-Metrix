import { Helmet } from 'react-helmet-async';
// sections
import { DepartmentCreateView } from 'src/sections/department/view';

// ----------------------------------------------------------------------

export default function DepartmentCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new department</title>
      </Helmet>

      <DepartmentCreateView />
    </>
  );
}
