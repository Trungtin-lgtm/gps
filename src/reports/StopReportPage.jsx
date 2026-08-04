import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Pagination,
  Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  useTheme,
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import {
  formatDistance, formatVolume, formatTime, formatNumericHours,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ColumnSelect from './components/ColumnSelect';
import usePersistedState from '../common/util/usePersistedState';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import MapPositions from '../map/MapPositions';
import MapView from '../map/core/MapView';
import MapCamera from '../map/MapCamera';
import AddressValue from '../common/components/AddressValue';
import TableShimmer from '../common/components/TableShimmer';
import MapGeofence from '../map/MapGeofence';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';

const columnsArray = [
  ['startTime', 'reportStartTime'],
  ['startOdometer', 'positionOdometer'],
  ['address', 'positionAddress'],
  ['endTime', 'reportEndTime'],
  ['duration', 'reportDuration'],
  ['engineHours', 'reportEngineHours'],
  ['spentFuel', 'reportSpentFuel'],
];
const columnsMap = new Map(columnsArray);

const StopReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();

  const distanceUnit = useAttributePreference('distanceUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [columns, setColumns] = usePersistedState('stopColumns', ['startTime', 'endTime', 'duration', 'address']);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 13;
  const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleSubmit = useCatch(async ({ deviceId, from, to, type }) => {
    const query = new URLSearchParams({ deviceId, from, to });
    if (type === 'export') {
      window.location.assign(`/api/reports/stops/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(`/api/reports/stops/mail?${query.toString()}`);
      if (!response.ok) {
        throw Error(await response.text());
      }
    } else {
      setLoading(true);
      try {
        const response = await fetch(`/api/reports/stops?${query.toString()}`, {
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
    report.type = 'stops';
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
      case 'startTime':
      case 'endTime':
        return formatTime(value, 'minutes');
      case 'startOdometer':
        return formatDistance(value, distanceUnit, t);
      case 'duration':
        return formatNumericHours(value, t);
      case 'engineHours':
        return value > 0 ? formatNumericHours(value, t) : null;
      case 'spentFuel':
        return value > 0 ? formatVolume(value, volumeUnit, t) : null;
      case 'address':
        return (<AddressValue latitude={item.latitude} longitude={item.longitude} originalAddress={value} />);
      default:
        return value;
    }
  };

  return (
    <PageLayout
      menu={<ReportsMenu />}
      drawerWidth="300px"
      breadcrumbs={["reportTitle", "reportStops"]}
    >
      <div className={classes.container}>
        {selectedItem && (
          <div className={classes.containerMap}>
            <MapView>
              <MapGeofence />
              <MapPositions
                positions={[
                  {
                    deviceId: selectedItem.deviceId,
                    fixTime: selectedItem.startTime,
                    latitude: selectedItem.latitude,
                    longitude: selectedItem.longitude,
                  },
                ]}
                titleField="fixTime"
              />
            </MapView>
            <MapScale />
            <MapCamera
              latitude={selectedItem.latitude}
              longitude={selectedItem.longitude}
            />
          </div>
        )}
        <div className={classes.containerMain}>
          <div
            className={classes.header}
            style={{ backgroundColor: "#3c8dbc", marginBottom: "10px" }}
          >
            <ReportFilter
              handleSubmit={handleSubmit}
              handleSchedule={handleSchedule}
              loading={loading}
            >
              <ColumnSelect
                columns={columns}
                setColumns={setColumns}
                columnsArray={columnsArray}
              />
            </ReportFilter>
          </div>
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
                <TableCell className={classes.columnAction} />
                {columns.map((key) => (
                  <TableCell key={key}>{t(columnsMap.get(key))}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                paginatedItems.map((item, index) => (
                  <TableRow
                    key={item.positionId}
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
                    <TableCell className={classes.columnAction} padding="none">
                      {selectedItem === item ? (
                        <IconButton
                          size="small"
                          onClick={() => setSelectedItem(null)}
                        >
                          <GpsFixedIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => setSelectedItem(item)}
                        >
                          <LocationSearchingIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                    {columns.map((key) => (
                      <TableCell key={key}>{formatValue(item, key)}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length + 1} startAction />
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

export default StopReportPage;
