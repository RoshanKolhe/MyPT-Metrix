import { Helmet } from 'react-helmet-async';
// sections
import SaleEditView from 'src/sections/sale/view/sale-edit-view';

// ----------------------------------------------------------------------

export default function SaleEditPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Sale Edit</title>
      </Helmet>

      <SaleEditView />
    </>
  );
}
