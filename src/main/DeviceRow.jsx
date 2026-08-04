import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import makeStyles from '@mui/styles/makeStyles';
import {
  IconButton, Tooltip, Avatar, ListItemAvatar, ListItemText, ListItemButton,
  Button,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import Battery20Icon from '@mui/icons-material/Battery20';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import Battery80Icon from '@mui/icons-material/Battery80';
import ErrorIcon from '@mui/icons-material/Error';
import Battery50Icon from '@mui/icons-material/Battery50';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm, formatBoolean, formatPercentage, formatStatus, getStatusColor,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useAdministrator } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';

dayjs.extend(relativeTime);

const useStyles = makeStyles((theme) => ({
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  batteryText: {
    fontSize: '0.75rem',
    fontWeight: 'normal',
    lineHeight: '0.875rem',
  },
  success: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  neutral: {
    color: theme.palette.neutral.main,
  },
}));

const DeviceRow = ({ data, index, style }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();
  const [protocol] = useState(window.location.protocol);  // Lấy Protocol
  const [ipOrDomain] = useState(window.location.hostname);  // Lấy IP/Domain
  
  const handleRedirect = (i) => {
    const newUrl = `${protocol}//${ipOrDomain}:9091/${i?.uniqueId}`;
    // const newUrl = `${protocol}//${ipOrDomain}:8084`;          
    window.open(newUrl, '_blank');  // Mở URL trong tab mới
    // window.location.href = newUrl;  // Điều hướng đến URL
  };
  const admin = useAdministrator();

  const item = data[index];
  const position = useSelector((state) => state.session.positions[item.id]);

  const devicePrimary = useAttributePreference('devicePrimary', 'name');
  const deviceSecondary = useAttributePreference('deviceSecondary', '');
  
  const secondaryText = () => {
    let status;
    if (item.status === 'online' || !item.lastUpdate) {
      status = formatStatus(item.status, t);
    } else {
      status = dayjs(item.lastUpdate).fromNow();
    }
    return (
      <>
        {deviceSecondary && item[deviceSecondary] && `${item[deviceSecondary]} • `}
        <span className={classes[getStatusColor(item.status)]}>{status}</span>
      </>
    );
  };

  
  return (
    <div style={style}>
      <ListItemButton
        key={item.id}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
      >
        <ListItemAvatar>
          <Avatar>
            <img className={classes.icon} src={mapIcons[mapIconKey(item.category)]} alt="" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={item[devicePrimary]}
          primaryTypographyProps={{ noWrap: true }}
          secondary={secondaryText()}
          secondaryTypographyProps={{ noWrap: true }}
        />
        {position && (
          <>
            {position.attributes.hasOwnProperty('alarm') && (
              <Tooltip title={`${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}`}>
                <IconButton size="small">
                  <ErrorIcon fontSize="small" className={classes.error} />
                </IconButton>
              </Tooltip>
            )}
            {position.attributes.hasOwnProperty('ignition') && (
              <Tooltip title={`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`}>
                <IconButton size="small">
                  {position.attributes.ignition ? (
                    <EngineIcon width={20} height={20} className={classes.success}  />
                  ) : (
                    <EngineIcon width={20} height={20} className={classes.neutral} />
                  )}
                </IconButton>
              </Tooltip>
            )}

            {position.attributes.hasOwnProperty('batteryLevel') && (
              <Tooltip title={`${t('positionBatteryLevel')}: ${formatPercentage(position.attributes.batteryLevel)}`}>
                <IconButton size="small">
                  {(() => {
                    const { batteryLevel, charge } = position.attributes;

                    if (batteryLevel >= 90) {
                      return charge
                        ? <BatteryChargingFullIcon fontSize="small" className={classes.success} style={{ transform: 'rotate(270deg)' }} />
                        : <BatteryFullIcon fontSize="small" className={classes.success} style={{ transform: 'rotate(270deg)' }} />;
                    }

                    if (batteryLevel >= 75 && batteryLevel < 90) {
                      return charge
                        ? <Battery80Icon fontSize="small" className={classes.success} style={{ transform: 'rotate(270deg)' }} />
                        : <Battery80Icon fontSize="small" className={classes.success} style={{ transform: 'rotate(270deg)' }} />;
                    }

                    if (batteryLevel >= 50 && batteryLevel < 75) {
                      return charge
                        ? <Battery60Icon fontSize="small" className={classes.success} style={{ transform: 'rotate(270deg)' }} />
                        : <Battery60Icon fontSize="small" className={classes.success} style={{ transform: 'rotate(270deg)' }} />;
                    }

                    if (batteryLevel >= 30 && batteryLevel < 50) {
                      return charge
                        ? <Battery50Icon fontSize="small" className={classes.warning} style={{ transform: 'rotate(270deg)' }} />
                        : <Battery50Icon fontSize="small" className={classes.warning} style={{ transform: 'rotate(270deg)' }} />;
                    }

                    // batteryLevel < 30
                    return charge
                      ? <BatteryCharging20Icon fontSize="small" className={classes.error} style={{ transform: 'rotate(270deg)' }} />
                      : <Battery20Icon fontSize="small" className={classes.error} style={{ transform: 'rotate(270deg)' }} />;
                  })()}
                </IconButton>
              </Tooltip>
            )}
             {/* <Tooltip title={`Microphone`}>
               <IconButton size="small" onClick={()=>handleRedirect(item)} > <MicIcon fontSize="small" style={{ color:"#0066FF"}}/></IconButton>
          
              </Tooltip> */}
          </>
        )}
      </ListItemButton>
    </div>
  );
};

export default DeviceRow;
