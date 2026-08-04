import { useId, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/styles';
import { map } from './core/MapView';
import { formatTime, getStatusColor } from '../common/util/formatter';
import { mapIconKey } from './core/preloadImages';
import { useAttributePreference } from '../common/util/preferences';
import { useCatchCallback } from '../reactHelper';
import { findFonts } from './core/mapUtil';

const PULSE_WAVES = [0, 1, 2, 3, 4, 5, 6];
const PULSE_FRAME_INTERVAL_MS = 100;

const MapPositions = ({
  positions,
  onClick,
  showStatus,
  titleField,
  markerColor,
}) => {
  const id = useId();
  const clusters = `${id}-clusters`;
  const selected = `${id}-selected`;

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const mapCluster = useAttributePreference('mapCluster', true);
  const createFeature = (devices, position) => {
    const device = devices[position.deviceId];
    return {
      id: position.id,
      deviceId: position.deviceId,
      name: device.name,
      fixTime: formatTime(position.fixTime, 'seconds'),
      category: mapIconKey(device.category),
      color: markerColor || (showStatus ? getStatusColor(device.status) : 'neutral'),
    };
  };

  const onMouseEnter = () => map.getCanvas().style.cursor = 'pointer';
  const onMouseLeave = () => map.getCanvas().style.cursor = '';

  const onMapClick = useCallback((event) => {
    if (!event.defaultPrevented && onClick) {
      onClick(event.lngLat.lat, event.lngLat.lng);
    }
  }, [onClick]);

  const onMarkerClick = useCallback((event) => {
    event.preventDefault();
    const feature = event.features[0];
    if (onClick) {
      onClick(feature.properties.id, feature.properties.deviceId);
    }
  }, [onClick]);

  const onClusterClick = useCatchCallback(async (event) => {
    event.preventDefault();
    const features = map.queryRenderedFeatures(event.point, {
      layers: [clusters],
    });
    const clusterId = features[0].properties.cluster_id;
    const zoom = await map.getSource(id).getClusterExpansionZoom(clusterId);
    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom,
    });
  }, [clusters]);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: mapCluster,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    map.addSource(selected, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    [id, selected].forEach((source) => {
      PULSE_WAVES.forEach((wave) => {
        map.addLayer({
          id: `pulse-${source}-${wave}`,
          type: 'circle',
          source,
          filter: [
            'all',
            ['!has', 'point_count'],
            ['==', 'color', 'info'],
          ],
          paint: {
            'circle-color': '#1677ff',
            'circle-radius': 11,
            'circle-opacity': 0,
            'circle-blur': 0.08,
            'circle-stroke-color': '#1677ff',
            'circle-stroke-width': 2,
            'circle-stroke-opacity': 0.3,
          },
        });
      });
      map.addLayer({
        id: source,
        type: 'symbol',
        source,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': source === selected ? 'marker-{color}-selected' : 'marker-{color}',
          'icon-size': iconScale,
          // The GPS coordinate represents the pointed tip, not the center of the pin.
          // Status marker images keep 5 px of transparent padding below that tip.
          'icon-anchor': 'bottom',
          'icon-offset': [0, 5],
          'icon-allow-overlap': true,
          'text-field': [
            'step',
            ['zoom'],
            '',
            17,
            ['get', titleField || 'name'],
          ],
          'text-allow-overlap': true,
          'text-anchor': 'left',
          'text-offset': [1.35, 0],
          'text-font': findFonts(map),
          'text-size': 12,
        },
        paint: {
          'text-color': [
            'case',
            ['==', ['get', 'color'], 'info'],
            '#163a5f',
            '#5f6368',
          ],
          'text-halo-color': '#ffffff',
          'text-halo-width': 3,
          'text-halo-blur': 0.6,
        },
      });
      map.on('mouseenter', source, onMouseEnter);
      map.on('mouseleave', source, onMouseLeave);
      map.on('click', source, onMarkerClick);
    });
    map.addLayer({
      id: clusters,
      type: 'symbol',
      source: id,
      filter: ['has', 'point_count'],
      layout: {
        'icon-image': 'background',
        'icon-size': iconScale,
        'text-field': '{point_count_abbreviated}',
        'text-font': findFonts(map),
        'text-size': 28,
      },
      paint: {
        'text-color': 'red',
      },
    });

    map.on('mouseenter', clusters, onMouseEnter);
    map.on('mouseleave', clusters, onMouseLeave);
    map.on('click', clusters, onClusterClick);
    map.on('click', onMapClick);

    let animationFrame;
    let lastPulseFrame = 0;
    const animatePulse = (timestamp) => {
      if (timestamp - lastPulseFrame >= PULSE_FRAME_INTERVAL_MS) {
        lastPulseFrame = timestamp;
        [id, selected].forEach((source) => {
          PULSE_WAVES.forEach((wave) => {
            const phase = ((timestamp / 30000) + wave / PULSE_WAVES.length) % 1;
            // A ripple travels outwards once and becomes fully transparent before
            // its phase restarts, so it never visibly contracts to the marker.
            const progress = phase;
            const fadeIn = Math.min(1, progress / 0.12);
            const fadeOpacity = 0.42 * fadeIn * ((1 - progress) ** 1.8);
            // Circle layers are measured in pixels, so scale them with the map zoom.
            // This keeps the ripples visually tied to the marker when the map is zoomed.
            const zoomScale = Math.max(0.35, Math.min(1.2, 0.4 + ((map.getZoom() - 10) * 0.1)));
            const pulseLayer = `pulse-${source}-${wave}`;
            if (map.getLayer(pulseLayer)) {
              // Close, staggered rings expand, dissolve, and disappear in sequence.
              map.setPaintProperty(pulseLayer, 'circle-radius', (11 + progress * 44) * zoomScale);
              map.setPaintProperty(pulseLayer, 'circle-stroke-opacity', fadeOpacity);
              map.setPaintProperty(
                pulseLayer,
                'circle-stroke-width',
                Math.max(0.45, 2.25 - progress * 1.55) * Math.max(0.7, zoomScale),
              );
              map.setPaintProperty(pulseLayer, 'circle-blur', 0.05 + progress * 0.22);
            }
          });
        });
      }
      animationFrame = requestAnimationFrame(animatePulse);
    };
    animationFrame = requestAnimationFrame(animatePulse);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      map.off('mouseenter', clusters, onMouseEnter);
      map.off('mouseleave', clusters, onMouseLeave);
      map.off('click', clusters, onClusterClick);
      map.off('click', onMapClick);

      if (map.getLayer(clusters)) {
        map.removeLayer(clusters);
      }

      [id, selected].forEach((source) => {
        map.off('mouseenter', source, onMouseEnter);
        map.off('mouseleave', source, onMouseLeave);
        map.off('click', source, onMarkerClick);

        if (map.getLayer(source)) {
          map.removeLayer(source);
        }
        PULSE_WAVES.forEach((wave) => {
          if (map.getLayer(`pulse-${source}-${wave}`)) {
            map.removeLayer(`pulse-${source}-${wave}`);
          }
        });
        if (map.getSource(source)) {
          map.removeSource(source);
        }
      });
    };
  }, [mapCluster, clusters, onMarkerClick, onClusterClick]);

  useEffect(() => {
    [id, selected].forEach((source) => {
      map.getSource(source)?.setData({
        type: 'FeatureCollection',
        features: positions.filter((it) => devices.hasOwnProperty(it.deviceId))
          .filter((it) => (source === id ? it.deviceId !== selectedDeviceId : it.deviceId === selectedDeviceId))
          .map((position) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [position.longitude, position.latitude],
            },
            properties: createFeature(devices, position),
          })),
      });
    });
  }, [
    mapCluster,
    clusters,
    onMarkerClick,
    onClusterClick,
    devices,
    markerColor,
    positions,
    showStatus,
  ]);

  return null;
};

export default MapPositions;
