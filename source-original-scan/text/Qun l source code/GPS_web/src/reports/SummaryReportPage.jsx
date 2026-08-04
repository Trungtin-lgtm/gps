import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableRow, TableBody, TableCell,
  Stack,
  Pagination,
  useTheme,
} from '@mui/material';
import {
  formatDistance, formatSpeed, formatVolume, formatTime, formatNumericHours,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import scheduleReport from './common/scheduleReport';

const columnsArray = [
  ['startTime', 'reportStartDate'],
  ['distance', 'sharedDistance'],
  ['startOdometer', 'reportStartOdometer'],
  ['endOdometer', 'reportEndOdometer'],
  ['averageSpeed', 'reportAverageSpeed'],
  ['maxSpeed', 'reportMaximumSpeed'],
  ['engineHours', 'reportEngineHours'],
  ['startHours', 'reportStartEngineHours'],
  ['endHours', 'reportEndEngineHours'],
  ['spentFuel', 'reportSpentFuel'],
];
const columnsMap = new Map(columnsArray);

const SummaryReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();

  const devices = useSelector((state) => state.devices.items);

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [columns, setColumns] = usePersistedState('summaryColumns', ['startTime', 'distance', 'averageSpeed']);
  const [daily, setDaily] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 13;
  const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleSubmit = useCatch(async ({ deviceIds, groupIds, from, to, type }) => {
    const query = new URLSearchParams({ from, to, daily });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    if (type === 'export') {
      window.location.assign(`/api/reports/summary/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(`/api/reports/summary/mail?${query.toString()}`);
      if (!response.ok) {
        throw Error(await response.text());
      }
    } else {
      setLoading(true);
      try {
        const response = await fetch(`/api/reports/summary?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          setItems(await response.json());
        } else {
          throw Error(await response.text());
        }
      } finally {
        setLoading(false);
      }
    }
  });

  const handleSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'summary';
    report.attributes.daily = daily;
    const error = await scheduleReport(deviceIds, groupIds, report);
    if (error) {
      throw Error(error);
    } else {
      navigate('/reports/scheduled');
    }
  });

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value].name;
      case 'startTime':
        return formatTime(value, 'date');
      case 'startOdometer':
      case 'endOdometer':
      case 'distance':
        return formatDistance(value, distanceUnit, t);
      case 'averageSpeed':
      case 'maxSpeed':
        return value > 0 ? formatSpeed(value, speedUnit, t) : null;
      case 'engineHours':
      case 'startHours':
      case 'endHours':
        return value > 0 ? formatNumericHours(value, t) : null;
      case 'spentFuel':
        return value > 0 ? formatVolume(value, volumeUnit, t) : null;
      default:
        return value;
    }
  };

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={["reportTitle", "reportSummary"]}
    >
      <div className={classes.container}>
        <div
          className={classes.header}
          style={{ backgroundColor: "#3c8dbc", marginBottom: "10px" }}
        >
          <ReportFilter
            handleSubmit={handleSubmit}
            handleSchedule={handleSchedule}
            multiDevice
            includeGroups
            loading={loading}
          >
            <div className={classes.filterItem}  style={{padding:'6px', backgroundColor:"white", borderRadius:"5px"}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: "bold" }}>{t("sharedType")}</InputLabel>
                <Select
                  label={t("sharedType")}
                  value={daily}
                  onChange={(e) => setDaily(e.target.value)}
                >
                  <MenuItem value={false}>{t("reportSummary")}</MenuItem>
                  <MenuItem value>{t("reportDaily")}</MenuItem>
                </Select>
              </FormControl>
            </div>
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
                <TableCell>{t("sharedDevice")}</TableCell>
                {columns.map((key) => (
                  <TableCell key={key}>{t(columnsMap.get(key))}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                paginatedItems.map((item, index) => (
                  <TableRow
                    key={`${item.deviceId}_${Date.parse(item.startTime)}`}
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
                    <TableCell>{devices[item.deviceId].name}</TableCell>
                    {columns.map((key) => (
                      <TableCell key={key}>{formatValue(item, key)}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length + 1} />
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

export default SummaryReportPage;
