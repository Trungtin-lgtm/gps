import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import { formatTime } from '../common/util/formatter';
import {
  prepareDeviceRoutes,
  routeTimestamp,
  ROUTE_STATUS,
} from './common/routePlayback';
import matchPositionsToRoad from '../map/roadMatching';

const ITEMS_PER_PAGE = 13;
const MAX_BROWSER_ROAD_MATCH_POINTS = 240;

const statusMarkerColor = (status) => {
  switch (status) {
    case ROUTE_STATUS.MOVING:
      return 'info';
    case ROUTE_STATUS.STATIONARY:
      return 'warning';
    case ROUTE_STATUS.OFFLINE:
    default:
      return 'neutral';
  }
};

const roadMatchMessage = (status) => {
  switch (status) {
    case 'matching':
      return 'Đang bám đường...';
    case 'partial':
      return 'Tuyến chỉ bám đường một phần';
    case 'failed':
    case 'unavailable':
      return null;
    default:
      return null;
  }
};

const RouteReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();

  const devices = useSelector((state) => state.devices.items);
  const livePositions = useSelector((state) => state.session.positions);

  const [routePositions, setRoutePositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusClock, setStatusClock] = useState(Date.now());
  const [roadMatch, setRoadMatch] = useState({
    status: 'idle',
    geometries: [],
    snappedPositions: [],
  });

  const deviceRoutes = useMemo(() => prepareDeviceRoutes({
    positions: routePositions,
    devices,
    livePositions,
    now: statusClock,
  }), [devices, livePositions, routePositions, statusClock]);
  const selectedRoute = useMemo(() => (
    deviceRoutes.find((item) => item.deviceId === selectedDeviceId) || null
  ), [deviceRoutes, selectedDeviceId]);
  const paginatedItems = deviceRoutes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const rowBackgroundColor = (index) => {
    if (isDarkMode) {
      return index % 2 === 0 ? '#2c2c2c' : '#1e1e1e';
    }
    return index % 2 === 0 ? '#f9fbfc' : '#eef9f3';
  };

  const selectedMapPositions = useMemo(
    () => selectedRoute?.replayPositions || [],
    [selectedRoute],
  );

  const selectedRoutePoints = useMemo(
    () => selectedRoute?.displayPositions || [],
    [selectedRoute],
  );

  const roadMatchInput = useMemo(() => (
    selectedRoutePoints.length <= MAX_BROWSER_ROAD_MATCH_POINTS
      ? selectedRoutePoints
      : []
  ), [selectedRoutePoints]);
  const roadMatchInputRef = useRef(roadMatchInput);
  const roadMatchKey = useMemo(() => roadMatchInput
    .map((position) => [
      position.deviceId,
      position.id,
      position.latitude,
      position.longitude,
      routeTimestamp(position),
    ].join(':'))
    .join('|'), [roadMatchInput]);

  useEffect(() => {
    roadMatchInputRef.current = roadMatchInput;
  }, [roadMatchInput]);

  const hasCompleteRoadMatch = roadMatch.status === 'matched'
    && roadMatch.snappedPositions.length === roadMatchInput.length
    && roadMatch.geometries.length > 0;

  const snappedByCluster = useMemo(() => {
    const result = new Map();
    if (!hasCompleteRoadMatch) {
      return result;
    }
    roadMatch.snappedPositions.forEach((position) => {
      const clusterIndex = position.attributes?.routeClusterIndex;
      if (Number.isInteger(clusterIndex)) {
        result.set(clusterIndex, position);
      }
    });
    return result;
  }, [hasCompleteRoadMatch, roadMatch.snappedPositions]);

  const renderedMapPositions = useMemo(() => {
    if (!hasCompleteRoadMatch) {
      return selectedMapPositions;
    }
    return selectedMapPositions.map((position) => {
      const clusterIndex = position.attributes?.routeDisplayClusterIndex
        ?? position.attributes?.routeClusterIndex;
      const snappedPosition = snappedByCluster.get(clusterIndex);
      if (!snappedPosition) {
        return position;
      }
      return {
        ...position,
        latitude: snappedPosition.latitude,
        longitude: snappedPosition.longitude,
        attributes: {
          ...position.attributes,
          roadMatched: true,
        },
      };
    });
  }, [hasCompleteRoadMatch, selectedMapPositions, snappedByCluster]);

  const renderedRoutePoints = useMemo(
    () => (hasCompleteRoadMatch ? roadMatch.snappedPositions : selectedRoutePoints),
    [hasCompleteRoadMatch, roadMatch.snappedPositions, selectedRoutePoints],
  );

  const activeMapPosition = useMemo(() => {
    if (!renderedMapPositions.length) {
      return null;
    }
    return renderedMapPositions[Math.min(playbackIndex, renderedMapPositions.length - 1)];
  }, [playbackIndex, renderedMapPositions]);

  const activeMarkerStatus = useMemo(() => {
    const atLatestPosition = playbackIndex >= selectedMapPositions.length - 1;
    if (atLatestPosition) {
      return selectedRoute?.status;
    }
    return activeMapPosition?.attributes?.routeStatus || selectedRoute?.status;
  }, [
    activeMapPosition,
    playbackIndex,
    selectedMapPositions.length,
    selectedRoute?.status,
  ]);

  const cameraPositions = useMemo(() => {
    if (renderedRoutePoints.length > 0) {
      return renderedRoutePoints;
    }
    if (selectedRoutePoints.length > 0) {
      return selectedRoutePoints;
    }
    return activeMapPosition ? [activeMapPosition] : [];
  }, [activeMapPosition, renderedRoutePoints, selectedRoutePoints]);

  useEffect(() => {
    const timer = window.setInterval(() => setStatusClock(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const matchInput = roadMatchInputRef.current;
    if (selectedRoutePoints.length > MAX_BROWSER_ROAD_MATCH_POINTS) {
      setRoadMatch({
        status: 'unavailable',
        geometries: [],
        snappedPositions: [],
        reason: 'too-many-positions-for-browser-match',
      });
      return undefined;
    }
    if (matchInput.length < 3) {
      setRoadMatch({
        status: 'insufficient',
        geometries: [],
        snappedPositions: [],
      });
      return undefined;
    }

    let active = true;
    const controller = new AbortController();
    setRoadMatch({
      status: 'matching',
      geometries: [],
      snappedPositions: [],
    });

    matchPositionsToRoad(matchInput, controller.signal)
      .then((result) => {
        if (!active) {
          return;
        }
        setRoadMatch(result);
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') {
          setRoadMatch({
            status: 'failed',
            geometries: [],
            snappedPositions: [],
            reason: error.message,
          });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [roadMatchKey, selectedRoutePoints.length]);

  useEffect(() => {
    setPlaybackIndex(0);
    setPlaying(false);
  }, [selectedRoute?.key]);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(deviceRoutes.length / ITEMS_PER_PAGE));
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [deviceRoutes.length]);

  useEffect(() => {
    if (!playing || selectedMapPositions.length < 2) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setPlaybackIndex((current) => {
        const next = current + playbackRate;
        if (next >= selectedMapPositions.length) {
          setPlaying(false);
          return selectedMapPositions.length - 1;
        }
        return next;
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [playing, playbackRate, selectedMapPositions.length]);

  const onMapPointClick = useCallback((positionId, index) => {
    const displayPosition = selectedRoutePoints.find(
      (position) => String(position.id) === String(positionId),
    ) || (Number.isInteger(index) ? renderedRoutePoints[index] : null);
    const selectedTimestamp = routeTimestamp(displayPosition);
    let nextIndex = selectedMapPositions.findIndex(
      (position) => routeTimestamp(position) === selectedTimestamp,
    );
    if (nextIndex < 0 && selectedTimestamp !== null) {
      nextIndex = selectedMapPositions.reduce((nearestIndex, position, positionIndex) => {
        if (nearestIndex < 0) {
          return positionIndex;
        }
        const currentDistance = Math.abs(routeTimestamp(position) - selectedTimestamp);
        const nearestDistance = Math.abs(
          routeTimestamp(selectedMapPositions[nearestIndex]) - selectedTimestamp,
        );
        return currentDistance < nearestDistance ? positionIndex : nearestIndex;
      }, -1);
    }
    if (nextIndex >= 0) {
      setPlaying(false);
      setPlaybackIndex(nextIndex);
    }
  }, [renderedRoutePoints, selectedMapPositions, selectedRoutePoints]);

  const selectTimelineItem = (item) => {
    setPlaying(false);
    setPlaybackIndex(0);
    setSelectedDeviceId((current) => (current === item.deviceId ? null : item.deviceId));
  };

  const handleSubmit = useCatch(async ({
    deviceIds, groupIds, from, to, type,
  }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    if (type === 'export') {
      window.location.assign(`/api/reports/route/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(`/api/reports/route/mail?${query.toString()}`);
      if (!response.ok) {
        throw Error(await response.text());
      }
    } else {
      setLoading(true);
      try {
        const options = { headers: { Accept: 'application/json' } };
        const response = await fetch(`/api/reports/route?${query.toString()}`, options);
        if (!response.ok) {
          throw Error(await response.text());
        }

        const positions = await response.json();
        setRoutePositions(positions);
        setCurrentPage(1);
        setSelectedDeviceId(null);
        setPlaybackIndex(0);
        setPlaying(false);
        setStatusClock(Date.now());
      } finally {
        setLoading(false);
      }
    }
  });

  const handleSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'route';
    const error = await scheduleReport(deviceIds, groupIds, report);
    if (error) {
      throw Error(error);
    } else {
      navigate('/reports/scheduled');
    }
  });

  const statusLabel = (status) => {
    switch (status) {
      case ROUTE_STATUS.MOVING:
        return t('reportStatusMoving') || t('eventDeviceMoving');
      case ROUTE_STATUS.STATIONARY:
        return t('reportStatusStationary') || t('eventDeviceStopped');
      case ROUTE_STATUS.OFFLINE:
        return t('deviceStatusOffline');
      default:
        return t('deviceStatusUnknown');
    }
  };

  const statusChip = (status) => {
    let color = 'default';
    if (status === ROUTE_STATUS.MOVING) {
      color = 'info';
    } else if (status === ROUTE_STATUS.STATIONARY) {
      color = 'warning';
    }
    return (
      <Chip
        color={color}
        label={statusLabel(status)}
        size="small"
        variant={status === ROUTE_STATUS.OFFLINE ? 'outlined' : 'filled'}
        sx={status === ROUTE_STATUS.OFFLINE ? {
          borderColor: 'text.disabled',
          color: 'text.secondary',
        } : undefined}
      />
    );
  };

  return (
    <PageLayout
      menu={<ReportsMenu />}
      drawerWidth="300px"
      breadcrumbs={['reportTitle', 'reportRoute']}
    >
      <div className={classes.container}>
        {selectedRoute && selectedMapPositions.length > 0 && (
          <div className={classes.containerMap} style={{ position: 'relative' }}>
            <MapView>
              <MapGeofence />
              {selectedRoutePoints.length > 1 && !hasCompleteRoadMatch && (
                <MapRoutePath positions={selectedRoutePoints} rawFallback />
              )}
              {hasCompleteRoadMatch && (
                <MapRoutePath
                  positions={renderedRoutePoints}
                  geometries={roadMatch.geometries}
                />
              )}
              {renderedRoutePoints.length > 0 && (
                <MapRoutePoints
                  positions={renderedRoutePoints}
                  onClick={onMapPointClick}
                />
              )}
              {activeMapPosition && (
                <MapPositions
                  positions={[activeMapPosition]}
                  markerColor={statusMarkerColor(activeMarkerStatus)}
                />
              )}
              {cameraPositions.length > 1 ? (
                <MapCamera positions={cameraPositions} />
              ) : (
                <MapCamera
                  latitude={cameraPositions[0].latitude}
                  longitude={cameraPositions[0].longitude}
                />
              )}
            </MapView>
            <MapScale />
            {roadMatchMessage(roadMatch.status) && (
              <Chip
                label={roadMatchMessage(roadMatch.status)}
                color={roadMatch.status === 'matching' ? 'info' : 'warning'}
                size="small"
                sx={{
                  position: 'absolute',
                  zIndex: 2,
                  left: 72,
                  top: 16,
                  fontWeight: 600,
                }}
              />
            )}
            {selectedMapPositions.length > 1 && activeMapPosition && (
              <Paper
                elevation={5}
                sx={{
                  position: 'absolute',
                  zIndex: 2,
                  left: 72,
                  bottom: 16,
                  width: 380,
                  maxWidth: 'calc(100% - 88px)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                }}
              >
                <Stack spacing={0.25}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography variant="caption" fontWeight={700}>
                      {t('reportReplay')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {`${playbackIndex + 1}/${selectedMapPositions.length} · ${formatTime(routeTimestamp(activeMapPosition), 'seconds')}`}
                    </Typography>
                  </Stack>
                  <Slider
                    aria-label={t('reportReplay')}
                    min={0}
                    max={selectedMapPositions.length - 1}
                    value={Math.min(playbackIndex, selectedMapPositions.length - 1)}
                    onChange={(_, value) => {
                      setPlaying(false);
                      setPlaybackIndex(value);
                    }}
                    size="small"
                    sx={{ py: 0.25 }}
                  />
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
                    <IconButton
                      aria-label="Lùi"
                      size="small"
                      onClick={() => setPlaybackIndex((index) => Math.max(0, index - playbackRate))}
                      disabled={playing || playbackIndex <= 0}
                    >
                      <FastRewindIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label={playing ? 'Dừng phát' : 'Phát'}
                      color="primary"
                      size="small"
                      onClick={() => setPlaying((value) => !value)}
                      disabled={playbackIndex >= selectedMapPositions.length - 1}
                    >
                      {playing ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <IconButton
                      aria-label="Tiến"
                      size="small"
                      onClick={() => setPlaybackIndex((index) => Math.min(
                        selectedMapPositions.length - 1,
                        index + playbackRate,
                      ))}
                      disabled={playing || playbackIndex >= selectedMapPositions.length - 1}
                    >
                      <FastForwardIcon fontSize="small" />
                    </IconButton>
                    <FormControl size="small" sx={{ minWidth: 56, ml: 0.5 }}>
                      <Select
                        value={playbackRate}
                        onChange={(event) => setPlaybackRate(Number(event.target.value))}
                        inputProps={{ 'aria-label': 'Tốc độ phát' }}
                      >
                        {[1, 2, 4, 8].map((rate) => (
                          <MenuItem key={rate} value={rate}>{`x${rate}`}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Stack>
              </Paper>
            )}
          </div>
        )}
        <div className={classes.containerMain}>
          <div
            className={classes.header}
            style={{ backgroundColor: '#3c8dbc', marginBottom: '10px' }}
          >
            <ReportFilter
              handleSubmit={handleSubmit}
              handleSchedule={handleSchedule}
              multiDevice
              includeGroups
              groupOnly
              loading={loading}
            />
          </div>
          <Table
            sx={{
              minWidth: 520,
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              '& .MuiTableCell-root': {
                padding: '12px 16px',
                fontSize: '14px',
                borderBottom: '1px solid #e0e0e0',
              },
            }}
          >
            <TableHead
              sx={{
                background: 'linear-gradient(90deg, #3c8dbc 0%, #5dade2 100%)',
                '& .MuiTableCell-root': {
                  fontWeight: 'bold',
                  color: '#fff',
                },
              }}
            >
              <TableRow>
                <TableCell className={classes.columnAction} />
                <TableCell>{t('sharedDevice')}</TableCell>
                <TableCell>{t('deviceStatus')}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!loading && paginatedItems.map((item, index) => (
                <TableRow
                  key={item.key}
                  hover
                  selected={selectedDeviceId === item.deviceId}
                  onClick={() => selectTimelineItem(item)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'background-color 0.25s ease',
                    backgroundColor: rowBackgroundColor(index),
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffe0b2',
                    },
                  }}
                >
                  <TableCell className={classes.columnAction} padding="none">
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        selectTimelineItem(item);
                      }}
                    >
                      {selectedDeviceId === item.deviceId ? (
                        <GpsFixedIcon fontSize="small" />
                      ) : (
                        <LocationSearchingIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    {devices[item.deviceId]?.name || item.deviceId}
                  </TableCell>
                  <TableCell>{statusChip(item.status)}</TableCell>
                </TableRow>
              ))}
              {!loading && deviceRoutes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    {t('sharedNoData')}
                  </TableCell>
                </TableRow>
              )}
              {loading && <TableShimmer columns={3} startAction />}
            </TableBody>
          </Table>
        </div>
      </div>
      <Stack spacing={2} sx={{ marginTop: 1 }} alignItems="center">
        <Pagination
          count={Math.max(1, Math.ceil(deviceRoutes.length / ITEMS_PER_PAGE))}
          page={currentPage}
          onChange={(event, value) => setCurrentPage(value)}
          variant="outlined"
          color="primary"
        />
      </Stack>
    </PageLayout>
  );
};

export default RouteReportPage;
