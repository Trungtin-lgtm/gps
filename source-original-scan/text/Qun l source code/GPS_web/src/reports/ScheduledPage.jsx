import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Table, TableRow, TableCell, TableHead, TableBody, IconButton,
  Stack,
  Pagination,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import TableShimmer from '../common/components/TableShimmer';
import RemoveDialog from '../common/components/RemoveDialog';

const useStyles = makeStyles((theme) => ({
  columnAction: {
    width: '1%',
    paddingRight: theme.spacing(1),
  },
}));

const ScheduledPage = () => {
  const classes = useStyles();
  const t = useTranslation();

  const calendars = useSelector((state) => state.calendars.items);

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 14;
  const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const formatType = (type) => {
    switch (type) {
      case 'events':
        return t('reportEvents');
      case 'route':
        return t('reportRoute');
      case 'summary':
        return t('reportSummary');
      case 'trips':
        return t('reportTrips');
      case 'stops':
        return t('reportStops');
      default:
        return type;
    }
  };

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={["settingsTitle", "reportScheduled"]}
    >
      <div className={classes.container}>
        <Table
          sx={{
            minWidth: 650,
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            "& .MuiTableCell-root": {
              padding: "12px 16px",
              fontSize: "14px",
              borderBottom: "1px solid #e0e0e0",
            },
          }}
        >
          <TableHead
            sx={{
              background: "linear-gradient(90deg, #3c8dbc 0%, #5dade2 100%)",
              "& .MuiTableCell-root": {
                fontWeight: "bold",
                color: "#fff",
              },
            }}
          >
            <TableRow>
              <TableCell>{t("sharedType")}</TableCell>
              <TableCell>{t("sharedDescription")}</TableCell>
              <TableCell>{t("sharedCalendar")}</TableCell>
              <TableCell className={classes.columnAction} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? (
              paginatedItems.map((item, index) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    transition: "background-color 0.25s ease",
                    backgroundColor: index % 2 === 0 ? "#f9fbfc" : "#eef9f3",
                    "&:hover": {
                      backgroundColor: "#ffe0b2",
                    },
                  }}
                >
                  <TableCell>{formatType(item.type)}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{calendars[item.calendarId].name}</TableCell>
                  <TableCell className={classes.columnAction} padding="none">
                    <IconButton
                      size="small"
                      onClick={() => setRemovingId(item.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableShimmer columns={4} endAction />
            )}
          </TableBody>
        </Table>
        <RemoveDialog
          style={{ transform: "none" }}
          open={!!removingId}
          endpoint="reports"
          itemId={removingId}
          onResult={(removed) => {
            setRemovingId(null);
            if (removed) {
              setTimestamp(Date.now());
            }
          }}
        />
      </div>
      <Stack spacing={2} sx={{ position:'fixed', bottom:10, left:"40%" }} alignItems="center">
        <Pagination
          count={Math.ceil(items.length / ITEMS_PER_PAGE)}
          page={currentPage}
          onChange={(event, value) => setCurrentPage(value)}
          variant="outlined"
          color="primary"
        />
      </Stack>
    </PageLayout>
  );
};

export default ScheduledPage;
