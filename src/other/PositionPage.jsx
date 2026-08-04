import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Typography, Container, Paper, AppBar, Toolbar, IconButton, Box, Grid
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PositionValue from '../common/components/PositionValue';
import usePositionAttributes from '../common/attributes/usePositionAttributes';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    overflow: 'auto',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  itemBlock: {
    padding: theme.spacing(2),
    margin: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)', 
    },
  },
  label: {
    color: '#3f51b5', 
    fontWeight: 600,
  },
  value: {
    marginTop: theme.spacing(0.5),
  },
}));

const PositionPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const positionAttributes = usePositionAttributes(t);
  const { id } = useParams();
  const [item, setItem] = useState();
  console.log("item", item);
  
  const groups = [
    { title: 'General', keys: ['id', 'deviceId'] },
    { title: 'Time Info', keys: ['serverTime', 'fixTime', 'deviceTime'] },
    { title: 'Status', keys: ['outdated', 'valid'] },
    { title: 'Coordinates', keys: ['latitude', 'longitude'] },
    { title: 'Geofence', keys: ['geofenceIds'] },
    { title: 'Travel Info', keys: ['altitude', 'speed'] },
    { title: 'protocol & accuracy', keys: ['protocol','accuracy'] },
    { title: 'Address & course', keys: ['address', 'course'] },
  ]
  const attributeGroups = [
    { title: 'Distance Info', keys: ['distance', 'totalDistance'] },
    { title: 'Alarm & motion', keys: ['alarm', 'motion'] },
    { title: 'Battery', keys: ['battery', 'batteryLevel'] },
  ];
  useEffectAsync(async () => {
    if (id) {
      const response = await fetch(`/api/positions?id=${id}`);
      if (response.ok) {
        const positions = await response.json();
        if (positions.length > 0) {
          setItem(positions[0]);
        }
      } else {
        throw Error(await response.text());
      }
    }
  }, [id]);

  const deviceName = useSelector((state) => {
    if (item) {
      const device = state.devices.items[item.deviceId];
      return device ? device.name : null;
    }
    return null;
  });

  return (
    <div className={classes.root}>
      <AppBar position="sticky" color="inherit">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2 }}
            onClick={() => navigate(-1)}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">{deviceName}</Typography>
        </Toolbar>
      </AppBar>

      <div className={classes.content}>
        <Container>
          <Grid container spacing={2}>
            {item &&
              groups.map((group, index) => {
                const properties = group.keys.filter((key) =>
                  item.hasOwnProperty(key)
                );
                if (properties.length === 0) return null;
                return (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper className={classes.itemBlock} elevation={2}>
                      {/* <Typography variant="h6" gutterBottom>
                        {group.title}
                      </Typography> */}
                      <Grid container spacing={1}>
                        {properties.map((property) => (
                          <Grid item xs={12} sm={6} key={property}>
                            <Typography className={classes.label}>
                              {property}
                            </Typography>
                            {/* <Typography color="textSecondary" className={classes.label}>
                              {positionAttributes[property]?.name}
                            </Typography> */}
                            <Box className={classes.value}>
                              <PositionValue
                                position={item}
                                property={property}
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}

            {/* Render group thuộc tính từ attributes */}
            {item &&
              attributeGroups.map((group, index) => {
                const properties = group.keys.filter(
                  (key) =>
                    item.attributes && item.attributes.hasOwnProperty(key)
                );
                if (properties.length === 0) return null;
                return (
                  <Grid item xs={12} sm={6} key={`attr-${index}`}>
                    <Paper className={classes.itemBlock} elevation={2}>
                      {/* <Typography variant="h6" gutterBottom>
                        {group.title}
                      </Typography> */}
                      <Grid container spacing={1}>
                        {properties.map((property) => (
                          <Grid item xs={12} sm={6} key={property}>
                            <Typography className={classes.label}>
                              {property}
                            </Typography>
                            {/* <Typography color="textSecondary" className={classes.label}>
                              {positionAttributes[property]?.name}
                            </Typography> */}
                            <Box className={classes.value}>
                              <PositionValue
                                position={item}
                                attribute={property}
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}

            {/* Các thuộc tính lẻ chưa nằm trong nhóm */}
            {item &&
              item.attributes &&
              Object.getOwnPropertyNames(item.attributes)
                .filter(
                  (attr) =>
                    !attributeGroups.some((group) => group.keys.includes(attr))
                )
                .map((attribute) => (
                  <Grid item xs={12} sm={6} key={attribute}>
                    <Paper className={classes.itemBlock} elevation={2}>
                      <Typography className={classes.label}>
                        {attribute}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {positionAttributes[attribute]?.name || t("sharedName")}
                      </Typography>
                      <Box className={classes.value}>
                        <PositionValue position={item} attribute={attribute} />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
          </Grid>
        </Container>
      </div>
    </div>
  );
};

export default PositionPage;
