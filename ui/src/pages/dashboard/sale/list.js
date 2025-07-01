import { Helmet } from 'react-helmet-async';
// sections
import { SaleListView } from 'src/sections/sale/view';

// ----------------------------------------------------------------------

export default function SaleListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Sale List</title>
      </Helmet>

      <SaleListView />
    </>
  );
}
