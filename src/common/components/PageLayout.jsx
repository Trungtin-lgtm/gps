import React, { useState } from 'react';
import {
  AppBar,
  Breadcrumbs,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';

export const PageLayoutMiniContext = React.createContext(false);

const useStyles = makeStyles((theme) => ({
  desktopRoot: {
    height: '100%',
    flexDirection: 'row',
    display: 'flex',
  },
  mobileRoot: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  desktopDrawer: {
    width: (props) => (props.miniVariant
      ? `calc(${theme.spacing(8)} + 1px)`
      : props.drawerWidth || theme.dimensions.drawerWidthDesktop),
    left: '80px',
    flexShrink: 0,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    backgroundColor: '#eef9f3',
    color: 'black',
    overflow: 'hidden',
  },
  mobileDrawer: {
    width: theme.dimensions.drawerWidthTablet,
    backgroundColor: '#eef9f3',
  },
  mobileToolbar: {
    zIndex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
}));

const PageTitle = ({ breadcrumbs }) => {
  const theme = useTheme();
  const t = useTranslation();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  if (desktop) {
    return (
      <Typography variant="h6" noWrap>{t(breadcrumbs[0])}</Typography>
    );
  }
  return (
    <Breadcrumbs>
      {breadcrumbs.slice(0, -1).map((breadcrumb) => (
        <Typography variant="h6" color="inherit" key={breadcrumb}>{t(breadcrumb)}</Typography>
      ))}
      <Typography variant="h6" color="textPrimary">{t(breadcrumbs[breadcrumbs.length - 1])}</Typography>
    </Breadcrumbs>
  );
};

const PageLayout = ({
  menu, breadcrumbs, children, drawerWidth,
}) => {
  const t = useTranslation();
  const location = useLocation();
  const reportLayout = location.pathname.startsWith('/reports');
  const settingsLayout = location.pathname.startsWith('/settings');
  const miniDrawerStorageKey = settingsLayout
    ? 'settingsMiniDrawer'
    : 'miniDrawer';
  const [miniVariant, setMiniVariant] = useState(() => {
    if (settingsLayout) {
      return false;
    }
    const saved = localStorage.getItem(miniDrawerStorageKey);
    return saved === 'true';
  });
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [openDrawer, setOpenDrawer] = useState(false);
  const classes = useStyles({
    miniVariant,
    drawerWidth,
  });

  const toggleDrawer = () => {
    const newState = !miniVariant;
    setMiniVariant(newState);
    localStorage.setItem(miniDrawerStorageKey, newState.toString());
  };

  return desktop ? (
    <div className={classes.desktopRoot}>
      {!reportLayout && (
        <Drawer
          variant="permanent"
          anchor="left"
          className={classes.desktopDrawer}
          classes={{ paper: classes.desktopDrawer }}
        >
          <Toolbar>
            {!miniVariant && <PageTitle breadcrumbs={breadcrumbs} />}
            <IconButton
              aria-label={miniVariant ? t(breadcrumbs[0]) : t('sharedHide')}
              color="inherit"
              edge="start"
              sx={{ ml: miniVariant ? -2 : 'auto' }}
              onClick={toggleDrawer}
            >
              {miniVariant ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Toolbar>
          <Divider />
          <PageLayoutMiniContext.Provider value={miniVariant}>
            {menu}
          </PageLayoutMiniContext.Provider>
        </Drawer>
      )}
      <div className={classes.content}>{children}</div>
    </div>
  ) : (
    <div className={classes.mobileRoot}>
      <Drawer
        variant="temporary"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        classes={{ paper: classes.mobileDrawer }}
      >
        {menu}
      </Drawer>
      <AppBar className={classes.mobileToolbar} position="static" color="inherit">
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={() => setOpenDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <PageTitle breadcrumbs={breadcrumbs} />
        </Toolbar>
      </AppBar>
      <div className={classes.content}>{children}</div>
    </div>
  );
};

export default PageLayout;
