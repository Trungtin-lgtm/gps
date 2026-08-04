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

const MapPositions = ({ positions, onClick, showStatus, titleField }) => {
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
      color: showStatus ? getStatusColor(device.status) : 'neutral',
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
      map.addLayer({
        id: `pulse-${source}`,
        type: 'circle',
        source,
        filter: [
          'all',
          ['!has', 'point_count'],
          ['==', 'color', 'info'],
        ],
        paint: {
          'circle-color': '#1677ff',
          'circle-radius': 12,
          'circle-opacity': 0.3,
          'circle-blur': 0.25,
        },
      });
      map.addLayer({
        id: source,
        type: 'symbol',
        source,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': source === selected ? 'marker-{color}-selected' : 'marker-{color}',
          'icon-size': iconScale ,
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
        'text-color': 'red'
      },
    });

    map.on('mouseenter', clusters, onMouseEnter);
    map.on('mouseleave', clusters, onMouseLeave);
    map.on('click', clusters, onClusterClick);
    map.on('click', onMapClick);

    let animationFrame;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animatePulse = (timestamp) => {
      const progress = (timestamp % 1800) / 1800;
      [id, selected].forEach((source) => {
        const pulseLayer = `pulse-${source}`;
        if (map.getLayer(pulseLayer)) {
          map.setPaintProperty(pulseLayer, 'circle-radius', 12 + progress * 14);
          map.setPaintProperty(pulseLayer, 'circle-opacity', 0.32 * (1 - progress));
        }
      });
      animationFrame = requestAnimationFrame(animatePulse);
    };
    if (!reduceMotion) {
      animationFrame = requestAnimationFrame(animatePulse);
    }

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
        if (map.getLayer(`pulse-${source}`)) {
          map.removeLayer(`pulse-${source}`);
        }
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
  }, [mapCluster, clusters, onMarkerClick, onClusterClick, devices, positions]);

  return null;
};

export default MapPositions;
