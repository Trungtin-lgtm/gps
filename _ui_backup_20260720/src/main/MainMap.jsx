import React, { useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapSelectedDevice from '../map/main/MapSelectedDevice';
import MapAccuracy from '../map/main/MapAccuracy';
import MapGeofence from '../map/MapGeofence';
import MapCurrentLocation from '../map/MapCurrentLocation';
import PoiMap from '../map/main/PoiMap';
import { devicesActions } from '../store';
import MapDefaultCamera from '../map/main/MapDefaultCamera';
import MapLiveRoutes from '../map/main/MapLiveRoutes';
import MapPositions from '../map/MapPositions';
import MapOverlay from '../map/overlay/MapOverlay';
import MapGeocoder from '../map/geocoder/MapGeocoder';
import MapScale from '../map/MapScale';
import MapNotification from '../map/notification/MapNotification';
import useFeatures from '../common/util/useFeatures';
import { map } from '../map/core/MapView';

const MainMap = ({ filteredPositions, selectedPosition, onEventsClick }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const eventsAvailable = useSelector((state) => !!state.events.items.length);

  const features = useFeatures();

  useEffect(() => {
    const applyWhiteLabels = () => {
      map.getStyle()?.layers?.forEach((layer) => {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) {
          try {
            map.setPaintProperty(layer.id, 'text-color', '#f8fafc');
            map.setPaintProperty(layer.id, 'text-halo-color', '#050a12');
            map.setPaintProperty(layer.id, 'text-halo-width', 1.4);
          } catch (error) {
            // Some external style layers do not expose editable text paint properties.
          }
        }
      });
    };
    map.on('style.load', applyWhiteLabels);
    applyWhiteLabels();
    return () => map.off('style.load', applyWhiteLabels);
  }, []);

  const onMarkerClick = useCallback((_, deviceId) => {
    dispatch(devicesActions.selectId(deviceId));
  }, [dispatch]);

  return (
    <>
      {/* <div style={
          desktop
            ? { width: '80.5vw', height: '100vh', border: '1px solid #ccc' }
            : { width: '100%', height: '100vh' }
        }> */}
        <MapView defaultStyleId="googleRoad">
          <MapOverlay />
          <MapGeofence />
          <MapAccuracy positions={filteredPositions} />
          <MapLiveRoutes />
          <MapPositions
            positions={filteredPositions}
            onClick={onMarkerClick}
            selectedPosition={selectedPosition}
            showStatus
          />
          <MapDefaultCamera />
          <MapSelectedDevice />
          <PoiMap />
        </MapView>
        <MapScale />
        <MapCurrentLocation />
        <MapGeocoder />
        {!features.disableEvents && (
          <MapNotification enabled={eventsAvailable} onClick={onEventsClick} />
        )}
      {/* </div> */}
    </>
  );
};

export default MainMap;
