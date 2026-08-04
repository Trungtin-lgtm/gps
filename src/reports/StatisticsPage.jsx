import React, { useState } from 'react';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  Stack,
  Pagination,
  useTheme,
} from '@mui/material';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportFilter from './components/ReportFilter';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';

const columnsArray = [
  ['captureTime', 'statisticsCaptureTime'],
  ['activeUsers', 'statisticsActiveUsers'],
  ['activeDevices', 'statisticsActiveDevices'],
  ['requests', 'statisticsRequests'],
  ['messagesReceived', 'statisticsMessagesReceived'],
  ['messagesStored', 'statisticsMessagesStored'],
  ['mailSent', 'notificatorMail'],
  ['smsSent', 'notificatorSms'],
  ['geocoderRequests', 'statisticsGeocoder'],
  ['geolocationRequests', 'statisticsGeolocation'],
];
const columnsMap = new Map(columnsArray);

const StatisticsPage = () => {
  const classes = useReportStyles();
  const t = useTranslation();

  const [columns, setColumns] = usePersistedState('statisticsColumns', ['captureTime', 'activeUsers', 'activeDevices', 'messagesStored']);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 13;
  const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleSubmit = useCatch(async ({ from, to }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ from, to });
      const response = await fetch(`/api/statistics?${query.toString()}`);
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageLayout
      menu={<ReportsMenu />}
      drawerWidth="300px"
      breadcrumbs={["reportTitle", "statisticsTitle"]}
    >
      <div className={classes.container}>
        <div
          className={classes.header}
          style={{ backgroundColor: "#3c8dbc", marginBottom: "10px" }}
        >
          <ReportFilter
            handleSubmit={handleSubmit}
            showOnly
            ignoreDevice
            loading={loading}
          >
            <ColumnSelect
              columns={columns}
              setColumns={setColumns}
              columnsArray={columnsArray}
            />
          </ReportFilter>
        </div>
        <div className={classes.containerMain}>
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
                {columns.map((key) => (
                  <TableCell key={key}>{t(columnsMap.get(key))}</TableCell>
                ))}
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
                      backgroundColor: index % 2 === 0
                      ? isDarkMode ? '#2c2c2c' : '#f9fbfc'
                      : isDarkMode ? '#1e1e1e' : '#eef9f3',
                      "&:hover": {
                        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffe0b2',
                      },
                    }}
                  >
                    {columns.map((key) => (
                      <TableCell key={key}>
                        {key === "captureTime"
                          ? formatTime(item[key], "date")
                          : item[key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length} />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Stack spacing={2} sx={{ marginTop: 1 }} alignItems="center">
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

export default StatisticsPage;
