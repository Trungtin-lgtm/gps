import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography, Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import { sessionActions } from '../../store';
import { useTranslation } from './LocalizationProvider';
import { useRestriction } from '../util/permissions';
import { nativePostMessage } from './NativeInterface';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import SettingsIcon from '@mui/icons-material/Settings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ReportsMenu from '../../reports/components/ReportsMenu';
import { PageLayoutMiniContext } from './PageLayout';

const BottomMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useTranslation();

  const disableReports = useRestriction('disableReports');
  const user = useSelector((state) => state.session.user);
  const socket = useSelector((state) => state.session.socket);
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(false);
  const closeTimer = useRef(null);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const openNavigation = () => {
    if (desktop) {
      clearTimeout(closeTimer.current);
      setSelectedMenu(true);
    }
  };

  const closeNavigation = () => {
    if (desktop) {
      clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => setSelectedMenu(false), 300);
    }
  };
  const currentSelection = () => {
    if (location.pathname === `/settings/user/${user.id}`) {
      return 'account';
    } if (location.pathname.startsWith('/settings')) {
      return 'settings';
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

  const navigationItemSx = {
    minHeight: 54,
    px: selectedMenu || !desktop ? 2 : 0,
    justifyContent: selectedMenu || !desktop ? 'flex-start' : 'center',
    transition: 'background-color 160ms ease, color 160ms ease',
    '&:hover': { backgroundColor: '#f1f3f4' },
    '&.Mui-selected': {
      backgroundColor: '#dceff6',
      color: '#0b57d0',
    },
    '&.Mui-selected:hover': { backgroundColor: '#d3e9f2' },
    '&.Mui-selected .MuiSvgIcon-root': { color: '#0b57d0' },
  };

  const navigationIconSx = {
    minWidth: selectedMenu || !desktop ? 48 : 0,
    justifyContent: 'center',
  };

  return (
    <Box
      onMouseEnter={openNavigation}
      onMouseLeave={closeNavigation}
      onFocusCapture={openNavigation}
      onBlurCapture={closeNavigation}
      sx={desktop ? {
        display: 'flex',
        flexDirection: 'column',
        width: selectedMenu ? 240 : 80,
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8ec',
        borderRadius: 0,
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.14)',
        color: '#202124',
        transition: 'width 220ms ease',
      } : {
        backgroundColor: '#ffffff',
        color: '#202124',
      }}
    >
      <List disablePadding>
        <ListItemButton
          aria-label={t("settingsUser")}
          selected={currentSelection() === "account"}
          onClick={(e) => handleClick("account", e)}
          sx={{
            ...navigationItemSx,
            minHeight: 64,
          }}
        >
          <ListItemIcon sx={{ minWidth: selectedMenu || !desktop ? 48 : 0, justifyContent: 'center' }}>
            <ManageAccountsIcon sx={{ color: 'inherit' }} />
          </ListItemIcon>
          {(selectedMenu || !desktop) && <ListItemText primary={t("settingsUser")} />}
        </ListItemButton>
      </List>
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <List disablePadding sx={{ py: 0.5 }}>
          <ListItemButton
            aria-label={t("mapTitle")}
            selected={currentSelection() === "map"}
            onClick={(e) => handleClick("map", e)}
            sx={navigationItemSx}
          >
            <ListItemIcon sx={navigationIconSx}>
              <Badge
                color="error"
                variant="dot"
                overlap="circular"
                invisible={socket !== false}
              >
                <TravelExploreIcon sx={{color:"black"}}/>
              </Badge>
            </ListItemIcon>
            {(selectedMenu || !desktop) && <ListItemText primary={t("mapTitle")} />}
          </ListItemButton>

        </List>
        {!disableReports && (
          <PageLayoutMiniContext.Provider value={desktop && !selectedMenu}>
            <ReportsMenu
              onNavigate={() => setSelectedMenu(false)}
              onRequestExpand={() => setSelectedMenu(true)}
            />
          </PageLayoutMiniContext.Provider>
        )}
      </Box>
      <List disablePadding sx={{ mt: desktop ? 'auto' : 0, py: 0.5 }}>
        <ListItemButton
          aria-label={t("settingsTitle")}
          selected={currentSelection() === "settings"}
          onClick={(e) => handleClick("settings", e)}
          sx={navigationItemSx}
        >
          <ListItemIcon sx={navigationIconSx}>
            <SettingsIcon sx={{ color: 'black' }} />
          </ListItemIcon>
          {(selectedMenu || !desktop) && <ListItemText primary={t("settingsTitle")} />}
        </ListItemButton>
      </List>
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
    </Box>
  );
};

export default BottomMenu;
