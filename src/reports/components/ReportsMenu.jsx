import React, { useContext, useEffect, useState } from 'react';
import {
  Collapse, Divider, List, ListItemButton, ListItemIcon, ListItemText, Tooltip,
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import DateRangeIcon from '@mui/icons-material/DateRange';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import ClosedCaptionOffIcon from '@mui/icons-material/ClosedCaptionOff';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import MenuItem from '../../common/components/MenuItem';
import { PageLayoutMiniContext } from '../../common/components/PageLayout';

const ReportsMenu = ({ onNavigate, onRequestExpand }) => {
  const t = useTranslation();
  const location = useLocation();
  const miniVariant = useContext(PageLayoutMiniContext);

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  const advancedSelected = ['/reports/chart', '/reports/logs', '/reports/scheduled', '/reports/statistics']
    .includes(location.pathname);

  const [advancedOpen, setAdvancedOpen] = useState(advancedSelected);

  useEffect(() => {
    if (miniVariant) {
      setAdvancedOpen(false);
    } else if (advancedSelected) {
      setAdvancedOpen(true);
    }
  }, [advancedSelected, miniVariant]);

  const advancedTitle = t('reportAdvanced') || 'Advanced';

  const groupButtonSx = {
    minHeight: 54,
    px: miniVariant ? 0 : 2,
    justifyContent: miniVariant ? 'center' : 'flex-start',
    '&.Mui-selected': { backgroundColor: '#dceff6' },
    '&.Mui-selected:hover': { backgroundColor: '#d3e9f2' },
  };

  const handleAdvancedClick = () => {
    if (miniVariant) {
      setAdvancedOpen(true);
      onRequestExpand?.();
    } else {
      setAdvancedOpen((open) => !open);
    }
  };

  return (
    <div style={{ overflow: 'auto', overflowX: 'hidden', color: 'black' }}>
      <List>
        <MenuItem
          title={t('reportRoute')}
          link="/reports/route"
          icon={<Tooltip title={t('reportRoute')}><TimelineIcon sx={{ color: 'black' }} /></Tooltip>}
          selected={location.pathname === '/reports/route'}
          compact={miniVariant}
          railAligned
          onClick={onNavigate}
        />
      </List>

      <Divider />

      <List>
        <ListItemButton
          selected={advancedSelected}
          onClick={handleAdvancedClick}
          sx={groupButtonSx}
        >
          <ListItemIcon sx={{ minWidth: miniVariant ? 0 : 48, justifyContent: 'center' }}>
            <Tooltip title={advancedTitle}><TuneIcon sx={{ color: 'black' }} /></Tooltip>
          </ListItemIcon>
          {!miniVariant && <ListItemText primary={advancedTitle} sx={{ whiteSpace: 'nowrap' }} />}
          {!miniVariant && (advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
        </ListItemButton>
        <Collapse in={!miniVariant && advancedOpen} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ pl: 2 }}>
            <MenuItem
              title={t('reportChart')}
              link="/reports/chart"
              icon={<Tooltip title={t('reportChart')}><EqualizerIcon sx={{ color: 'black' }} /></Tooltip>}
              selected={location.pathname === '/reports/chart'}
              railAligned
              onClick={onNavigate}
            />
            {!readonly && (
              <MenuItem
                title={t('reportScheduled')}
                link="/reports/scheduled"
                icon={<Tooltip title={t('reportScheduled')}><DateRangeIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname === '/reports/scheduled'}
                railAligned
                onClick={onNavigate}
              />
            )}
            {admin && (
              <MenuItem
                title={t('sharedLogs')}
                link="/reports/logs"
                icon={<Tooltip title={t('sharedLogs')}><ClosedCaptionOffIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname === '/reports/logs'}
                railAligned
                onClick={onNavigate}
              />
            )}
            {admin && (
              <MenuItem
                title={t('statisticsTitle')}
                link="/reports/statistics"
                icon={<Tooltip title={t('statisticsTitle')}><StackedLineChartIcon sx={{ color: 'black' }} /></Tooltip>}
                selected={location.pathname === '/reports/statistics'}
                railAligned
                onClick={onNavigate}
              />
            )}
          </List>
        </Collapse>
      </List>
    </div>
  );
};

export default ReportsMenu;
