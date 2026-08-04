import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Typography, Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import { sessionActions } from '../../store';
import { useTranslation } from './LocalizationProvider';
import { useRestriction } from '../util/permissions';
import { nativePostMessage } from './NativeInterface';
import WidgetsIcon from '@mui/icons-material/Widgets';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

const BottomMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');
  const disableReports = useRestriction('disableReports');
  const user = useSelector((state) => state.session.user);
  const socket = useSelector((state) => state.session.socket);
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(false);
  const currentSelection = () => {
    if (location.pathname === `/settings/user/${user.id}`) {
      return 'account';
    } if (location.pathname.startsWith('/settings')) {
      return 'settings';
    } if (location.pathname.startsWith('/reports')) {
      return 'reports';
    } if (location.pathname === '/') {
      return 'map';
    }
    return null;
  };

  const handleAccount = () => {
    setAnchorEl(null);
    navigate(`/settings/user/${user.id}`);
    setSelectedMenu(false)
  };

  const handleLogout = async () => {
    setAnchorEl(null);

    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && !user.readonly) {
      window.localStorage.removeItem('notificationToken');
      const tokens = user.attributes.notificationTokens?.split(',') || [];
      if (tokens.includes(notificationToken)) {
        const updatedUser = {
          ...user,
          attributes: {
            ...user.attributes,
            notificationTokens: tokens.length > 1 ? tokens.filter((it) => it !== notificationToken).join(',') : undefined,
          },
        };
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });
      }
    }

    await fetch('/api/session', { method: 'DELETE' });
    nativePostMessage('logout');
    navigate('/login');
    dispatch(sessionActions.updateUser(null));
  };

  const handleClick = (value, event) => {
    switch (value) {
      case 'map':
        navigate('/');
        setSelectedMenu(false)
        break;
      case 'reports':
        navigate('/reports/combined');
        setSelectedMenu(false)
        break;
      case 'settings':
        navigate('/settings/preferences');
        setSelectedMenu(false)
        break;
      case 'account':
        setAnchorEl(event.currentTarget);
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleClickMenu = () => {
    if (selectedMenu) {
      setSelectedMenu(false);
    } else {
      setSelectedMenu(true);
    }
  };
  return (
    <>
      <List
        onClick={() => handleClickMenu()}
        sx={{ backgroundColor: "#eef9f3", borderTopLeftRadius: 8, borderTopRightRadius: 8, color: 'black', ...(!selectedMenu && desktop && {borderBottomLeftRadius: 8, borderBottomRightRadius: 8 })}}
      >
        <ListItem button>
          <ListItemIcon>
            <Badge
              color="error"
              variant="dot"
              overlap="circular"
            >
              <WidgetsIcon sx={{color:"black"}}/>
            </Badge>
          </ListItemIcon>
          <ListItemText>Menu</ListItemText>
        </ListItem>
      </List>
      {selectedMenu && (
        <List disablePadding sx={{ backgroundColor: "#eef9f3", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, color: 'black' }}>
          <ListItem
            button
            selected={currentSelection() === "map"}
            onClick={(e) => handleClick("map", e)}
          >
            <ListItemIcon>
              <Badge
                color="error"
                variant="dot"
                overlap="circular"
                invisible={socket !== false}
              >
                <TravelExploreIcon sx={{color:"black"}}/>
              </Badge>
            </ListItemIcon>
            <ListItemText primary={t("mapTitle")} />
          </ListItem>

          {!disableReports && (
            <ListItem
              button
              selected={currentSelection() === "reports"}
              onClick={(e) => handleClick("reports", e)}
            >
              <ListItemIcon>
                <ReceiptLongIcon sx={{color:"black"}}/>
              </ListItemIcon>
              <ListItemText primary={t("reportTitle")} />
            </ListItem>
          )}

          <ListItem
            button
            selected={currentSelection() === "settings"}
            onClick={(e) => handleClick("settings", e)}
          >
            <ListItemIcon>
              <DisplaySettingsIcon sx={{color:"black"}}/>
            </ListItemIcon>
            <ListItemText primary={t("settingsTitle")} />
          </ListItem>

          {readonly ? (
            <ListItem button onClick={(e) => handleClick("logout", e)}>
              <ListItemIcon>
                <ExitToAppIcon sx={{color:"black"}}/>
              </ListItemIcon>
              <ListItemText primary={t("loginLogout")} />
            </ListItem>
          ) : (
            <ListItem
              button
              selected={currentSelection() === "account"}
              onClick={(e) => handleClick("account", e)}
            >
              <ListItemIcon>
                <ManageAccountsIcon sx={{color:"black"}}/>
              </ListItemIcon>
              <ListItemText primary={t("settingsUser")} />
            </ListItem>
          )}
        </List>
      )}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={handleAccount}>
          <Typography color="textPrimary">{t("settingsUser")}</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography color="error">{t("loginLogout")}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default BottomMenu;
