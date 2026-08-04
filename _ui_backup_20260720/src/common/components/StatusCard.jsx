import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Draggable from 'react-draggable';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Menu,
  MenuItem,
  CardMedia,
  TableFooter,
  Link,
  Tooltip,
  useMediaQuery,
  Button,
  Stack,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useDeviceReadonly } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import { useTheme } from '@mui/styles';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import GrainIcon from '@mui/icons-material/Grain';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

const useStyles = makeStyles((theme) => ({
  card: {
    pointerEvents: 'auto',
    width: theme.dimensions.popupMaxWidth,
    borderRadius: 12,
    overflow: 'hidden',
    '& .MuiLink-root': {
      color: '#22d3ee',
    },
  },
  media: {
    height: theme.dimensions.popupImageHeight,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  mediaButton: {
    color: theme.palette.primary.contrastText,
    mixBlendMode: 'difference',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 1, 0, 2),
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxHeight: theme.dimensions.cardContentMaxHeight,
    overflow: 'auto',
  },
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  table: {
    '& .MuiTableCell-sizeSmall': {
      paddingLeft: 0,
      paddingRight: 0,
    },
    '& .MuiTableCell-sizeSmall:first-child': {
      paddingRight: theme.spacing(1),
    },
  },
  cell: {
    borderBottom: 'none',
  },
  actions: {
    justifyContent: 'space-between',
  },
  root: ({ embedded }) => ({
    pointerEvents: 'none',
    position: embedded ? 'relative' : 'fixed',
    zIndex: 5,
    left: embedded ? 'auto' : '50%',
    width: embedded ? '100%' : 'auto',
    [theme.breakpoints.up('md')]: {
      left: embedded ? 'auto' : '50%',
      bottom: embedded ? 'auto' : theme.spacing(0),
    },
    [theme.breakpoints.down('md')]: {
      left: embedded ? 'auto' : '50%',
      bottom: embedded ? 'auto' : `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
    },
    transform: embedded ? 'none' : 'translateX(-50%)',
  }),
}));

const StatusRow = ({ name, content }) => {
  const classes = useStyles();

  return (
    <TableRow>
      <TableCell className={classes.cell}>
        <Typography variant="body2" sx={{ color: '#9fb0c4' }}>{name}</Typography>
      </TableCell>
      <TableCell className={classes.cell}>
        <Typography variant="body2" sx={{ color: '#e5edf6' }}>{content}</Typography>
      </TableCell>
    </TableRow>
  );
};

const StatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0, embedded = false }) => {
  const classes = useStyles({ desktopPadding, embedded });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const deviceReadonly = useDeviceReadonly();

  const shareDisabled = useSelector((state) => state.session.server?.attributes?.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);

  const deviceImage = device?.attributes?.deviceImage;

  const positionAttributes = usePositionAttributes(t);
  const positionItems = useAttributePreference('positionItems', 'fixTime,address,speed,totalDistance');
  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const [anchorEl, setAnchorEl] = useState(null);

  const [removing, setRemoving] = useState(false);
  const isDarkMode = theme.palette.mode === 'dark';
  const actionButtonSx = {
    justifyContent: 'flex-start',
    color: '#aebdd0',
    '&:hover': {
      backgroundColor: 'rgba(34,211,238,0.08)',
      color: '#22d3ee',
    },
  };

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetch('/api/devices');
      if (response.ok) {
        dispatch(devicesActions.refresh(await response.json()));
      } else {
        throw Error(await response.text());
      }
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetch('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    if (response.ok) {
      const item = await response.json();
      const permissionResponse = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
      });
      if (!permissionResponse.ok) {
        throw Error(await permissionResponse.text());
      }
      navigate(`/settings/geofence/${item.id}`);
    } else {
      throw Error(await response.text());
    }
  }, [navigate, position]);

  return (
    <>
      <div className={classes.root}>
        {device && (
          <Draggable
            disabled={embedded}
            handle={`.${classes.media}, .${classes.header},.${classes.card}`}
            cancel=".MuiIconButton-root, .MuiButton-root, .MuiLink-root"
            >
            <Card
              elevation={3}
              className={classes.card}
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                width: embedded ? "100%" : (isMobile ? "82vw" : (deviceImage ? "720px" : "600px")),
                minHeight: isMobile ? 0 : "170px",
                height: "auto",
                backgroundColor: '#0b1220',
                color: '#e5edf6',
                border: '1px solid #223047',
                boxShadow: '0 18px 45px rgba(0,0,0,0.5)',
              }}
            >
              {/* Nút bên trái */}
              {!isMobile && (
                <CardActions
                  disableSpacing
                  style={{
                    display: "none",
                    flexDirection: isMobile ? "row" : "column",
                    justifyContent: isMobile ? "space-around" : "flex-start",
                    alignItems: isMobile ? "center" : "flex-start",
                    gap: 8,
                    width: isMobile ? "100%" : "50px",
                    height: isMobile ? "auto" : "auto",
                  }}
                >
                  <Tooltip title={t('sharedExtra')}>
                  <IconButton
                      color="secondary"
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      disabled={!position}
                    >
                      <GrainIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('reportReplay')}>
                    <IconButton
                      onClick={() => navigate('/replay')}
                      disabled={disableActions || !position}
                    >
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>
                  {/* <Tooltip title={t('commandTitle')}>
                    <IconButton
                      onClick={() => navigate(`/settings/device/${deviceId}/command`)}
                      disabled={disableActions}
                    >
                      <PublishIcon />
                    </IconButton>
                  </Tooltip> */}
                  <Tooltip title={t('sharedEdit')}>
                  <IconButton
                      onClick={() => navigate(`/settings/device/${deviceId}`)}
                      disabled={disableActions || deviceReadonly}
                    >
                      <DriveFileRenameOutlineIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('sharedRemove')}>
                    <IconButton
                      color="error"
                      onClick={() => setRemoving(true)}
                      disabled={disableActions || deviceReadonly}
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              )}
              {/* Cột ảnh */}
              <div
                style={{
                  width: deviceImage ? (isMobile ? "100%" : "190px") : (isMobile ? "100%" : "145px"),
                  height: isMobile ? "auto" : "100%",
                  position: "relative",
                  display: "flex",
                }}
              >
                {deviceImage ? (
                  <img
                    src={`/api/media/${device.uniqueId}/${deviceImage}`}
                    alt={device.name}
                    style={{
                      maxWidth: "100%",
                        maxHeight: "170px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div
                    className={classes.header}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                        minHeight: isMobile ? "72px" : "140px",
                    }}
                  >
                    <Typography
                      variant="body1"
                      noWrap
                      sx={{ maxWidth: 150, fontWeight: 700, color: '#e5edf6' }}
                    >
                      {device.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        marginTop: 0.5,
                      color: device.status === 'online' ? '#22d3ee' : '#858b93',
                      }}
                    >
                      {device.status === 'online' ? 'Online' : 'Offline'}
                    </Typography>
                  </div>
                )}
              </div>

              {/* Cột mới */}
              <div
                style={{
                  display: "flex",
                  margin: isMobile ? "0 12px 6px" : "0 8px",
                  minWidth: isMobile ? 0 : 145,
                  alignSelf: "center",
                }}
              >
                <Stack spacing={0.25} sx={{ width: '100%' }}>
                  <Button size="small" variant="text" sx={actionButtonSx} startIcon={<InfoOutlinedIcon />} onClick={() => navigate(`/position/${position.id}`)} disabled={!position}>
                    {t('sharedShowDetails')}
                  </Button>
                  {!deviceReadonly && (
                    <>
                      <Button size="small" variant="text" sx={actionButtonSx} startIcon={<EditIcon />} onClick={() => navigate(`/settings/device/${deviceId}`)} disabled={disableActions}>
                        {t('sharedEdit')}
                      </Button>
                      <Button size="small" variant="text" sx={actionButtonSx} startIcon={<DeleteForeverIcon />} onClick={() => setRemoving(true)} disabled={disableActions}>
                        {t('sharedRemove')}
                      </Button>
                    </>
                  )}
                </Stack>
              </div>
              {/* Cột thông tin */}
              <div style={{ flex: 1, marginTop: isMobile ? 0 : 8, marginRight: isMobile ? 0 : 12 }}>
                {/* icon đóng card */}
                <IconButton
                  size="small"
                  onClick={onClose}
                  onTouchStart={onClose}
                  sx={{
                    position: "absolute",
                    top: -5,
                    right: 0,
                    paddingTop: 1,
                  }}
                >
                  <CloseIcon fontSize="small" className={classes.mediaButton} style={{color: isDarkMode ? '#FF0000' : '#EEEEEE',}} />
                </IconButton>
                {position && (
                  <CardContent
                    className={classes.content}
                    style={{
                      maxHeight: isMobile ? "auto" : "170px",
                      overflowY: "auto",
                      position: "relative",
                      // width: isMobile ? undefined : '350px'
                    }}
                  >
                    <Table size="small" classes={{ root: classes.table }}>
                      <TableBody>
                        {positionItems
                          .split(",")
                          .filter(
                            (key) =>
                              // Kiểm tra nếu là "speed" và không phải mobile, thì ẩn
                              ['fixTime', 'address', 'totalDistance'].includes(key) &&
                              (position?.hasOwnProperty(key) ||
                                position?.attributes?.hasOwnProperty(key))
                          )
                          .map((key) => (
                            <StatusRow
                              key={key}
                              name={positionAttributes[key]?.name || key}
                              content={
                                <PositionValue
                                  position={position}
                                  property={
                                    position?.hasOwnProperty(key) ? key : null
                                  }
                                  attribute={
                                    position?.hasOwnProperty(key) ? null : key
                                  }
                                />
                              }
                            />
                          ))}
                      </TableBody>
                      <TableFooter sx={{ display: 'none' }}>
                        <TableRow>
                          <TableCell colSpan={2} className={classes.cell}>
                            <Typography variant="body2">
                              <Link
                                component={RouterLink}
                                to={`/position/${position.id}`}
                              >
                                {t("sharedShowDetails")}
                              </Link>
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </CardContent>
                )}
              </div>
              {isMobile && (
                <CardActions
                  disableSpacing
                  style={{
                    flexDirection: isMobile ? "row" : "column",
                    justifyContent: isMobile ? "space-around" : "flex-start",
                    alignItems: isMobile ? "center" : "flex-start",
                    padding: 8,
                    gap: 4,
                    width: isMobile ? "100%" : "50px",
                    marginTop: isMobile ? 0 : 8,
                  }}
                >
                  <Tooltip title={t("sharedExtra")}>
                    <IconButton
                      color="secondary"
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      disabled={!position}
                    >
                      <GrainIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("reportReplay")}>
                    <IconButton
                      onClick={() => navigate("/replay")}
                      disabled={disableActions || !position}
                    >
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>
                  {/* <Tooltip title={t('commandTitle')}>
                    <IconButton
                      onClick={() => navigate(`/settings/device/${deviceId}/command`)}
                      disabled={disableActions}
                    >
                      <PublishIcon />
                    </IconButton>
                  </Tooltip> */}
                  <Tooltip title={t("sharedEdit")}>
                    <IconButton
                      onClick={() => navigate(`/settings/device/${deviceId}`)}
                      disabled={disableActions || deviceReadonly}
                    >
                      <DriveFileRenameOutlineIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("sharedRemove")}>
                    <IconButton
                      color="error"
                      onClick={() => setRemoving(true)}
                      disabled={disableActions || deviceReadonly}
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              )}
            </Card>
          </Draggable>
        )}
      </div>
      {position && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={handleGeofence}>
            {t("sharedCreateGeofence")}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}
          >
            {t("linkGoogleMaps")}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`http://maps.apple.com/?ll=${position.latitude},${position.longitude}`}
          >
            {t("linkAppleMaps")}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}
          >
            {t("linkStreetView")}
          </MenuItem>
          {navigationAppTitle && (
            <MenuItem
              component="a"
              target="_blank"
              href={navigationAppLink
                .replace("{latitude}", position.latitude)
                .replace("{longitude}", position.longitude)}
            >
              {navigationAppTitle}
            </MenuItem>
          )}
          {!shareDisabled && !user.temporary && (
            <MenuItem
              onClick={() => navigate(`/settings/device/${deviceId}/share`)}
            >
              <Typography color="secondary">{t("deviceShare")}</Typography>
            </MenuItem>
          )}
        </Menu>
      )}
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
    </>
  );
};

export default StatusCard;
