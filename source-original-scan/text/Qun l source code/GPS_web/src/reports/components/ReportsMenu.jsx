import React from 'react';
import { Divider, List, Tooltip } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import MenuItem from '../../common/components/MenuItem';
import CloseIcon from '@mui/icons-material/Close';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import ReplayIcon from '@mui/icons-material/Replay';
import DateRangeIcon from '@mui/icons-material/DateRange';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import ClosedCaptionOffIcon from '@mui/icons-material/ClosedCaptionOff';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import FlareIcon from '@mui/icons-material/Flare';
const ReportsMenu = () => {
  const t = useTranslation();
  const location = useLocation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  return (
    <div style={{overflow:'auto', overflowX:'hidden', color:'black'}}>
      <List>
        <MenuItem
          title={t('reportCombined')}
          link="/reports/combined"
          icon={ <Tooltip title={t('reportCombined')}><FlareIcon sx={{ color: 'black' }} /></Tooltip>}
          selected={location.pathname === '/reports/combined'}
        />
        <MenuItem
          title={t('reportRoute')}
          link="/reports/route"
          icon={ <Tooltip title={t('reportRoute')}><TimelineIcon sx={{ color: 'black' }} /></Tooltip>}
          selected={location.pathname === '/reports/route'}
        />
        <MenuItem
          title={t('reportEvents')}
          link="/reports/event"
          icon={ <Tooltip title={t('reportEvents')}><NotificationsNoneIcon sx={{ color: 'black' }} /></Tooltip>}
          selected={location.pathname === '/reports/event'}
        />
        <MenuItem
          title={t('reportTrips')}
          link="/reports/trip"
          icon={ <Tooltip title={t('reportTrips')}><PlayCircleOutlineIcon sx={{ color: 'black' }} /></Tooltip>}
          selected={location.pathname === '/reports/trip'}
        />
        <MenuItem
          title={t('reportStops')}
          link="/reports/stop"
          icon={ <Tooltip title={t('reportStops')}><PauseCircleOutlineIcon sx={{ color: 'black' }} /></Tooltip>}
          selected={location.pathname === '/reports/stop'}
        />
        <MenuItem
          title={t('reportSummary')}
          link="/reports/summary"
          icon={ <Tooltip title={t('reportSummary')}><FormatListBulletedIcon sx={{ color: 'black' }} /></Tooltip>}
          selected={location.pathname === '/reports/summary'}
        />
        <MenuItem
          title={t('reportChart')}
          link="/reports/chart"
          icon={ <Tooltip title={t('reportChart')}><EqualizerIcon sx={{ color: 'black' }} /></Tooltip>}
          selected={location.pathname === '/reports/chart'}
        />
        <MenuItem
          title={t('reportReplay')}
          link="/replay"
          icon={ <Tooltip title={t('reportReplay')}><ReplayIcon sx={{ color: 'black' }} /></Tooltip>}
        />
        {!admin && (
          <button onClick={() => localStorage.setItem("miniDrawer", "false")} style={{background:'none', border:'none', padding:'0px', width:'100%'}}>
            <MenuItem
              title={t("exit")}
              link="/"
              icon={ <Tooltip title={t('exit')}><CloseIcon sx={{ color: 'black' }} /></Tooltip>}
            />
          </button>
        )}
      </List>
      <Divider />
      <List>
        <MenuItem
          title={t('sharedLogs')}
          link="/reports/logs"
          icon={ <Tooltip title={t('sharedLogs')}><ClosedCaptionOffIcon sx={{ color: 'black' }} /></Tooltip>}
          selected={location.pathname === '/reports/logs'}
        />
        {!readonly && (
          <MenuItem
            title={t('reportScheduled')}
            link="/reports/scheduled"
            icon={ <Tooltip title={t('reportScheduled')}><DateRangeIcon sx={{ color: 'black' }} /></Tooltip>}
            selected={location.pathname === '/reports/scheduled'}
          />
        )}
        {admin && (
          <MenuItem
            title={t('statisticsTitle')}
            link="/reports/statistics"
            icon={ <Tooltip title={t('statisticsTitle')}><StackedLineChartIcon sx={{ color: 'black' }} /></Tooltip>}
            selected={location.pathname === '/reports/statistics'}
          />
        )}
        {admin && (
          <button onClick={() => localStorage.setItem("miniDrawer", "false")} style={{background:'none', border:'none',padding:'0px', width:'100%'}}>
            <MenuItem
              title={t("exit")}
              link="/"
              icon={ <Tooltip title={t('exit')}><CloseIcon sx={{ color: 'black' }} /></Tooltip>}
            />
        </button>
        )}
      </List>
    </div>
  );
};

export default ReportsMenu;
