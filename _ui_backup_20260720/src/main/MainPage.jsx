import React, {
  useState, useCallback, useEffect,
} from 'react';
import { Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import DeviceList from './DeviceList';
import BottomMenu from '../common/components/BottomMenu';
import { devicesActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import EventsDrawer from './EventsDrawer';
import useFilter from './useFilter';
import MainToolbar from './MainToolbar';
import MainMap from './MainMap';
import { useAttributePreference } from '../common/util/preferences';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PhonelinkIcon from '@mui/icons-material/Phonelink';
import PhonelinkOffIcon from '@mui/icons-material/PhonelinkOff';
import OperationsBar from './OperationsBar';
import OperationsDetails from './OperationsDetails';
import OperationsFooter from './OperationsFooter';

import "./mainPage.css"
const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebar: {
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      position: 'fixed',   // Cố định vị trí
      right: 19,            // Cố định sang bên phải
      bottom: 0,           // Cố định ở dưới cùng
      width: theme.dimensions.drawerWidthDesktop,  // Độ rộng của sidebar
      margin: theme.spacing(1.5),
      zIndex: 3,
    },
    [theme.breakpoints.down('md')]: {
      position: 'static',  // Không cố định khi màn hình nhỏ
      height: '100%',      // Chiều cao chiếm toàn màn hình
      width: '100%',       // Chiều rộng chiếm toàn màn hình
    },
  },
  header: {
    pointerEvents: 'auto',
    zIndex: 6,
  },
  footer: {
    pointerEvents: 'auto',
    zIndex: 5,
  },
  middle: {
    flex: 1,
    display: 'grid',
  },
  contentMap: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
  },
  contentList: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
    zIndex: 4,
  },
}));

const MainPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const mapOnSelect = useAttributePreference('mapOnSelect', true);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const selectedPosition = filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId);
  
  const [filteredDevices, setFilteredDevices] = useState([]);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = usePersistedState('filter', {
    statuses: [],
    groups: [],
  });
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', false);

  const [devicesOpen, setDevicesOpen] = useState(desktop);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onEventsClick = useCallback(() => setEventsOpen(true), [setEventsOpen]);
  const sidebarTogglePosition = sidebarOpen ? '312px' : '5px';

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [desktop, mapOnSelect, selectedDeviceId]);

  useFilter(keyword, filter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions);

  return (
    <div className={classes.root}>
      {desktop && (
        <header className="dashboard-header">
          <BottomMenu />
          <OperationsBar keyword={keyword} setKeyword={setKeyword} resultCount={filteredDevices.length} />
        </header>
      )}
      <div className="dashboard-workspace">
        <aside className="dashboard-device-pane">
          {!desktop && <Paper
            elevation={3}
            className={classes.header}
            style={{ backgroundColor: "#0b1220", color: "#e5edf6", borderRadius: 0, borderBottom: "1px solid #223047" }}
          >
            <MainToolbar
              filteredDevices={filteredDevices}
              devicesOpen={devicesOpen}
              setDevicesOpen={setDevicesOpen}
              keyword={keyword}
              setKeyword={setKeyword}
              filter={filter}
              setFilter={setFilter}
              filterSort={filterSort}
              setFilterSort={setFilterSort}
              filterMap={filterMap}
              setFilterMap={setFilterMap}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              fixedPanel
            />
          </Paper>}
          <div className={classes.middle}>
            {!desktop && (
              <div className={classes.contentMap}>
                <MainMap
                  filteredPositions={filteredPositions}
                  selectedPosition={selectedPosition}
                  onEventsClick={onEventsClick}
                />
              </div>
            )}
            <Paper
              className={classes.contentList}
              style={{ backgroundColor: "#0b1220", height: "100%", color: "#e5edf6", borderRadius: 0, overflow: "hidden" }}
            >
              <DeviceList devices={filteredDevices}/>
            </Paper>
          </div>
        </aside>
        <main className="dashboard-map-pane">
          <MainMap filteredPositions={filteredPositions} selectedPosition={selectedPosition} onEventsClick={onEventsClick} />
        </main>
        <aside className="dashboard-details-pane">
          <OperationsDetails deviceId={selectedDeviceId} position={selectedPosition} />
        </aside>
      </div>
      {desktop && <OperationsFooter onEventsClick={onEventsClick} />}
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
    </div>
  );
};

export default MainPage;
