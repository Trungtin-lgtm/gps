import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Link, IconButton,
  Stack,
  Pagination,
  useTheme,
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import { useSelector } from 'react-redux';
import { formatSpeed, formatTime } from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch, useEffectAsync } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import { useAttributePreference } from '../common/util/preferences';
import MapView from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import SelectField from '../common/components/SelectField';

const columnsArray = [
  ['eventTime', 'positionFixTime'],
  ['type', 'sharedType'],
  ['geofenceId', 'sharedGeofence'],
  ['maintenanceId', 'sharedMaintenance'],
  ['attributes', 'commandData'],
];
const columnsMap = new Map(columnsArray);

const EventReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();

  const devices = useSelector((state) => state.devices.items);
  const geofences = useSelector((state) => state.geofences.items);

  const speedUnit = useAttributePreference('speedUnit');

  const [allEventTypes, setAllEventTypes] = useState([['allEvents', 'eventAll']]);

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const [columns, setColumns] = usePersistedState('eventColumns', ['eventTime', 'type', 'attributes']);
  const [eventTypes, setEventTypes] = useState(['allEvents']);
  const [alarmTypes, setAlarmTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [position, setPosition] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  useEffectAsync(async () => {
    if (selectedItem) {
      const response = await fetch(`/api/positions?id=${selectedItem.positionId}`);
      if (response.ok) {
        const positions = await response.json();
        if (positions.length > 0) {
          setPosition(positions[0]);
        }
      } else {
        throw Error(await response.text());
      }
    } else {
      setPosition(null);
    }
  }, [selectedItem]);

  useEffectAsync(async () => {
    const response = await fetch('/api/notifications/types');
    if (response.ok) {
      const types = await response.json();
      setAllEventTypes([...allEventTypes, ...types.map((it) => [it.type, prefixString('event', it.type)])]);
    } else {
      throw Error(await response.text());
    }
  }, []);

  const handleSubmit = useCatch(async ({ deviceId, from, to, type }) => {
    const query = new URLSearchParams({ deviceId, from, to });
    eventTypes.forEach((it) => query.append('type', it));
    if (eventTypes[0] !== 'allEvents' && eventTypes.includes('alarm')) {
      alarmTypes.forEach((it) => query.append('alarm', it));
    }
    if (type === 'export') {
      window.location.assign(`/api/reports/events/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(`/api/reports/events/mail?${query.toString()}`);
      if (!response.ok) {
        throw Error(await response.text());
      }
    } else {
      setLoading(true);
      try {
        const response = await fetch(`/api/reports/events?${query.toString()}`, {
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
    report.type = 'events';
    if (eventTypes[0] !== 'allEvents') {
      report.attributes.types = eventTypes.join(',');
    }
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
      case 'eventTime':
        return formatTime(value, 'seconds');
      case 'type':
        return t(prefixString('event', value));
      case 'geofenceId':
        if (value > 0) {
          const geofence = geofences[value];
          return geofence && geofence.name;
        }
        return null;
      case 'maintenanceId':
        return value > 0 ? value : null;
      case 'attributes':
        switch (item.type) {
          case 'alarm':
            return t(prefixString('alarm', item.attributes.alarm));
          case 'deviceOverspeed':
            return formatSpeed(item.attributes.speed, speedUnit, t);
          case 'driverChanged':
            return item.attributes.driverUniqueId;
          case 'media':
            return (<Link href={`/api/media/${devices[item.deviceId]?.uniqueId}/${item.attributes.file}`} target="_blank">{item.attributes.file}</Link>);
          case 'commandResult':
            return item.attributes.result;
          default:
            return '';
        }
      default:
        return value;
    }
  };

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={["reportTitle", "reportEvents"]}
    >
      <div className={classes.container}>
        {selectedItem && (
          <div className={classes.containerMap}>
            <MapView>
              <MapGeofence />
              {position && (
                <MapPositions positions={[position]} titleField="fixTime" />
              )}
            </MapView>
            <MapScale />
            {position && (
              <MapCamera
                latitude={position.latitude}
                longitude={position.longitude}
              />
            )}
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
              <div className={classes.filterItem}  style={{padding:'6px', backgroundColor:"white", borderRadius:"5px"}}>
                <FormControl fullWidth>
                  <InputLabel sx={{ fontWeight: "bold" }}>{t("reportEventTypes")}</InputLabel>
                  <Select
                    label={t("reportEventTypes")}
                    value={eventTypes}
                    onChange={(e, child) => {
                      let values = e.target.value;
                      const clicked = child.props.value;
                      if (values.includes("allEvents") && values.length > 1) {
                        values = [clicked];
                      }
                      setEventTypes(values);
                    }}
                    multiple
                  >
                    {allEventTypes.map(([key, string]) => (
                      <MenuItem key={key} value={key}>
                        {t(string)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              {eventTypes[0] !== "allEvents" &&
                eventTypes.includes("alarm") && (
                  <div className={classes.filterItem}>
                    <SelectField
                      multiple
                      value={alarmTypes}
                      onChange={(e) => setAlarmTypes(e.target.value)}
                      data={alarms}
                      keyGetter={(it) => it.key}
                      label={t("sharedAlarms")}
                      fullWidth
                    />
                  </div>
                )}
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
                    <TableCell className={classes.columnAction} padding="none">
                      {(item.positionId &&
                        (selectedItem === item ? (
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
                        ))) ||
                        ""}
                    </TableCell>
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

export default EventReportPage;
