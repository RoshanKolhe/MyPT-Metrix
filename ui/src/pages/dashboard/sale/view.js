import { Helmet } from 'react-helmet-async';
// sections
import SaleView from 'src/sections/sale/view/sale-view';

// ----------------------------------------------------------------------

export default function SaleViewPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Sale View</title>
      </Helmet>

      <SaleView />
    </>
  );
}
