import PropTypes from 'prop-types';
// @mui
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import CardHeader from '@mui/material/CardHeader';
import Card from '@mui/material/Card';
import TableContainer from '@mui/material/TableContainer';
// components
import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';

// ----------------------------------------------------------------------

const getRankColor = (rank) => {
  switch (rank) {
    case 1:
      return '#FDC700'; // gold
    case 2:
      return '#FFB86A'; // orange
    case 3:
      return '#D1D5DC'; // silver/gray
    default:
      return '#ECEEF2'; // others
  }
};

// ----------------------------------------------------------------------

export default function PTConductions({ title, subheader, tableLabels, dashboardPtConductionsRank, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title || 'PT Conductions'} subheader={subheader} sx={{ mb: 2 }} />

      <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
        <Scrollbar sx={{ minWidth: '100%' }}>
          <Table size="small" sx={{ minWidth: 400, width: '100%' }}>
            {/* Table Head */}
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {dashboardPtConductionsRank.map((row) => (
                <PTConductionsRow key={row.id || `${row.rank}`}  row={row}  />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

PTConductions.propTypes = {
  subheader: PropTypes.string,
  dashboardPtConductionsRank: PropTypes.array,
  tableLabels: PropTypes.array,
  title: PropTypes.string,
};

// ----------------------------------------------------------------------

function PTConductionsRow({ row }) {

  return (
      <TableRow>
        <TableCell
          sx={{
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: '8px',
              bgcolor: getRankColor(row.rank),
              color: '#000',
              fontWeight: 'bold',
            }}
          >
            {row.rank}
          </Box>
        </TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.target}</TableCell>
        <TableCell>{row.actual}</TableCell>
      </TableRow>
  );
}

PTConductionsRow.propTypes = {
  row: PropTypes.object,
};

