import { useId, useCallback, useEffect } from 'react';
import { map } from './core/MapView';

const MAX_VISIBLE_ROUTE_POINTS = 2500;

const onMouseEnter = () => {
  map.getCanvas().style.cursor = 'pointer';
};
const onMouseLeave = () => {
  map.getCanvas().style.cursor = '';
};

const MapRoutePoints = ({ positions, onClick }) => {
  const id = useId();

  const onMarkerClick = useCallback((event) => {
    event.preventDefault();
    const feature = event.features[0];
    if (onClick) {
      onClick(feature.properties.id, feature.properties.index);
    }
  }, [onClick]);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    map.addLayer({
      id,
      type: 'circle',
      source: id,
      paint: {
        'circle-radius': 3,
        'circle-color': '#1e88e5',
        'circle-opacity': 0.95,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    });

    map.on('mouseenter', id, onMouseEnter);
    map.on('mouseleave', id, onMouseLeave);
    map.on('click', id, onMarkerClick);

    return () => {
      map.off('mouseenter', id, onMouseEnter);
      map.off('mouseleave', id, onMouseLeave);
      map.off('click', id, onMarkerClick);

      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [id, onMarkerClick]);

  useEffect(() => {
    const step = Math.max(1, Math.ceil(positions.length / MAX_VISIBLE_ROUTE_POINTS));
    const visiblePositions = positions
      .map((position, index) => ({ position, index }))
      .filter(({ index }) => (
        index === 0 || index === positions.length - 1 || index % step === 0
      ));

    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: visiblePositions.map(({ position, index }) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [position.longitude, position.latitude],
        },
        properties: {
          index,
          id: position.id,
        },
      })),
    });
  }, [id, positions]);

  return null;
};

export default MapRoutePoints;
